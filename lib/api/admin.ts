import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";
import {
  AdminDashboardStats,
  Tenant,
  TenantPayment,
  TenantSubscription,
  PlatformPlan,
  NotificationTemplate,
  NotificationLog,
  ScheduledNotification,
  PlatformSetting,
  User,
} from "@/lib/types";

// Admin Dashboard Stats
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  // Run queries in parallel
  const [
    tenantsRes,
    activeTenantsRes,
    expiredTenantsRes,
    subscriptionsRes,
    paymentsRes,
    studentsRes,
  ] = await Promise.all([
    supabase.from("tenants").select("*", { count: "exact", head: true }),
    supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active"),
    supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .or("subscription_status.eq.expired,subscription_status.eq.inactive"),
    supabase
      .from("tenant_subscriptions")
      .select("*", { count: "exact", head: true }),
    supabase.from("tenant_payments").select("amount"),
    supabase.from("students").select("*", { count: "exact", head: true }),
  ]);

  const totalTenants = tenantsRes.count || 0;
  const activeTenants = activeTenantsRes.count || 0;
  const expiredTenants = expiredTenantsRes.count || 0;
  const totalStudents = studentsRes.count || 0;

  // Calculate revenue
  const totalRevenue =
    paymentsRes.data?.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    ) || 0;

  // Calculate monthly revenue (payments in current month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyPayments } = await supabase
    .from("tenant_payments")
    .select("amount")
    .gte("paid_at", startOfMonth.toISOString());

  const monthlyRevenue =
    monthlyPayments?.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    ) || 0;

  // Recent signups (this month)
  const { count: recentSignups } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  // Pending payments (failed or pending status in tenant_payments)
  const { count: pendingPayments } = await supabase
    .from("tenant_payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return {
    totalTenants,
    activeTenants,
    expiredTenants,
    totalRevenue,
    monthlyRevenue,
    totalStudents,
    pendingPayments: pendingPayments || 0,
    recentSignups: recentSignups || 0,
  };
}

// Recent Tenants
export async function getRecentTenants(limit = 5): Promise<Tenant[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  const { data } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logo_url,
    primaryColor: tenant.primary_color,
    secondaryColor: tenant.secondary_color,
    email: tenant.email,
    phone: tenant.phone,
    websiteEnabled: tenant.website_enabled,
    subscriptionPlan: tenant.subscription_plan,
    subscriptionStatus: tenant.subscription_status,
    subscriptionExpiresAt: tenant.subscription_expires_at,
    isLimited: tenant.is_limited,
    maxStudents: tenant.max_students,
    maxGroups: tenant.max_groups,
    createdAt: tenant.created_at,
    updatedAt: tenant.updated_at,
  }));
}

// Recent Payments
export async function getRecentPayments(limit = 5): Promise<TenantPayment[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  const { data } = await supabase
    .from("tenant_payments")
    .select("*, tenant:tenants(*)")
    .order("paid_at", { ascending: false })
    .limit(limit);

  return (data || []).map((payment) => ({
    id: payment.id,
    tenantId: payment.tenant_id,
    tenant: payment.tenant
      ? ({
          id: payment.tenant.id,
          name: payment.tenant.name,
          slug: payment.tenant.slug,
          primaryColor: payment.tenant.primary_color,
        } as any)
      : undefined,
    subscriptionId: payment.subscription_id,
    amount: payment.amount,
    paymentMethod: payment.payment_method,
    status: payment.status,
    invoiceNo: payment.invoice_no,
    description: payment.description,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
  }));
}

// Expiring Subscriptions
export async function getExpiringSubscriptions(
  days = 30
): Promise<TenantSubscription[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  const { data } = await supabase
    .from("tenant_subscriptions")
    .select("*, tenant:tenants(*), plan:platform_plans(*)")
    .eq("status", "active")
    .lte("current_period_end", future.toISOString())
    .gte("current_period_end", now.toISOString())
    .order("current_period_end", { ascending: true });

  return (data || []).map((sub) => ({
    id: sub.id,
    tenantId: sub.tenant_id,
    tenant: sub.tenant
      ? ({
          id: sub.tenant.id,
          name: sub.tenant.name,
          slug: sub.tenant.slug,
          primaryColor: sub.tenant.primary_color,
        } as any)
      : undefined,
    planId: sub.plan_id,
    plan: sub.plan
      ? ({
          id: sub.plan.id,
          name: sub.plan.name,
        } as any)
      : undefined,
    billingPeriod: sub.billing_period,
    amount: sub.amount,
    status: sub.status,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    autoRenew: sub.auto_renew,
    paymentMethod: sub.payment_method,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at,
  }));
}

// All Tenants
export async function getAllTenants(): Promise<Tenant[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  const { data } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  return (data || []).map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logo_url,
    primaryColor: tenant.primary_color,
    secondaryColor: tenant.secondary_color,
    email: tenant.email,
    phone: tenant.phone,
    websiteEnabled: tenant.website_enabled,
    subscriptionPlan: tenant.subscription_plan,
    subscriptionStatus: tenant.subscription_status,
    subscriptionExpiresAt: tenant.subscription_expires_at,
    isLimited: tenant.is_limited,
    maxStudents: tenant.max_students,
    maxGroups: tenant.max_groups,
    createdAt: tenant.created_at,
    updatedAt: tenant.updated_at,
  }));
}

// All Plans
export async function getAllPlans(): Promise<PlatformPlan[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  const { data } = await supabase
    .from("platform_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data || []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    monthlyPrice: plan.monthly_price,
    yearlyPrice: plan.yearly_price,
    maxStudents: plan.max_students,
    maxGroups: plan.max_groups,
    maxBranches: plan.max_branches,
    maxInstructors: plan.max_instructors,
    features: plan.features,
    isActive: plan.is_active,
    trialEnabled: (plan as any).trial_enabled,
    trialDefaultDays: (plan as any).trial_default_days,
    isFeatured: (plan as any).is_featured,
    sortOrder: plan.sort_order,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  }));
}

// All Subscriptions
export async function getAllSubscriptions(): Promise<TenantSubscription[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  const { data } = await supabase
    .from("tenant_subscriptions")
    .select(
      "*, tenant:tenants(name, email, primary_color), plan:platform_plans(name)"
    )
    .order("created_at", { ascending: false });

  return (data || []).map((sub) => ({
    id: sub.id,
    tenantId: sub.tenant_id,
    tenant: {
      name: sub.tenant.name,
      email: sub.tenant.email,
      primaryColor: sub.tenant.primary_color,
    } as any,
    planId: sub.plan_id,
    plan: sub.plan as any,
    billingPeriod: sub.billing_period,
    amount: sub.amount,
    status: sub.status,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    autoRenew: sub.auto_renew,
    paymentMethod: sub.payment_method,
    isTrial: (sub as any).is_trial,
    trialDays: (sub as any).trial_days,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at,
  }));
}

// All Payments
export async function getAllPayments(): Promise<TenantPayment[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  const { data } = await supabase
    .from("tenant_payments")
    .select("*, tenant:tenants(name)")
    .order("created_at", { ascending: false });

  return (data || []).map((payment) => ({
    id: payment.id,
    tenantId: payment.tenant_id,
    tenant: payment.tenant as any,
    subscriptionId: payment.subscription_id,
    amount: payment.amount,
    paymentMethod: payment.payment_method,
    status: payment.status,
    invoiceNo: payment.invoice_no,
    description: payment.description,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
  }));
}

// Platform Settings
export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  const { data } = await supabase
    .from("platform_settings")
    .select("*")
    .order("key", { ascending: true });

  return (data || []).map((setting) => ({
    id: setting.id,
    key: setting.key,
    value: setting.value,
    type: setting.type,
    description: setting.description,
    updatedAt: setting.updated_at,
  }));
}

// Notifications
export async function getAllNotifications(): Promise<any> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  // Fetch logs
  const { data: logs } = await supabase
    .from("notification_logs")
    .select("*, tenant:tenants(name), template:notification_templates(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch templates
  const { data: templates } = await supabase
    .from("notification_templates")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch scheduled
  const { data: scheduled } = await supabase
    .from("scheduled_notifications")
    .select("*, template:notification_templates(name)")
    .order("created_at", { ascending: false });

  return {
    logs: (logs || []).map((log) => ({
      id: log.id,
      tenantId: log.tenant_id,
      tenant: log.tenant,
      templateId: log.template_id,
      template: log.template,
      recipientType: log.recipient_type,
      recipientContact: log.recipient_contact,
      channel: log.channel,
      subject: log.subject,
      content: log.content,
      status: log.status,
      errorMessage: log.error_message,
      sentAt: log.sent_at,
      deliveredAt: log.delivered_at,
      createdAt: log.created_at,
    })),
    templates: (templates || []).map((tpl) => ({
      id: tpl.id,
      type: tpl.type,
      channel: tpl.channel,
      name: tpl.name,
      subject: tpl.subject,
      content: tpl.content,
      variables: tpl.variables,
      isActive: tpl.is_active,
      isSystem: tpl.is_system,
      createdAt: tpl.created_at,
      updatedAt: tpl.updated_at,
    })),
    scheduled: (scheduled || []).map((sched) => ({
      id: sched.id,
      templateId: sched.template_id,
      template: sched.template,
      triggerType: sched.trigger_type,
      triggerDays: sched.trigger_days,
      targetAudience: sched.target_audience,
      isActive: sched.is_active,
      lastRunAt: sched.last_run_at,
      createdAt: sched.created_at,
      updatedAt: sched.updated_at,
    })),
  };
}

// Admin Users
export async function getAdminUsers(): Promise<User[]> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();
  const { data } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (data || []).map((user) => ({
    id: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    role: user.role,
    isActive: user.is_active,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }));
}

// Tenant Details
export async function getTenantDetails(id: string): Promise<any> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  // Fetch tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (!tenant) return null;

  // Fetch subscription
  const { data: subscription } = await supabase
    .from("tenant_subscriptions")
    .select("*, plan:platform_plans(*)")
    .eq("tenant_id", id)
    .eq("status", "active")
    .single();

  // Fetch payments
  const { data: payments } = await supabase
    .from("tenant_payments")
    .select("*")
    .eq("tenant_id", id)
    .order("paid_at", { ascending: false });

  // Fetch counts
  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", id);

  const { count: branchCount } = await supabase
    .from("branches")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", id);

  const { count: groupCount } = await supabase
    .from("groups")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", id);

  return {
    ...tenant,
    logoUrl: tenant.logo_url,
    primaryColor: tenant.primary_color,
    secondaryColor: tenant.secondary_color,
    websiteEnabled: tenant.website_enabled,
    subscriptionPlan: tenant.subscription_plan,
    subscriptionStatus: tenant.subscription_status,
    subscriptionExpiresAt: tenant.subscription_expires_at,
    isLimited: tenant.is_limited,
    maxStudents: tenant.max_students,
    maxGroups: tenant.max_groups,
    createdAt: tenant.created_at,
    updatedAt: tenant.updated_at,
    // Extra stats
    currentStudentCount: studentCount || 0,
    branchCount: branchCount || 0,
    currentGroupCount: groupCount || 0,
    subscription: subscription
      ? {
          ...subscription,
          planId: subscription.plan_id,
          billingPeriod: subscription.billing_period,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          autoRenew: subscription.auto_renew,
          paymentMethod: subscription.payment_method,
          isTrial: (subscription as any).is_trial,
          trialDays: (subscription as any).trial_days,
        }
      : null,
    payments: (payments || []).map((p) => ({
      ...p,
      tenantId: p.tenant_id,
      subscriptionId: p.subscription_id,
      paymentMethod: p.payment_method,
      invoiceNo: p.invoice_no,
      paidAt: p.paid_at,
    })),
  };
}

// Admin Reports Data
export async function getAdminReportsData(): Promise<any> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : await getSupabaseServer();

  // Last 6 months starting from current month inclusive
  const today = new Date();
  const windowStart = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const windowStartISO = windowStart.toISOString();
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Fetch payments (completed) within window
  const { data: payments } = await supabase
    .from("tenant_payments")
    .select("amount, paid_at")
    .gte("paid_at", windowStartISO)
    .eq("status", "completed");

  // Fetch tenant signups within window
  const { data: tenants } = await supabase
    .from("tenants")
    .select("created_at")
    .gte("created_at", windowStartISO);

  // Fetch active subscriptions overlapping the window
  const { data: activeSubs } = await supabase
    .from("tenant_subscriptions")
    .select("current_period_start, current_period_end, status")
    .eq("status", "active")
    .gte("current_period_end", windowStartISO);

  const monthlyData: {
    month: string;
    revenue: number;
    newSchools: number;
    activeSchools: number;
  }[] = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date(
      windowStart.getFullYear(),
      windowStart.getMonth() + i,
      1
    );
    const monthEnd = new Date(
      windowStart.getFullYear(),
      windowStart.getMonth() + i + 1,
      1
    );
    const monthLabel = monthStart.toLocaleString("tr-TR", { month: "long" });
    const monthKey = `${monthStart.getFullYear()}-${String(
      monthStart.getMonth() + 1
    ).padStart(2, "0")}`;

    const monthRevenue = (payments || [])
      .filter((p) => (p.paid_at || "").startsWith(monthKey))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const monthNewSchools = (tenants || []).filter((t) =>
      (t.created_at || "").startsWith(monthKey)
    ).length;

    const activeCount = (activeSubs || []).filter((s) => {
      const start = new Date(s.current_period_start);
      const end = new Date(s.current_period_end);
      return start < monthEnd && end >= monthStart;
    }).length;

    monthlyData.push({
      month: monthLabel,
      revenue: monthRevenue,
      newSchools: monthNewSchools,
      activeSchools: activeCount,
    });
  }

  return monthlyData;
}
