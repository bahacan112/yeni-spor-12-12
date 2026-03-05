import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ studentId: string }> },
) {
  const p = await ctx.params;
  const studentId = String(p?.studentId || "");
  if (!studentId) {
    return NextResponse.json({ error: "studentId gerekli" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: actor } = await svc
    .from("users")
    .select("id,role,tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  const role = String(actor?.role || "");
  const allowed =
    role === "super_admin" || role === "tenant_admin" || role === "branch_manager";
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: stu, error: stuErr } = await svc
    .from("students")
    .select("id,tenant_id,user_id,full_name,email")
    .eq("id", studentId)
    .maybeSingle();
  if (stuErr) return NextResponse.json({ error: stuErr.message }, { status: 400 });
  if (!stu) return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });

  const tenantId = String((stu as any).tenant_id || "");
  if (role !== "super_admin" && tenantId && String(actor?.tenant_id || "") !== tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authUserId = String((stu as any).user_id || "");
  const tables = [
    "attendance",
    "student_fee_overrides",
    "student_groups",
    "student_month_freezes",
    "student_notes",
    "student_performance",
    "student_subscriptions",
    "monthly_dues",
    "payments",
    "orders",
  ];

  const deleted: Record<string, boolean> = {};

  for (const t of tables) {
    const r = await svc.from(t).delete().eq("student_id", studentId);
    deleted[t] = !r.error;
  }

  const { error: delStuErr } = await svc.from("students").delete().eq("id", studentId);
  if (delStuErr) {
    return NextResponse.json(
      { error: delStuErr.message, deleted },
      { status: 400 },
    );
  }

  if (authUserId) {
    try {
      await svc.from("users").delete().eq("id", authUserId);
    } catch {}
    try {
      const admin = (svc as any).auth?.admin;
      if (admin?.deleteUser) {
        await admin.deleteUser(authUserId);
      }
    } catch {}
  }

  try {
    const email = String((stu as any).email || "");
    await svc.from("audit_logs").insert({
      user_id: actor?.id || null,
      tenant_id: tenantId || null,
      action: "student_purged",
      entity_type: "students",
      entity_id: studentId,
      new_values: {
        student_id: studentId,
        auth_user_id: authUserId || null,
        email: email ? `${email[0] || ""}***` : null,
      },
      created_at: new Date().toISOString(),
    } as any);
  } catch {}

  return NextResponse.json({ ok: true, deleted, studentId });
}
