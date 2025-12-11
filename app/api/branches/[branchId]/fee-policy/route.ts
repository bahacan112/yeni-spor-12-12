import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ branchId: string }> }
) {
  const { branchId } = await context.params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!userData?.tenant_id) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("branch_fee_policies")
    .select("*")
    .eq("tenant_id", userData.tenant_id)
    .eq("branch_id", branchId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ policy: data || null });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ branchId: string }> }
) {
  const { branchId } = await context.params;
  const body = await req.json();
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!userData?.tenant_id) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const payload = {
    tenant_id: userData.tenant_id,
    branch_id: branchId,
    fee_model: body.fee_model,
    freeze_enabled: body.freeze_enabled,
    freeze_before_month_start_only: body.freeze_before_month_start_only,
    yearly_freeze_limit: body.yearly_freeze_limit,
    freeze_fee_policy: body.freeze_fee_policy,
    planned_lessons_per_month: body.planned_lessons_per_month,
    min_full_attendance: body.min_full_attendance,
    discount_range_min: body.discount_range_min,
    discount_range_max: body.discount_range_max,
    discount_fee_percent: body.discount_fee_percent,
    free_range_max: body.free_range_max,
    conflict_priority: body.conflict_priority,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("branch_fee_policies")
    .upsert(payload, { onConflict: "tenant_id,branch_id" })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ policy: data });
}
