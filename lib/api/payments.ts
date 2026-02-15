import { getSupabaseServer } from "@/lib/supabase/server";
import { Payment } from "@/lib/types";

export async function getPaymentsData(
  branchId?: string,
  from?: string,
  to?: string
) {
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

  let query = supabase
    .from("payments")
    .select("*, student:students(full_name), branch:branches(name)")
    .eq("tenant_id", tenantId)
    .order("payment_date", { ascending: false });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }
  if (from) {
    query = query.gte("payment_date", from);
  }
  if (to) {
    query = query.lte("payment_date", to);
  }

  const { data } = await query;
  const payments: Payment[] = (data || []).map((p: any) => ({
    id: p.id,
    tenantId: p.tenant_id,
    branchId: p.branch_id,
    studentId: p.student_id,
    student: p.student
      ? {
          id: p.student_id,
          tenantId: p.tenant_id,
          branchId: p.branch_id,
          fullName: p.student.full_name,
          registrationDate: "",
          status: "active",
          createdAt: "",
          updatedAt: "",
        } as any
      : undefined,
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

  return { payments, tenantId };
}

