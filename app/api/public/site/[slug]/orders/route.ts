import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function generateOrderNo() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `S-${yyyy}${mm}${dd}-${rand}`;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { slug } = await context.params;
  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  const customer = body.customer || {};
  if (items.length === 0) {
    return NextResponse.json({ error: "Sepet boş" }, { status: 400 });
  }

  const { data: tenantData } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!tenantData) {
    return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 404 });
  }

  const { data: mainBranch } = await supabase
    .from("branches")
    .select("id")
    .eq("tenant_id", tenantData.id)
    .eq("is_main", true)
    .maybeSingle();
  let branchId = mainBranch?.id || null;
  if (!branchId) {
    const { data: anyBranch } = await supabase
      .from("branches")
      .select("id")
      .eq("tenant_id", tenantData.id)
      .order("created_at", { ascending: true })
      .limit(1);
    branchId = (anyBranch && anyBranch[0]?.id) || null;
  }
  if (!branchId) {
    return NextResponse.json({ error: "Şube bulunamadı" }, { status: 400 });
  }

  const productIds = items.map((i: any) => i.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, price, name")
    .in("id", productIds);
  const priceMap = new Map<string, number>();
  (products || []).forEach((p: any) =>
    priceMap.set(p.id, Number(p.price || 0))
  );

  let subtotal = 0;
  items.forEach((i: any) => {
    const unit = priceMap.get(i.productId) || 0;
    subtotal += unit * Number(i.quantity || 1);
  });
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;
  const orderNo = generateOrderNo();

  const shipping = {
    fullName: String(customer.fullName || "").trim(),
    phone: String(customer.phone || "").trim(),
    email: String(customer.email || "").trim(),
    address: String(customer.address || "").trim(),
    studentFullName: String(customer.studentFullName || "").trim(),
    birthYear: String(customer.birthYear || "").trim(),
  };
  const shipping_address =
    shipping.fullName || shipping.phone || shipping.email || shipping.address
      ? shipping
      : null;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenantData.id,
      branch_id: branchId,
      order_no: orderNo,
      status: "pending",
      subtotal,
      discount,
      tax,
      total,
      shipping_address,
      billing_address: null,
      notes: String(customer.notes || "").trim() || null,
    })
    .select("*")
    .single();
  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 400 });
  }

  const orderItemsPayload = items.map((i: any) => ({
    order_id: order.id,
    product_id: i.productId,
    variant_id: i.variantId || null,
    quantity: Number(i.quantity || 1),
    unit_price: priceMap.get(i.productId) || 0,
    total_price: (priceMap.get(i.productId) || 0) * Number(i.quantity || 1),
  }));
  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);
  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 400 });
  }

  // Decrease stock for track_inventory products
  try {
    const { data: productsForStock } = await supabase
      .from("products")
      .select("id, stock_quantity, track_inventory")
      .in("id", productIds);
    const updates = (productsForStock || [])
      .filter((p: any) => !!p.track_inventory)
      .map((p: any) => {
        const qty =
          items.find((it: any) => it.productId === p.id)?.quantity || 0;
        const next = Math.max(0, Number(p.stock_quantity || 0) - Number(qty));
        return { id: p.id, stock_quantity: next };
      });
    for (const u of updates) {
      await supabase
        .from("products")
        .update({ stock_quantity: u.stock_quantity })
        .eq("id", u.id);
    }
  } catch {}

  return NextResponse.json({ ok: true, orderId: order.id, orderNo });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { slug } = await context.params;
  const limit = Number(req.nextUrl.searchParams.get("limit") || 20);

  const { data: tenantData } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!tenantData) {
    return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 404 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_no, status, total, subtotal, created_at, shipping_address"
    )
    .eq("tenant_id", tenantData.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return NextResponse.json({ orders: orders || [] });
}
