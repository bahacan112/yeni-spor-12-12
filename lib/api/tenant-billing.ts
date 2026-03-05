import { getSupabaseServer } from "@/lib/supabase/server";
import { TenantSubscription, TenantPayment, PlatformPlan } from "@/lib/types";
import { getSupabaseService } from "@/lib/supabase/service";

export async function getTenantBillingData() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!userData?.tenant_id) throw new Error("Tenant not found");
  const tenantId = userData.tenant_id;

  let { data: subRaw } = await supabase
    .from("tenant_subscriptions")
    .select("*, plan:platform_plans(*)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);
  let subRow = subRaw?.[0] || null;
  if (!subRow) {
    const svc = getSupabaseService();
    const { data: subSvc } = await svc
      .from("tenant_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1);
    subRow = subSvc?.[0] || null;
  }

  let planRow: any | null = subRow?.plan ?? null;
  if (!planRow && subRow?.plan_id) {
    const { data: pr } = await supabase
      .from("platform_plans")
      .select("*")
      .eq("id", subRow.plan_id)
      .single();
    planRow = pr || null;
    if (!planRow) {
      const svc = getSupabaseService();
      const { data: prSvc } = await svc
        .from("platform_plans")
        .select("*")
        .eq("id", subRow.plan_id)
        .single();
      planRow = prSvc || null;
    }
  }

  const mappedPlan: PlatformPlan | undefined = planRow
    ? {
        id: planRow.id,
        name: planRow.name,
        slug: planRow.slug,
        description: planRow.description,
        monthlyPrice: planRow.monthly_price,
        yearlyPrice: planRow.yearly_price,
        maxStudents: planRow.max_students,
        maxGroups: planRow.max_groups,
        maxBranches: planRow.max_branches,
        maxInstructors: planRow.max_instructors,
        features: planRow.features,
        isActive: planRow.is_active,
        trialEnabled: planRow.trial_enabled,
        trialDefaultDays: planRow.trial_default_days,
        isFeatured: planRow.is_featured,
        sortOrder: planRow.sort_order,
        createdAt: planRow.created_at,
        updatedAt: planRow.updated_at,
      }
    : undefined;

  const subscription: TenantSubscription | null = subRow
    ? {
        id: subRow.id,
        tenantId: subRow.tenant_id,
        planId: subRow.plan_id,
        plan: mappedPlan,
        billingPeriod: subRow.billing_period,
        amount: subRow.amount,
        status: subRow.status,
        currentPeriodStart: subRow.current_period_start,
        currentPeriodEnd: subRow.current_period_end,
        cancelledAt: subRow.cancelled_at,
        paymentMethod: subRow.payment_method,
        autoRenew: subRow.auto_renew,
        isTrial:
          (subRow as any).is_trial ??
          ((subRow as any).payment_method === "trial" ? true : undefined),
        trialDays: (subRow as any).trial_days ?? null,
        pendingDowngradePlanId:
          (subRow as any).pending_downgrade_plan_id ?? null,
        pendingDowngradeEffectiveAt:
          (subRow as any).pending_downgrade_effective_at ?? null,
        createdAt: subRow.created_at,
        updatedAt: subRow.updated_at,
      }
    : null;

  const { data: paymentsRaw } = await supabase
    .from("tenant_payments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("paid_at", { ascending: false });

  const payments: TenantPayment[] = (paymentsRaw || []).map((p: any) => ({
    id: p.id,
    tenantId: p.tenant_id,
    subscriptionId: p.subscription_id,
    amount: p.amount,
    paymentMethod: p.payment_method,
    status: p.status,
    invoiceNo: p.invoice_no,
    description: p.description,
    paidAt: p.paid_at,
    createdAt: p.created_at,
  }));

  const [
    { count: studentCount },
    { count: groupCount },
    { count: branchCount },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("groups")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("branches")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
  ]);

  const usage = {
    students: studentCount || 0,
    groups: groupCount || 0,
    branches: branchCount || 0,
    limits: {
      maxStudents: subscription?.plan?.maxStudents ?? null,
      maxGroups: subscription?.plan?.maxGroups ?? null,
      maxBranches: subscription?.plan?.maxBranches ?? null,
    },
  };

  return { subscription, payments, usage, tenantId };
}
