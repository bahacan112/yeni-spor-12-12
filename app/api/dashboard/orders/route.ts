import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!userData?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }
  const tenantId = userData.tenant_id as string;

  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const status: string | undefined = body.status;
  const notes: string | undefined = body.notes;
  const shippingAddress: Record<string, any> | undefined = body.shippingAddress;
  const markPaid: boolean = !!body.markPaid;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const svc = createClient(url, key);

  // Fetch order first to validate tenant and get totals
  const { data: order, error: ordErr } = await svc
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (ordErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updates: any = {};
  if (status) updates.status = status;
  if (typeof notes === "string") updates.notes = notes;
  if (shippingAddress && typeof shippingAddress === "object") {
    updates.shipping_address = shippingAddress;
  }
  if (Object.keys(updates).length > 0) {
    const { error: upErr } = await svc
      .from("orders")
      .update(updates)
      .eq("id", id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }
  }

  if (markPaid) {
    const amount = Number(order.total || 0);
    const { error: payErr } = await svc.from("payments").insert({
      tenant_id: order.tenant_id,
      branch_id: order.branch_id,
      student_id: order.student_id || null,
      order_id: order.id,
      amount,
      payment_type: "product",
      payment_method: "cash",
      description: `Order ${order.order_no} marked as paid`,
    });
    if (payErr) {
      return NextResponse.json({ error: payErr.message }, { status: 400 });
    }
  }

  const { data: refreshed } = await svc
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  return NextResponse.json({ ok: true, order: refreshed });
}
