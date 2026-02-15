import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";
import { createClient } from "@supabase/supabase-js";

async function deleteByIds(
  svc: any,
  table: string,
  column: string,
  ids: string[]
) {
  if (!ids || ids.length === 0) return;
  const size = 500;
  for (let i = 0; i < ids.length; i += size) {
    const slice = ids.slice(i, i + size);
    const { error } = await svc.from(table).delete().in(column, slice);
    if (error) throw new Error(error.message);
  }
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!userData || userData.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const tenantId = String(body.tenantId || "");
  const schoolName = String(body.schoolName || "");
  const password = String(body.password || "");
  if (!tenantId || !schoolName || !password)
    return NextResponse.json({ error: "Eksik veri" }, { status: 400 });

  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : supabase;

  const { data: tenant } = await svc
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenantId)
    .single();
  if (!tenant)
    return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 404 });
  const match =
    tenant.name.trim().toLowerCase() === schoolName.trim().toLowerCase();
  if (!match)
    return NextResponse.json({ error: "Okul adı yanlış" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authCli = createClient(url, anon, { auth: { persistSession: false } });
  const email = String(user.email || "");
  if (!email)
    return NextResponse.json(
      { error: "Kullanıcı e-posta bulunamadı" },
      { status: 400 }
    );
  const signInRes = await authCli.auth.signInWithPassword({ email, password });
  if (signInRes.error || !signInRes.data?.user)
    return NextResponse.json({ error: "Şifre yanlış" }, { status: 401 });

  const { data: trainings } = await svc
    .from("trainings")
    .select("id")
    .eq("tenant_id", tenantId);
  const trainingIds = (trainings || []).map((t: any) => String(t.id));
  await deleteByIds(svc, "attendance", "training_id", trainingIds);

  const { data: groups } = await svc
    .from("groups")
    .select("id")
    .eq("tenant_id", tenantId);
  const groupIds = (groups || []).map((g: any) => String(g.id));

  const { data: students } = await svc
    .from("students")
    .select("id")
    .eq("tenant_id", tenantId);
  const studentIds = (students || []).map((s: any) => String(s.id));

  const { data: orders } = await svc
    .from("orders")
    .select("id")
    .eq("tenant_id", tenantId);
  const orderIds = (orders || []).map((o: any) => String(o.id));
  await deleteByIds(svc, "order_items", "order_id", orderIds);

  const { data: products } = await svc
    .from("products")
    .select("id")
    .eq("tenant_id", tenantId);
  const productIds = (products || []).map((p: any) => String(p.id));
  await deleteByIds(svc, "product_variants", "product_id", productIds);

  let res;
  res = await svc.from("monthly_dues").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("payments").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("expenses").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("applications").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("registration_links").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("notification_logs").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc
    .from("scheduled_notifications")
    .delete()
    .eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc
    .from("notification_templates")
    .delete()
    .eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("website_pages").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });

  res = await svc.from("orders").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("products").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("product_categories").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });

  res = await svc.from("trainings").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("venues").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("students").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("groups").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("sports").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("instructors").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("branches").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("users").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });

  res = await svc
    .from("tenant_subscriptions")
    .delete()
    .eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });
  res = await svc.from("tenant_payments").delete().eq("tenant_id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });

  res = await svc.from("tenants").delete().eq("id", tenantId);
  if (res.error)
    return NextResponse.json({ error: res.error.message }, { status: 400 });

  const tablesToCheck = [
    "students",
    "groups",
    "trainings",
    "venues",
    "branches",
    "instructors",
    "payments",
    "monthly_dues",
    "expenses",
    "applications",
    "registration_links",
    "notification_logs",
    "scheduled_notifications",
    "notification_templates",
    "website_pages",
    "orders",
    "products",
    "product_categories",
    "sports",
    "users",
    "tenant_subscriptions",
    "tenant_payments",
  ];
  for (const table of tablesToCheck) {
    const { count, error } = await svc
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    if ((count || 0) > 0)
      return NextResponse.json(
        { error: `Kalan veri bulundu: ${table}` },
        { status: 500 }
      );
  }
  return NextResponse.json({ ok: true });
}
