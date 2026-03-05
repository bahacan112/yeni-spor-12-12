import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";
import { sendIdentify } from "@/lib/dittofeed/identify";
import { sendEvent } from "@/lib/dittofeed/events";
import { tenantScopedAuthEmail } from "@/lib/auth/tenant-auth-email";

function maskEmail(email: string) {
  const e = String(email || "");
  const at = e.indexOf("@");
  if (at <= 1) return e ? "***" : "";
  return `${e[0]}***${e.slice(at - 1)}`;
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const applicationId = String(body?.applicationId || "");
    const studentId = body?.studentId ? String(body.studentId) : "";
    if (!applicationId)
      return NextResponse.json(
        { error: "applicationId gerekli" },
        { status: 400 },
      );

    const svc = getSupabaseService();
    const { data: actor } = await svc
      .from("users")
      .select("id,role,tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    const actorRole = String(actor?.role || "");
    const allowed =
      actorRole === "super_admin" ||
      actorRole === "tenant_admin" ||
      actorRole === "branch_manager";
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: app } = await svc
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();
    if (!app)
      return NextResponse.json(
        { error: "Başvuru bulunamadı" },
        { status: 404 },
      );
    const email: string = app.email || "";
    if (!email)
      return NextResponse.json(
        { error: "Başvuruda e-posta yok" },
        { status: 400 },
      );

    const admin = (svc as any).auth?.admin;
    if (!admin)
      return NextResponse.json(
        { error: "Auth admin kullanılamıyor" },
        { status: 500 },
      );

    const pwd = "sifre1234";
    const authEmail = tenantScopedAuthEmail(String(app.tenant_id || ""), email);
    let authUserId = "";
    let authCreated = false;
    const createRes = await admin.createUser({
      email: authEmail,
      password: pwd,
      email_confirm: true,
      user_metadata: {
        role: "student",
        tenant_id: app.tenant_id,
        full_name: app.full_name,
        real_email: email,
        must_change_password: true,
      },
    });
    const createdUser = (createRes as any)?.data?.user;
    if (createdUser?.id) {
      authUserId = String(createdUser.id);
      authCreated = true;
    } else {
      const msg = String((createRes as any)?.error?.message || "");
      const isDup =
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered") ||
        msg.toLowerCase().includes("exists");
      if (!isDup) {
        return NextResponse.json(
          { error: msg || "Kullanıcı oluşturulamadı" },
          { status: 400 },
        );
      }
      const listRes = await admin.listUsers({ perPage: 1000, page: 1 });
      const existing = (listRes as any)?.data?.users?.find(
        (u: any) =>
          String(u?.email || "").toLowerCase() === authEmail.toLowerCase(),
      );
      if (!existing?.id) {
        return NextResponse.json(
          { error: "Mevcut kullanıcı bulunamadı" },
          { status: 400 },
        );
      }
      authUserId = String(existing.id);
    }

    if (!authCreated) {
      try {
        await admin.updateUserById(authUserId, {
          password: pwd,
          user_metadata: {
            role: "student",
            tenant_id: app.tenant_id,
            full_name: app.full_name,
            real_email: email,
            must_change_password: true,
          },
        });
      } catch {}
    }

    await svc.from("users").upsert(
      {
        id: authUserId,
        tenant_id: app.tenant_id,
        role: "student",
        email,
        full_name: app.full_name,
        password_hash: "auth-managed",
        is_active: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    let targetStudentId = studentId;
    if (!targetStudentId) {
      const { data: stu } = await svc
        .from("students")
        .select("id")
        .eq("tenant_id", app.tenant_id)
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1);
      targetStudentId = stu?.[0]?.id || "";
    }
    if (targetStudentId) {
      await svc
        .from("students")
        .update({ user_id: authUserId, updated_at: new Date().toISOString() })
        .eq("id", targetStudentId);
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    const { data: tenantRow } = await svc
      .from("tenants")
      .select("slug")
      .eq("id", app.tenant_id)
      .maybeSingle();
    const slug = String((tenantRow as any)?.slug || "");
    const loginUrl = slug
      ? `${origin.replace(/\/$/, "")}/site/${slug}/login`
      : `${origin.replace(/\/$/, "")}/auth/login`;

    let dittoOk = false;
    let dittoError = "";
    let dittoStep = "";
    try {
      try {
        await sendIdentify({
          userId: authUserId,
          traits: { email, fullName: app.full_name, role: "student" },
        });
      } catch (e: any) {
        dittoStep = "identify";
        throw e;
      }
      try {
        await sendEvent("student_account_created", {
          userId: authUserId,
          properties: { email, login_url: loginUrl },
        });
      } catch (e: any) {
        dittoStep = "track";
        throw e;
      }
      dittoOk = true;
    } catch (e: any) {
      dittoError = String(e?.message || "dittofeed_error");
      await svc.from("notification_logs").insert({
        tenant_id: app.tenant_id,
        recipient_type: "student",
        recipient_id: authUserId,
        recipient_contact: email,
        channel: "email",
        subject: "Hesabınız oluşturuldu",
        content: `Merhaba ${app.full_name}, hesabınız oluşturuldu. İlk giriş şifreniz: sifre1234. Giriş yaptıktan sonra şifrenizi belirlemeniz istenecektir. Giriş: ${loginUrl}`,
        status: "pending",
        error_message: dittoError,
        created_at: new Date().toISOString(),
      } as any);
    }

    await svc.from("audit_logs").insert({
      user_id: actor?.id || null,
      tenant_id: app.tenant_id,
      action: authCreated
        ? "student_auth_user_created"
        : "student_auth_user_exists",
      entity_type: "applications",
      entity_id: applicationId,
      new_values: {
        application_id: applicationId,
        student_id: targetStudentId || null,
        user_id: authUserId,
        email: maskEmail(email),
        must_change_password: true,
      },
      created_at: new Date().toISOString(),
    } as any);

    await svc.from("audit_logs").insert({
      user_id: actor?.id || null,
      tenant_id: app.tenant_id,
      action: dittoOk ? "dittofeed_track_sent" : "dittofeed_track_failed",
      entity_type: "applications",
      entity_id: applicationId,
      new_values: {
        application_id: applicationId,
        user_id: authUserId,
        event: "student_account_created",
        step: dittoOk ? null : dittoStep || "unknown",
        error: dittoOk ? null : dittoError,
      },
      created_at: new Date().toISOString(),
    } as any);

    return NextResponse.json({ ok: true, userId: authUserId });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
