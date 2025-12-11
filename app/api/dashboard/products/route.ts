import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const name: string = body.name || "";
  const price: number = Number(body.price || 0);
  const stock: number = Number(body.stock || 0);
  const categoryId: string | null = body.categoryId || null;
  const description: string | null = body.description || null;
  const images: string[] = Array.isArray(body.images) ? body.images : [];
  const isActive: boolean = !!body.isActive;
  const slug = slugify(name);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const svc = createClient(url, key);

  const { error } = await svc.from("products").insert({
    tenant_id: tenantId,
    name,
    slug,
    price,
    stock_quantity: stock,
    category_id: categoryId,
    description,
    images,
    is_active: isActive,
    track_inventory: true,
    is_featured: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const id: string = body.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const svc = createClient(url, key);

  const payload: any = {
    name: body.name,
    price: Number(body.price || 0),
    stock_quantity: Number(body.stock || 0),
    category_id: body.categoryId || null,
    description: body.description || null,
    is_active: !!body.isActive,
    images: Array.isArray(body.images) ? body.images : [],
  };
  if (typeof body.name === "string" && body.name.trim().length > 0) {
    payload.slug = slugify(body.name);
  }

  const { error } = await svc.from("products").update(payload).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
