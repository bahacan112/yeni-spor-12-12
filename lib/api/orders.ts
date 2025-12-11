import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";
import { Order } from "@/lib/types";

export async function getOrdersData() {
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
  const tenantId = userData.tenant_id as string;

  const svc = getSupabaseService();
  const { data, error } = await svc
    .from("orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }

  const orders: Order[] = (data || []).map((o: any) => ({
    id: o.id,
    tenantId: o.tenant_id,
    branchId: o.branch_id ?? undefined,
    customerId: o.customer_id ?? undefined,
    studentId: o.student_id ?? undefined,
    orderNo: o.order_no,
    status: o.status,
    subtotal: Number(o.subtotal || 0),
    discount: Number(o.discount || 0),
    tax: Number(o.tax || 0),
    total: Number(o.total || 0),
    shippingAddress: o.shipping_address ?? undefined,
    billingAddress: o.billing_address ?? undefined,
    notes: o.notes ?? undefined,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  }));

  return { orders, tenantId };
}

