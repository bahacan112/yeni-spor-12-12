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
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ).toISOString(),
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
      0,
    );
  }

  // 2. Get Today's Trainings
  let trainingsQuery = supabase
    .from("trainings")
    .select(
      "*, group:groups(id, name), instructor:instructors(full_name, photo_url), venue:venues(name)",
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
    .select("*, student:students(*)")
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(5);
  // Branch filtresi dashboard genel görünümde uygulanmıyor
  const { data: pendingPaymentsRaw } = await duesQuery;
  const pendingPayments: MonthlyDue[] = (pendingPaymentsRaw || []).map(
    (d: any) => ({
      id: d.id,
      tenantId: d.tenant_id,
      branchId: d.branch_id,
      studentId: d.student_id,
      student: d.student
        ? {
            id: d.student.id,
            tenantId: d.student.tenant_id,
            branchId: d.student.branch_id,
            userId: d.student.user_id,
            studentNo: d.student.student_no,
            fullName: d.student.full_name || "",
            birthDate: d.student.birth_date,
            isLicensed: d.student.is_licensed,
            licenseNo: d.student.license_no,
            licenseIssuedAt: d.student.license_issued_at,
            licenseExpiresAt: d.student.license_expires_at,
            licenseFederation: d.student.license_federation,
            gender: d.student.gender,
            phone: d.student.phone,
            email: d.student.email,
            address: d.student.address,
            emergencyContactName: d.student.emergency_contact_name,
            emergencyContactPhone: d.student.emergency_contact_phone,
            guardianName: d.student.guardian_name,
            guardianPhone: d.student.guardian_phone,
            guardianEmail: d.student.guardian_email,
            photoUrl: d.student.photo_url,
            registrationDate: d.student.registration_date,
            status: d.student.status,
            notes: d.student.notes,
            createdAt: d.student.created_at,
            updatedAt: d.student.updated_at,
          }
        : undefined,
      subscriptionId: d.subscription_id,
      dueMonth: d.due_month,
      amount: Number(d.amount || 0),
      paidAmount: Number(d.paid_amount || 0),
      dueDate: d.due_date,
      status: d.status,
      snapshotState: d.snapshot_state,
      paidAt: d.paid_at,
      notes: d.notes,
      policyModelApplied: d.policy_model_applied,
      participationCount: d.participation_count,
      freezeApplied: d.freeze_applied,
      appliedDiscountPercent: d.applied_discount_percent,
      computedAmount:
        d.computed_amount != null ? Number(d.computed_amount) : undefined,
      originalAmount:
        d.original_amount != null ? Number(d.original_amount) : undefined,
      calculationNotes: d.calculation_notes,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }),
  );

  // Fetch detailed attendance counts for these trainings
  const trainingIds = (todayTrainings || []).map((t: any) => t.id);
  const attendanceStats: Record<string, { present: number, absent: number, late: number, excused: number }> = {};
  
  if (trainingIds.length > 0) {
    const { data: attData } = await supabase
      .from("attendance")
      .select("training_id, status")
      .in("training_id", trainingIds);
    
    (attData || []).forEach((row: any) => {
      const tid = row.training_id;
      if (!attendanceStats[tid]) {
        attendanceStats[tid] = { present: 0, absent: 0, late: 0, excused: 0 };
      }
      if (row.status === "present") attendanceStats[tid].present++;
      else if (row.status === "absent") attendanceStats[tid].absent++;
      else if (row.status === "late") attendanceStats[tid].late++;
      else if (row.status === "excused") attendanceStats[tid].excused++;
    });
  }

  // To know total unmarked students, we need group student counts
  const groupIds = Array.from(new Set((todayTrainings || []).map((t: any) => t.group?.id).filter(Boolean)));
  const groupStudentCounts: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: scData } = await supabase
      .from("student_groups")
      .select("group_id")
      .in("group_id", groupIds)
      .eq("status", "active");
    (scData || []).forEach((row: any) => {
      groupStudentCounts[row.group_id] = (groupStudentCounts[row.group_id] || 0) + 1;
    });
  }

  const mappedTodayTrainings = (todayTrainings || []).map((t: any) => {
    const tStats = attendanceStats[t.id] || { present: 0, absent: 0, late: 0, excused: 0 };
    const groupTotal = t.group ? (groupStudentCounts[t.group.id] || 0) : 0;
    const totalMarked = tStats.present + tStats.absent + tStats.late + tStats.excused;
    const unmarked = Math.max(0, groupTotal - totalMarked);

    return {
      id: t.id,
      title: t.title,
      trainingDate: t.training_date,
      startTime: t.start_time,
      endTime: t.end_time,
      status: t.status,
      venue: t.venue ? { name: t.venue.name } : undefined,
      instructor: t.instructor ? { fullName: t.instructor.full_name, photoUrl: t.instructor.photo_url } : undefined,
      group: t.group ? { name: t.group.name } : undefined,
      attendanceStats: {
        present: tStats.present,
        absent: tStats.absent,
        late: tStats.late,
        excused: tStats.excused,
        unmarked: t.group ? unmarked : undefined,
      }
    };
  });

  return {
    stats,
    todayTrainings: mappedTodayTrainings,
    recentApplications: (recentApplications || []) as Application[],
    pendingPayments,
    tenantSlug,
  };
}
