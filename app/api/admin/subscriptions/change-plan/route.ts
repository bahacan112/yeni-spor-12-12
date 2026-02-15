import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!userData || userData.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const tenantId = String(body.tenantId || "");
  const planId = String(body.planId || "");
  if (!tenantId || !planId) {
    return NextResponse.json({ error: "tenantId ve planId zorunlu" }, { status: 400 });
  }

  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseService() : supabase;
  const { data: plan } = await svc
    .from("platform_plans")
    .select("id, monthly_price")
    .eq("id", planId)
    .single();
  if (!plan) return NextResponse.json({ error: "Plan bulunamadı" }, { status: 404 });
  const amount = Number(plan.monthly_price || 0);
  const now = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);

  const { data: subs } = await svc
    .from("tenant_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);
  const sub = subs?.[0];

  if (!sub) {
    const { data: created, error } = await svc
      .from("tenant_subscriptions")
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        billing_period: "monthly",
        amount,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        auto_renew: true,
        payment_method: "admin_change",
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({
      id: created.id,
      tenantId: created.tenant_id,
      planId: created.plan_id,
      amount: created.amount,
      currentPeriodEnd: created.current_period_end,
    });
  }

  const { data: updated, error } = await svc
    .from("tenant_subscriptions")
    .update({
      plan_id: planId,
      amount,
      updated_at: now.toISOString(),
    })
    .eq("id", sub.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    id: updated.id,
    tenantId: updated.tenant_id,
    planId: updated.plan_id,
    amount: updated.amount,
  });
}

