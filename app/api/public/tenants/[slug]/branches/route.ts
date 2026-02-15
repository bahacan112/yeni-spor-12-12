import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const clean = slug.toLowerCase();

  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, slug, website_enabled")
    .eq("slug", clean)
    .single();

  if (tenantErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { data: branches, error: branchesErr } = await supabase
    .from("branches")
    .select("id, name, address, city, district, phone, email, is_active")
    .eq("tenant_id", tenant.id)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (branchesErr) {
    return NextResponse.json({ error: branchesErr.message }, { status: 400 });
  }

  return NextResponse.json({
    branches: (branches || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      city: b.city,
      district: b.district,
      phone: b.phone,
      email: b.email,
      isActive: b.is_active,
    })),
  });
}
