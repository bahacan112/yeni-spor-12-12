import { getSupabaseServer } from "@/lib/supabase/server";
import { DashboardStats, Training, Application, MonthlyDue } from "@/lib/types";

export async function getDashboardData(branchId?: string) {
  const supabase = await getSupabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get user's tenant_id and slug
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("tenant_id, role, tenant:tenants(slug)")
    .eq("id", user.id)
    .single();

  if (userError) {
    console.error("User tenant fetch error:", userError);
    throw new Error("User data fetch error");
  }

  // Handle super_admin or users without tenant
  if (!userData?.tenant_id) {
    // If super_admin, return empty/dummy data instead of throwing error
    if (userData?.role === "super_admin") {
      return {
        stats: {
          totalStudents: 0,
          activeStudents: 0,
          totalInstructors: 0,
          totalGroups: 0,
          todayTrainings: 0,
          pendingPayments: 0,
          pendingApplications: 0,
          monthlyRevenue: 0,
        },
        todayTrainings: [],
        recentApplications: [],
        pendingPayments: [],
        tenantSlug: "admin",
      };
    }

    // For other users without tenant, throw error
    console.error("User has no tenant_id");
    throw new Error("Tenant not found");
  }

  const tenantId = userData.tenant_id;
  // @ts-ignore
  const tenantSlug = userData.tenant?.slug || "unknown";

  // 1. Get Stats
  const stats: DashboardStats = {
    totalStudents: 0,
    activeStudents: 0,
    totalInstructors: 0,
    totalGroups: 0,
    todayTrainings: 0,
    pendingPayments: 0,
    pendingApplications: 0,
    monthlyRevenue: 0,
  };

  // Run queries in parallel
  const studentsQuery = supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  const activeStudentsQuery = supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "active");
  const instructorsQuery = supabase
    .from("instructors")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  const groupsQuery = supabase
    .from("groups")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  const trainingsCountQuery = supabase
    .from("trainings")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("training_date", new Date().toISOString().split("T")[0]);
  const duesCountQuery = supabase
    .from("monthly_dues")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending");
  const applicationsCountQuery = supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending");
  const revenueQuery = supabase
    .from("payments")
    .select("amount")
    .eq("tenant_id", tenantId)
    .gte(
      "payment_date",
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    );

  // Dashboard genel görünüm: tenant geneli. Branch filtresi uygulanmaz.

  const [
    studentsRes,
    activeStudentsRes,
    instructorsRes,
    groupsRes,
    todayTrainingsRes,
    pendingPaymentsRes,
    pendingApplicationsRes,
    revenueRes,
  ] = await Promise.all([
    studentsQuery,
    activeStudentsQuery,
    instructorsQuery,
    groupsQuery,
    trainingsCountQuery,
    duesCountQuery,
    applicationsCountQuery,
    revenueQuery,
  ]);

  if (branchId) {
    // Note: count/head queries cannot be easily post-filtered; rerun with branch filters if needed
  }

  stats.totalStudents = studentsRes.count || 0;
  stats.activeStudents = activeStudentsRes.count || 0;
  stats.totalInstructors = instructorsRes.count || 0;
  stats.totalGroups = groupsRes.count || 0;
  stats.todayTrainings = todayTrainingsRes.count || 0;
  stats.pendingPayments = pendingPaymentsRes.count || 0;
  stats.pendingApplications = pendingApplicationsRes.count || 0;

  if (revenueRes.data) {
    stats.monthlyRevenue = revenueRes.data.reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0
    );
  }

  // 2. Get Today's Trainings
  let trainingsQuery = supabase
    .from("trainings")
    .select(
      "*, group:groups(name), instructor:instructors(full_name), venue:venues(name)"
    )
    .eq("tenant_id", tenantId)
    .eq("training_date", new Date().toISOString().split("T")[0])
    .order("start_time", { ascending: true })
    .limit(5);
  // Branch filtresi dashboard genel görünümde uygulanmıyor
  const { data: todayTrainings } = await trainingsQuery;

  // 3. Get Recent Applications
  const { data: recentApplications } = await supabase
    .from("applications")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  // 4. Get Pending Payments (Dues)
  let duesQuery = supabase
    .from("monthly_dues")
    .select("*, student:students(full_name)")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(5);
  // Branch filtresi dashboard genel görünümde uygulanmıyor
  const { data: pendingPayments } = await duesQuery;

  return {
    stats,
    todayTrainings: (todayTrainings || []) as any[], // Casting because of join types usually mismatching exact interfaces
    recentApplications: (recentApplications || []) as Application[],
    pendingPayments: (pendingPayments || []) as any[],
    tenantSlug,
  };
}
