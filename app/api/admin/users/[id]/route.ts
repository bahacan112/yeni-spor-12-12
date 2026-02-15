import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!userData || userData.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, any> = {};

  if (typeof body.role === "string") {
    const allowed = [
      "super_admin",
      "support",
      "tenant_admin",
      "branch_manager",
      "instructor",
      "student",
    ];
    if (!allowed.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updates.role = body.role;
  }

  if (typeof body.isActive === "boolean") {
    updates.is_active = body.isActive;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : supabase;

  const { id } = await params;

  const { data: updated, error } = await service
    .from("users")
    .update(updates)
    .eq("id", id)
    .select(
      "id, tenant_id, email, full_name, phone, avatar_url, role, is_active, last_login_at, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }

  return NextResponse.json({
    id: updated.id,
    tenantId: updated.tenant_id,
    email: updated.email,
    fullName: updated.full_name,
    phone: updated.phone,
    avatarUrl: updated.avatar_url,
    role: updated.role,
    isActive: updated.is_active,
    lastLoginAt: updated.last_login_at,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  });
}
