import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(req: NextRequest) {
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
  const tenantId = String(body.tenantId || "");
  const planId = String(body.planId || "");
  const trialDaysReq =
    body.trialDays !== undefined ? Number(body.trialDays) : undefined;
  if (!tenantId || !planId) {
    return NextResponse.json(
      { error: "tenantId ve planId zorunlu" },
      { status: 400 }
    );
  }

  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : supabase;

  const { data: plan } = await svc
    .from("platform_plans")
    .select("id, name, monthly_price, trial_enabled, trial_default_days")
    .eq("id", planId)
    .single();
  if (!plan)
    return NextResponse.json({ error: "Plan bulunamadı" }, { status: 404 });
  if (!plan.trial_enabled)
    return NextResponse.json(
      { error: "Bu plan için trial açılamaz" },
      { status: 400 }
    );

  const { data: settings } = await svc
    .from("platform_settings")
    .select("key, value")
    .in("key", ["trial_days"]); // global fallback

  const map = new Map<string, string>();
  for (const row of settings || []) map.set(row.key, String(row.value ?? ""));
  const fallbackDays = Number(map.get("trial_days") || 14);
  const trialDays =
    trialDaysReq !== undefined && !Number.isNaN(trialDaysReq)
      ? Math.max(1, trialDaysReq)
      : plan.trial_default_days ?? fallbackDays;

  const now = new Date();
  const end = addDays(now, trialDays);

  const { data: sub, error } = await svc
    .from("tenant_subscriptions")
    .insert({
      tenant_id: tenantId,
      plan_id: planId,
      billing_period: "monthly",
      amount: 0,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      auto_renew: false,
      payment_method: "trial",
      is_trial: true,
      trial_days: trialDays,
    })
    .select("*")
    .single();

  let finalSub = sub;
  let isTrialRes = (sub as any)?.is_trial ?? true;
  let trialDaysRes = (sub as any)?.trial_days ?? trialDays;

  if (error) {
    const { data: sub2, error: error2 } = await svc
      .from("tenant_subscriptions")
      .insert({
        tenant_id: tenantId,
        plan_id: planId,
        billing_period: "monthly",
        amount: 0,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        auto_renew: false,
        payment_method: "trial",
      })
      .select("*")
      .single();
    if (error2)
      return NextResponse.json(
        { error: "Trial oluşturulamadı" },
        { status: 400 }
      );
    finalSub = sub2;
    isTrialRes = true;
    trialDaysRes = trialDays;
  }

  await svc
    .from("tenants")
    .update({ subscription_status: "active", is_limited: false })
    .eq("id", tenantId);

  return NextResponse.json({
    id: (finalSub as any).id,
    tenantId: (finalSub as any).tenant_id,
    planId: (finalSub as any).plan_id,
    billingPeriod: (finalSub as any).billing_period,
    amount: (finalSub as any).amount,
    status: (finalSub as any).status,
    currentPeriodStart: (finalSub as any).current_period_start,
    currentPeriodEnd: (finalSub as any).current_period_end,
    autoRenew: (finalSub as any).auto_renew,
    paymentMethod: (finalSub as any).payment_method,
    isTrial: isTrialRes,
    trialDays: trialDaysRes,
    createdAt: (finalSub as any).created_at,
    updatedAt: (finalSub as any).updated_at,
  });
}
