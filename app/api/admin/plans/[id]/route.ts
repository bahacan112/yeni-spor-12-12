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

  const id = (await params).id;
  const body = await req.json();

  const updates: Record<string, any> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.slug === "string") updates.slug = body.slug;
  if (typeof body.description === "string")
    updates.description = body.description;
  if (body.monthlyPrice !== undefined)
    updates.monthly_price = Number(body.monthlyPrice);
  if (body.yearlyPrice !== undefined)
    updates.yearly_price = Number(body.yearlyPrice);
  if (body.maxStudents !== undefined)
    updates.max_students =
      body.maxStudents === null ? null : Number(body.maxStudents);
  if (body.maxGroups !== undefined)
    updates.max_groups =
      body.maxGroups === null ? null : Number(body.maxGroups);
  if (body.maxBranches !== undefined)
    updates.max_branches =
      body.maxBranches === null ? null : Number(body.maxBranches);
  if (body.maxInstructors !== undefined)
    updates.max_instructors =
      body.maxInstructors === null ? null : Number(body.maxInstructors);
  if (Array.isArray(body.features)) updates.features = body.features;
  if (typeof body.isActive === "boolean") updates.is_active = body.isActive;
  if (typeof body.isFeatured === "boolean")
    updates.is_featured = body.isFeatured;
  if (typeof body.trialEnabled === "boolean")
    updates.trial_enabled = body.trialEnabled;
  if (body.trialDefaultDays !== undefined)
    updates.trial_default_days =
      body.trialDefaultDays === null ? null : Number(body.trialDefaultDays);
  if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : supabase;
  const { data: updated, error } = await service
    .from("platform_plans")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: "Update failed" }, { status: 400 });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    description: updated.description,
    monthlyPrice: Number(updated.monthly_price),
    yearlyPrice: Number(updated.yearly_price),
    maxStudents: updated.max_students,
    maxGroups: updated.max_groups,
    maxBranches: updated.max_branches,
    maxInstructors: updated.max_instructors,
    features: updated.features || [],
    isActive: updated.is_active,
    trialEnabled: (updated as any).trial_enabled,
    trialDefaultDays: (updated as any).trial_default_days,
    isFeatured: (updated as any).is_featured,
    sortOrder: updated.sort_order,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  });
}

export async function DELETE(
  _req: NextRequest,
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

  const id = (await params).id;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : supabase;
  const { error } = await service.from("platform_plans").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
