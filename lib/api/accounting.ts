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
    .select("*")
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
      0
    ) || 0;

  const formattedPayments: Payment[] = (payments || []).map((p: any) => ({
    id: p.id,
    tenantId: p.tenant_id,
    branchId: p.branch_id,
    studentId: p.student_id,
    monthlyDueId: p.monthly_due_id,
    orderId: p.order_id,
    amount: p.amount,
    paymentType: p.payment_type,
    paymentMethod: p.payment_method,
    referenceNo: p.reference_no,
    description: p.description,
    receivedBy: p.received_by,
    paymentDate: p.payment_date,
    createdAt: p.created_at,
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
