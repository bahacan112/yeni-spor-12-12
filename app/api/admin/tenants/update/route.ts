import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!userData || userData.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const tenantId = String(body.tenantId || "");
  if (!tenantId) return NextResponse.json({ error: "tenantId zorunlu" }, { status: 400 });

  const fields: any = {};
  if (typeof body.name === "string") fields.name = body.name;
  if (typeof body.email === "string") fields.email = body.email;
  if (typeof body.phone === "string") fields.phone = body.phone;
  if (typeof body.address === "string") fields.address = body.address;
  if (typeof body.websiteEnabled === "boolean") fields.website_enabled = body.websiteEnabled;
  if (typeof body.ecommerceEnabled === "boolean") fields.ecommerce_enabled = body.ecommerceEnabled;
  if (typeof body.isLimited === "boolean") fields.is_limited = body.isLimited;
  if (body.maxStudents !== undefined) fields.max_students = body.maxStudents === null ? null : Number(body.maxStudents);
  if (body.maxGroups !== undefined) fields.max_groups = body.maxGroups === null ? null : Number(body.maxGroups);

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseService() : supabase;
  const { error } = await svc.from("tenants").update(fields).eq("id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

