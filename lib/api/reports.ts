import { getSupabaseServer } from "@/lib/supabase/server";

export async function getReportsData(branchId?: string) {
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

  const today = new Date();
  const windowStart = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  let paymentsQuery = supabase
    .from("payments")
    .select("amount, payment_date, payment_method, payment_type")
    .eq("tenant_id", tenantId)
    .gte("payment_date", windowStart.toISOString())
    .lte("payment_date", nextMonthStart.toISOString());
  if (branchId) {
    paymentsQuery = paymentsQuery.eq("branch_id", branchId);
  }
  const { data: payments } = await paymentsQuery;

  let expensesQuery = supabase
    .from("expenses")
    .select("amount, expense_date, category")
    .eq("tenant_id", tenantId)
    .gte("expense_date", windowStart.toISOString())
    .lte("expense_date", nextMonthStart.toISOString());
  if (branchId) {
    expensesQuery = expensesQuery.eq("branch_id", branchId);
  }
  const { data: expenses } = await expensesQuery;

  const monthly: { month: string; revenue: number; expense: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const mStart = new Date(windowStart.getFullYear(), windowStart.getMonth() + i, 1);
    const mEnd = new Date(windowStart.getFullYear(), windowStart.getMonth() + i + 1, 1);
    const mKey = `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`;
    const rev =
      payments
        ?.filter((p: any) => {
          const d = new Date(p.payment_date);
          return d >= mStart && d < mEnd;
        })
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
    const exp =
      expenses
        ?.filter((e: any) => {
          const d = new Date(e.expense_date);
          return d >= mStart && d < mEnd;
        })
        .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0) || 0;
    monthly.push({ month: mKey, revenue: rev, expense: exp });
  }

  const methodDist: Record<string, number> = {};
  const typeDist: Record<string, number> = {};
  (payments || []).forEach((p: any) => {
    const m = p.payment_method || "unknown";
    methodDist[m] = (methodDist[m] || 0) + 1;
    const t = p.payment_type || "unknown";
    typeDist[t] = (typeDist[t] || 0) + 1;
  });

  return {
    monthly,
    methodDist,
    typeDist,
    tenantId,
  };
}

