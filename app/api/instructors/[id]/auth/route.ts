import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const action = String(body.action || "");
    const password = String(body.password || "");

    if (!id || !action) {
      return NextResponse.json(
        { error: "Eksik bilgi: id ve action zorunlu" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: actor } = await supabase
      .from("users")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();
    if (!actor || !actor.role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: instructor, error: instErr } = await supabase
      .from("instructors")
      .select("id, tenant_id, user_id, email, full_name, status")
      .eq("id", id)
      .single();
    if (instErr || !instructor) {
      return NextResponse.json(
        { error: "Eğitmen bulunamadı" },
        { status: 404 }
      );
    }
    const isSuperAdmin = actor.role === "super_admin";
    const isTenantAdmin = actor.role === "tenant_admin";
    const isBranchManager = actor.role === "branch_manager";
    const sameTenant =
      actor?.tenant_id &&
      String(instructor.tenant_id) === String(actor.tenant_id);
    if (!(isSuperAdmin || ((isTenantAdmin || isBranchManager) && sameTenant))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const svc = getSupabaseService();

    if (action === "create_user") {
      if (instructor.user_id) {
        return NextResponse.json(
          { error: "Eğitmen için kullanıcı zaten mevcut" },
          { status: 400 }
        );
      }
      if (!instructor.email) {
        return NextResponse.json(
          { error: "Eğitmenin e-posta adresi gerekli" },
          { status: 400 }
        );
      }
      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: "Şifre en az 8 karakter olmalı" },
          { status: 400 }
        );
      }

      const { data: created, error: createErr } =
        await svc.auth.admin.createUser({
          email: instructor.email,
          password,
          user_metadata: {
            full_name: instructor.full_name,
          },
          app_metadata: {
            role: "instructor",
            tenant_id: instructor.tenant_id,
          },
        } as any);
      if (createErr || !created?.user) {
        return NextResponse.json(
          { error: "Kullanıcı oluşturulamadı" },
          { status: 500 }
        );
      }
      const newUserId = created.user.id;

      const { data: existingUser } = await svc
        .from("users")
        .select("id")
        .eq("id", newUserId)
        .single();
      if (!existingUser) {
        await svc.from("users").insert({
          id: newUserId,
          email: instructor.email,
          full_name: instructor.full_name || "Eğitmen",
          role: "instructor",
          tenant_id: instructor.tenant_id,
          password_hash: "auth-managed",
        });
      } else {
        await svc
          .from("users")
          .update({ role: "instructor", tenant_id: instructor.tenant_id })
          .eq("id", newUserId);
      }

      const { error: updErr } = await svc
        .from("instructors")
        .update({ user_id: newUserId, status: "active" })
        .eq("id", instructor.id);
      if (updErr) {
        return NextResponse.json(
          { error: "Eğitmen kaydı güncellenemedi" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, userId: newUserId });
    }

    if (action === "reset_password") {
      if (!instructor.user_id) {
        return NextResponse.json(
          { error: "Eğitmenin kullanıcı hesabı yok" },
          { status: 400 }
        );
      }
      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: "Şifre en az 8 karakter olmalı" },
          { status: 400 }
        );
      }
      const { error: upErr } = await svc.auth.admin.updateUserById(
        instructor.user_id,
        { password } as any
      );
      if (upErr) {
        return NextResponse.json(
          { error: "Şifre sıfırlanamadı" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "block_user") {
      if (!instructor.user_id) {
        return NextResponse.json(
          { error: "Eğitmenin kullanıcı hesabı yok" },
          { status: 400 }
        );
      }
      await svc.auth.admin.updateUserById(instructor.user_id, {
        ban_duration: "indefinite",
      } as any);
      const { error: updErr } = await svc
        .from("instructors")
        .update({ status: "inactive" })
        .eq("id", instructor.id);
      if (updErr) {
        return NextResponse.json(
          { error: "Eğitmen durumu güncellenemedi" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === "unblock_user") {
      if (!instructor.user_id) {
        return NextResponse.json(
          { error: "Eğitmenin kullanıcı hesabı yok" },
          { status: 400 }
        );
      }
      await svc.auth.admin.updateUserById(instructor.user_id, {
        ban_duration: null,
      } as any);
      const { error: updErr } = await svc
        .from("instructors")
        .update({ status: "active" })
        .eq("id", instructor.id);
      if (updErr) {
        return NextResponse.json(
          { error: "Eğitmen durumu güncellenemedi" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Bilinmeyen action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
