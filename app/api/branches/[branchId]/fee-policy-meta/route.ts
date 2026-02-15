import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ branchId: string }> }
) {
  try {
    const { branchId } = await context.params;
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (!userData?.tenant_id)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("branch_fee_policy_meta")
      .select("*")
      .eq("tenant_id", userData.tenant_id)
      .eq("branch_id", branchId)
      .maybeSingle();
    if (error) {
      const msg = String(error.message || "");
      if (msg.includes("relation") && msg.includes("branch_fee_policy_meta")) {
        return NextResponse.json({ meta: null, warning: "migration_required" });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ meta: data || null });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ branchId: string }> }
) {
  try {
    const { branchId } = await context.params;
    const body = await req.json();
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (!userData?.tenant_id)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const payload = {
      tenant_id: userData.tenant_id,
      branch_id: branchId,
      due_date_policy: body.due_date_policy,
      due_date_day: body.due_date_day,
      fee_model_applies_to: body.fee_model_applies_to,
      min_participation_auto: body.min_participation_auto,
      attendance_lock_day: body.attendance_lock_day,
      freeze_min_duration_days: body.freeze_min_duration_days,
      freeze_same_month_reopen_policy: body.freeze_same_month_reopen_policy,
      freeze_reporting_visibility: body.freeze_reporting_visibility,
      recompute_protect_paid: body.recompute_protect_paid,
      recompute_protect_partial: body.recompute_protect_partial,
      recompute_locked_after_day: body.recompute_locked_after_day,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("branch_fee_policy_meta")
      .upsert(payload, { onConflict: "tenant_id,branch_id" })
      .select("*")
      .single();
    if (error) {
      const msg = String(error.message || "");
      if (msg.includes("relation") && msg.includes("branch_fee_policy_meta")) {
        return NextResponse.json(
          { error: "migration_required" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ meta: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
