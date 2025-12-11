import { getSupabaseServer } from "@/lib/supabase/server";
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
  User
} from "@/lib/types";

// Admin Dashboard Stats
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await getSupabaseServer();

  // Run queries in parallel
  const [
    tenantsRes,
    activeTenantsRes,
    expiredTenantsRes,
    subscriptionsRes,
    paymentsRes,
    studentsRes
  ] = await Promise.all([
    supabase.from("tenants").select("*", { count: "exact", head: true }),
    supabase.from("tenants").select("*", { count: "exact", head: true }).eq("subscription_status", "active"),
    supabase.from("tenants").select("*", { count: "exact", head: true }).or("subscription_status.eq.expired,subscription_status.eq.inactive"),
    supabase.from("tenant_subscriptions").select("*", { count: "exact", head: true }),
    supabase.from("tenant_payments").select("amount"),
    supabase.from("students").select("*", { count: "exact", head: true })
  ]);

  const totalTenants = tenantsRes.count || 0;
  const activeTenants = activeTenantsRes.count || 0;
  const expiredTenants = expiredTenantsRes.count || 0;
  const totalStudents = studentsRes.count || 0;
  
  // Calculate revenue
  const totalRevenue = paymentsRes.data?.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
  
  // Calculate monthly revenue (payments in current month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { data: monthlyPayments } = await supabase
    .from("tenant_payments")
    .select("amount")
    .gte("paid_at", startOfMonth.toISOString());
    
  const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
  
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
    recentSignups: recentSignups || 0
  };
}

// Recent Tenants
export async function getRecentTenants(limit = 5): Promise<Tenant[]> {
  const supabase = await getSupabaseServer();
  
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
    
  return (data || []).map(tenant => ({
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
    updatedAt: tenant.updated_at
  }));
}

// Recent Payments
export async function getRecentPayments(limit = 5): Promise<TenantPayment[]> {
  const supabase = await getSupabaseServer();
  
  const { data } = await supabase
    .from("tenant_payments")
    .select("*, tenant:tenants(*)")
    .order("paid_at", { ascending: false })
    .limit(limit);
    
  return (data || []).map(payment => ({
    id: payment.id,
    tenantId: payment.tenant_id,
    tenant: {
      id: payment.tenant.id,
      name: payment.tenant.name,
      slug: payment.tenant.slug,
      primaryColor: payment.tenant.primary_color,
      // ... map other fields if needed, simplified for now
    } as any, 
    subscriptionId: payment.subscription_id,
    amount: payment.amount,
    paymentMethod: payment.payment_method,
    status: payment.status,
    invoiceNo: payment.invoice_no,
    description: payment.description,
    paidAt: payment.paid_at,
    createdAt: payment.created_at
  }));
}

// Expiring Subscriptions
export async function getExpiringSubscriptions(days = 30): Promise<TenantSubscription[]> {
  const supabase = await getSupabaseServer();
  
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
    
  return (data || []).map(sub => ({
    id: sub.id,
    tenantId: sub.tenant_id,
    tenant: {
      id: sub.tenant.id,
      name: sub.tenant.name,
      slug: sub.tenant.slug,
      primaryColor: sub.tenant.primary_color,
      // ... map other fields
    } as any,
    planId: sub.plan_id,
    plan: {
      id: sub.plan.id,
      name: sub.plan.name,
      // ... map other fields
    } as any,
    billingPeriod: sub.billing_period,
    amount: sub.amount,
    status: sub.status,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    autoRenew: sub.auto_renew,
    paymentMethod: sub.payment_method,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at
  }));
}

// All Tenants
export async function getAllTenants(): Promise<Tenant[]> {
  const supabase = await getSupabaseServer();
  
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });
    
  return (data || []).map(tenant => ({
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
    updatedAt: tenant.updated_at
  }));
}

// All Plans
export async function getAllPlans(): Promise<PlatformPlan[]> {
  const supabase = await getSupabaseServer();
  
  const { data } = await supabase
    .from("platform_plans")
    .select("*")
    .order("sort_order", { ascending: true });
    
  return (data || []).map(plan => ({
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
    sortOrder: plan.sort_order,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at
  }));
}

// All Subscriptions
export async function getAllSubscriptions(): Promise<TenantSubscription[]> {
  const supabase = await getSupabaseServer();
  
  const { data } = await supabase
    .from("tenant_subscriptions")
    .select("*, tenant:tenants(name, email, primary_color), plan:platform_plans(name)")
    .order("created_at", { ascending: false });
    
  return (data || []).map(sub => ({
    id: sub.id,
    tenantId: sub.tenant_id,
    tenant: {
        name: sub.tenant.name,
        email: sub.tenant.email,
        primaryColor: sub.tenant.primary_color
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
    createdAt: sub.created_at,
    updatedAt: sub.updated_at
  }));
}

// All Payments
export async function getAllPayments(): Promise<TenantPayment[]> {
  const supabase = await getSupabaseServer();
  
  const { data } = await supabase
    .from("tenant_payments")
    .select("*, tenant:tenants(name)")
    .order("created_at", { ascending: false });
    
  return (data || []).map(payment => ({
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
    createdAt: payment.created_at
  }));
}

// Platform Settings
export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  const supabase = await getSupabaseServer();
  
  const { data } = await supabase
    .from("platform_settings")
    .select("*")
    .order("key", { ascending: true });
    
  return (data || []).map(setting => ({
    id: setting.id,
    key: setting.key,
    value: setting.value,
    type: setting.type,
    description: setting.description,
    updatedAt: setting.updated_at
  }));
}

// Notifications
export async function getAllNotifications(): Promise<any> {
    const supabase = await getSupabaseServer();
    
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
        logs: (logs || []).map(log => ({
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
            createdAt: log.created_at
        })),
        templates: (templates || []).map(tpl => ({
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
            updatedAt: tpl.updated_at
        })),
        scheduled: (scheduled || []).map(sched => ({
            id: sched.id,
            templateId: sched.template_id,
            template: sched.template,
            triggerType: sched.trigger_type,
            triggerDays: sched.trigger_days,
            targetAudience: sched.target_audience,
            isActive: sched.is_active,
            lastRunAt: sched.last_run_at,
            createdAt: sched.created_at,
            updatedAt: sched.updated_at
        }))
    };
}

// Admin Users
export async function getAdminUsers(): Promise<User[]> {
    const supabase = await getSupabaseServer();
    
    // Fetch users with roles that are relevant for admin (super_admin, support, etc.)
    // Note: Adjust the query based on your actual user roles and table structure
    const { data } = await supabase
        .from("users")
        .select("*")
        .in("role", ["super_admin", "support"])
        .order("created_at", { ascending: false });

    return (data || []).map(user => ({
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
        updatedAt: user.updated_at
    }));
}

// Tenant Details
export async function getTenantDetails(id: string): Promise<any> {
    const supabase = await getSupabaseServer();
    
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
        subscription: subscription ? {
            ...subscription,
            planId: subscription.plan_id,
            billingPeriod: subscription.billing_period,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            autoRenew: subscription.auto_renew,
            paymentMethod: subscription.payment_method,
        } : null,
        payments: (payments || []).map(p => ({
            ...p,
            tenantId: p.tenant_id,
            subscriptionId: p.subscription_id,
            paymentMethod: p.payment_method,
            invoiceNo: p.invoice_no,
            paidAt: p.paid_at,
        }))
    };
}

// Admin Reports Data
export async function getAdminReportsData(): Promise<any> {
    const supabase = await getSupabaseServer();
    
    // Get monthly revenue for the last 6 months
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    
    const { data: payments } = await supabase
        .from("tenant_payments")
        .select("amount, paid_at")
        .gte("paid_at", sixMonthsAgo.toISOString())
        .eq("status", "completed");
        
    const { data: tenants } = await supabase
        .from("tenants")
        .select("created_at, subscription_status")
        .gte("created_at", sixMonthsAgo.toISOString());

    // Group by month
    const monthlyData = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(sixMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const monthName = d.toLocaleString('tr-TR', { month: 'long' });
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const monthPayments = payments?.filter(p => p.paid_at.startsWith(monthKey)) || [];
        const monthTenants = tenants?.filter(t => t.created_at.startsWith(monthKey)) || [];
        
        // Count active tenants up to this month
        // This is an approximation. Ideally we'd need historical state, but for now we'll just count cumulative signups - churn
        // For simplicity in this view, let's just show total active tenants currently
        
        monthlyData.push({
            month: monthName,
            revenue: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
            newSchools: monthTenants.length,
            activeSchools: 0 // Placeholder, calculating historical active count is complex
        });
    }

    return monthlyData;
}
