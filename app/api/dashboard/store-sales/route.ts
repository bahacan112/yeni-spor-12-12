import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(_req: NextRequest) {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: u } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single()
  if (!u?.tenant_id) return NextResponse.json({ error: "Tenant not found" }, { status: 400 })

  const role = String(u.role || "")
  const allowed = role === "tenant_admin" || role === "super_admin"
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const tenantId = String(u.tenant_id)

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("payment_type", "product")

  const { count: ordersCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, order_no, total, status, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(5)

  const totalSalesAmount = (payments || []).reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0)

  return NextResponse.json({
    totalSalesAmount,
    totalOrders: ordersCount || 0,
    recentOrders: (recentOrders || []).map((o: any) => ({
      id: o.id,
      orderNo: o.order_no,
      total: Number(o.total) || 0,
      status: o.status,
      createdAt: o.created_at,
    })),
  })
}
