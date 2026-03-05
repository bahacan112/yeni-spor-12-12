import { getSupabaseServer } from "@/lib/supabase/server";
import { Payment, Expense } from "@/lib/types";

export interface AccountingStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  pendingPayments: number;
}

export async function getAccountingData(branchId?: string) {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.tenant_id) throw new Error("Tenant not found");
  const tenantId = userData.tenant_id;

  // Fetch Payments (Income)
  let paymentsQuery = supabase
    .from("payments")
    .select("*, student:students(*), monthly_due:monthly_dues(due_month)")
    .eq("tenant_id", tenantId)
    .order("payment_date", { ascending: false });
  if (branchId) {
    paymentsQuery = paymentsQuery.eq("branch_id", branchId);
  }
  const role = String(userData.role || "");
  if (role === "branch_manager" || role === "instructor") {
    paymentsQuery = paymentsQuery.neq("payment_type", "product");
  }
  const { data: payments, error: paymentsError } = await paymentsQuery;

  if (paymentsError) throw new Error("Failed to fetch payments");

  // Fetch Expenses
  let expensesQuery = supabase
    .from("expenses")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("expense_date", { ascending: false });
  if (branchId) {
    expensesQuery = expensesQuery.eq("branch_id", branchId);
  }
  const { data: expenses, error: expensesError } = await expensesQuery;

  if (expensesError) throw new Error("Failed to fetch expenses");

  // Calculate Stats
  const totalIncome = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalExpense = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const netProfit = totalIncome - totalExpense;

  // Pending payments (from monthly_dues where status is pending)
  const { count: pendingPaymentsCount } = await supabase
    .from("monthly_dues")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .neq("status", "paid");

  let pendingDuesQuery = supabase
    .from("monthly_dues")
    .select("amount, paid_amount")
    .eq("tenant_id", tenantId)
    .neq("status", "paid");
  if (branchId) {
    pendingDuesQuery = pendingDuesQuery.eq("branch_id", branchId);
  }
  const { data: pendingDues } = await pendingDuesQuery;

  const pendingAmount =
    pendingDues?.reduce(
      (sum, d: any) => sum + ((d.amount || 0) - (d.paid_amount || 0)),
      0,
    ) || 0;

  const formattedPayments: Payment[] = (payments || []).map((p: any) => ({
    id: p.id,
    tenantId: p.tenant_id,
    branchId: p.branch_id,
    studentId: p.student_id,
    monthlyDueId: p.monthly_due_id,
    orderId: p.order_id,
    amount: Number(p.amount || 0),
    paymentType: p.payment_type,
    paymentMethod: p.payment_method,
    referenceNo: p.reference_no,
    description: p.description,
    receivedBy: p.received_by,
    paymentDate: p.payment_date,
    createdAt: p.created_at,
    student: p.student
      ? {
          id: p.student.id,
          tenantId: p.student.tenant_id,
          branchId: p.student.branch_id,
          userId: p.student.user_id,
          studentNo: p.student.student_no,
          fullName: p.student.full_name || "",
          birthDate: p.student.birth_date,
          isLicensed: p.student.is_licensed,
          licenseNo: p.student.license_no,
          licenseIssuedAt: p.student.license_issued_at,
          licenseExpiresAt: p.student.license_expires_at,
          licenseFederation: p.student.license_federation,
          gender: p.student.gender,
          phone: p.student.phone,
          email: p.student.email,
          address: p.student.address,
          emergencyContactName: p.student.emergency_contact_name,
          emergencyContactPhone: p.student.emergency_contact_phone,
          guardianName: p.student.guardian_name,
          guardianPhone: p.student.guardian_phone,
          guardianEmail: p.student.guardian_email,
          photoUrl: p.student.photo_url,
          registrationDate: p.student.registration_date,
          status: p.student.status,
          notes: p.student.notes,
          createdAt: p.student.created_at,
          updatedAt: p.student.updated_at,
        }
      : undefined,
  }));

  const formattedExpenses: Expense[] = (expenses || []).map((e: any) => ({
    id: e.id,
    tenantId: e.tenant_id,
    branchId: e.branch_id,
    category: e.category,
    description: e.description,
    amount: e.amount,
    expenseDate: e.expense_date,
    vendor: e.vendor,
    receiptUrl: e.receipt_url,
    createdBy: e.created_by,
    createdAt: e.created_at,
  }));

  return {
    payments: formattedPayments,
    expenses: formattedExpenses,
    stats: {
      totalIncome,
      totalExpense,
      netProfit,
      pendingPayments: pendingAmount,
    },
    tenantId,
  };
}
