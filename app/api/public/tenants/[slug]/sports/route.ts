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

  const { data: tenant, error: tErr } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug.toLowerCase())
    .single();
  if (tErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  const { data: sports, error: sErr } = await supabase
    .from("sports")
    .select("id,name,slug,is_active,sort_order")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 400 });
  }
  return NextResponse.json({
    sports: (sports || []).map((s: any) => ({
      id: String(s.id),
      name: String(s.name),
      slug: s.slug ? String(s.slug) : undefined,
    })),
  });
}
