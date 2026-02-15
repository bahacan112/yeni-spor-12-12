import { getSupabaseServer } from "@/lib/supabase/server";
import { MonthlyDue, Group } from "@/lib/types";

export async function getDuesData(branchId?: string, month?: string) {
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
  let validBranchId = branchId;
  if (branchId) {
    const { data: branchExists } = await supabase
      .from("branches")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", branchId)
      .single();
    if (!branchExists?.id) {
      validBranchId = undefined;
    }
  }

  let duesQuery = supabase
    .from("monthly_dues")
    .select("*, student:students(*)")
    .eq("tenant_id", tenantId)
    .order("due_date", { ascending: false });
  if (validBranchId) {
    duesQuery = duesQuery.eq("branch_id", validBranchId);
  }
  if (month) {
    const dt = new Date(month);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const start = `${y}-${m}-01`;
    const lastDay = new Date(y, dt.getMonth() + 1, 0).getDate();
    const end = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    duesQuery = duesQuery.gte("due_date", start).lte("due_date", end);
  }
  const { data: dues } = await duesQuery;
  let groupsQuery = supabase
    .from("groups")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");
  if (validBranchId) {
    groupsQuery = groupsQuery.eq("branch_id", validBranchId);
  }
  const { data: groups } = await groupsQuery;
  return {
    dues: (dues || []).map((d: any) => mapMonthlyDueFromJoin(d)),
    groups: (groups || []) as Group[],
    tenantId,
  };
}

function mapMonthlyDueFromJoin(data: any): MonthlyDue {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    studentId: data.student_id,
    student: data.student ? mapStudentFromJoin(data.student) : undefined,
    subscriptionId: data.subscription_id,
    dueMonth: data.due_month,
    amount: data.amount,
    paidAmount: data.paid_amount,
    dueDate: data.due_date,
    status: data.status,
    snapshotState: data.snapshot_state,
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

function mapStudentFromJoin(data: any) {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    branchId: data.branch_id,
    userId: data.user_id,
    studentNo: data.student_no,
    fullName: data.full_name,
    birthDate: data.birth_date,
    isLicensed: data.is_licensed,
    licenseNo: data.license_no,
    licenseIssuedAt: data.license_issued_at,
    licenseExpiresAt: data.license_expires_at,
    licenseFederation: data.license_federation,
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
  };
}
