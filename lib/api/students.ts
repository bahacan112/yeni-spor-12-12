import { getSupabaseServer } from "@/lib/supabase/server";
import { Student, Group, MonthlyDue, Branch } from "@/lib/types";

export async function getStudentsData(branchId?: string) {
  const supabase = await getSupabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get user's tenant_id
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!userData?.tenant_id) {
    throw new Error("Tenant not found");
  }

  const tenantId = userData.tenant_id;

  // Fetch students
  let studentsQuery = supabase
    .from("students")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (branchId) {
    studentsQuery = studentsQuery.eq("branch_id", branchId);
  }
  const { data: students, error: studentsError } = await studentsQuery;

  if (studentsError) {
    console.error("Error fetching students:", studentsError);
    throw new Error("Failed to fetch students");
  }

  // Fetch groups (for filtering)
  let groupsQuery = supabase
    .from("groups")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });
  if (branchId) {
    groupsQuery = groupsQuery.eq("branch_id", branchId);
  }
  const { data: groups, error: groupsError } = await groupsQuery;

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
    throw new Error("Failed to fetch groups");
  }

  // Fetch branches
  const { data: branches, error: branchesError } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (branchesError) {
    console.error("Error fetching branches:", branchesError);
  }

  const mapStudent = (data: any): Student => ({
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    userId: data.user_id,
    studentNo: data.student_no,
    fullName: data.full_name || "",
    birthDate: data.birth_date,
    gender: data.gender,
    phone: data.phone,
    email: data.email,
    address: data.address,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
    guardianName: data.guardian_name,
    guardianPhone: data.guardian_phone,
    guardianEmail: data.guardian_email,
    photoUrl: data.photo_url,
    registrationDate: data.registration_date,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });

  return {
    students: (students || []).map(mapStudent),
    groups: (groups || []) as Group[],
    branches: (branches || []) as Branch[],
    tenantId,
  };
}

export async function getStudentDetails(studentId: string) {
  const supabase = await getSupabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get user's tenant_id
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!userData?.tenant_id) {
    throw new Error("Tenant not found");
  }

  const tenantId = userData.tenant_id;

  // Fetch student
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .eq("tenant_id", tenantId)
    .single();

  if (studentError || !student) {
    console.error("Error fetching student:", studentError);
    return null;
  }

  // Fetch student's groups
  const { data: studentGroups, error: groupsError } = await supabase
    .from("student_groups")
    .select("*, group:groups(*)")
    .eq("student_id", studentId)
    .eq("status", "active");

  if (groupsError) {
    console.error("Error fetching student groups:", groupsError);
  }

  const groups = studentGroups?.map((sg) => sg.group).filter((g) => g) || [];

  // Fetch monthly dues
  const { data: monthlyDues, error: duesError } = await supabase
    .from("monthly_dues")
    .select("*")
    .eq("student_id", studentId)
    .order("due_month", { ascending: false });

  if (duesError) {
    console.error("Error fetching monthly dues:", duesError);
  }

  const mapStudent = (data: any): Student => ({
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    userId: data.user_id,
    studentNo: data.student_no,
    fullName: data.full_name || "",
    birthDate: data.birth_date,
    gender: data.gender,
    phone: data.phone,
    email: data.email,
    address: data.address,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
    guardianName: data.guardian_name,
    guardianPhone: data.guardian_phone,
    guardianEmail: data.guardian_email,
    photoUrl: data.photo_url,
    registrationDate: data.registration_date,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });

  return {
    student: mapStudent(student),
    groups: (groups as any[]).map(mapGroupFromJoin) as Group[],
    monthlyDues: (monthlyDues || []).map(mapMonthlyDueFromRaw) as MonthlyDue[],
  };
}

function mapGroupFromJoin(data: any): Group {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    name: data.name,
    description: data.description,
    sportType: data.sport_type,
    ageGroup: data.age_group,
    birthDateFrom: data.birth_date_from,
    birthDateTo: data.birth_date_to,
    licenseRequirement: data.license_requirement,
    capacity: data.capacity,
    monthlyFee: data.monthly_fee,
    instructorId: data.instructor_id,
    schedule: data.schedule,
    status: data.status,
    studentCount: data.student_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapMonthlyDueFromRaw(data: any): MonthlyDue {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    studentId: data.student_id,
    dueMonth: data.due_month,
    amount: data.amount,
    paidAmount: data.paid_amount,
    dueDate: data.due_date,
    status: data.status,
    paidAt: data.paid_at,
    notes: data.notes,
    policyModelApplied: data.policy_model_applied,
    participationCount: data.participation_count,
    freezeApplied: data.freeze_applied,
    appliedDiscountPercent: data.applied_discount_percent,
    computedAmount: data.computed_amount,
    originalAmount: data.original_amount,
    calculationNotes: data.calculation_notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getNewStudentFormData() {
  const supabase = await getSupabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get user's tenant_id
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!userData?.tenant_id) {
    throw new Error("Tenant not found");
  }

  const tenantId = userData.tenant_id;

  // Fetch branches
  const { data: branches, error: branchesError } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (branchesError) {
    console.error("Error fetching branches:", branchesError);
  }

  // Fetch groups
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
  }

  return {
    branches: (branches || []) as Branch[],
    groups: (groups || []) as Group[],
    tenantId,
  };
}
