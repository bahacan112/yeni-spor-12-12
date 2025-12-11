import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Missing service role key" },
      { status: 500 }
    );
  }
  const supabase = createClient(url, key);

  const { slug } = await context.params;
  const search = req.nextUrl.searchParams.get("q") || "";
  const categoryId = req.nextUrl.searchParams.get("category") || undefined;

  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single();
  if (tenantError || !tenantData) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  let productsQuery = supabase
    .from("products")
    .select("*, category:product_categories(name)")
    .eq("tenant_id", tenantData.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (search) {
    productsQuery = productsQuery.ilike("name", `%${search}%`);
  }
  if (categoryId && categoryId !== "all") {
    productsQuery = productsQuery.eq("category_id", categoryId);
  }
  const { data: products } = await productsQuery;

  const { data: categories } = await supabase
    .from("product_categories")
    .select("*")
    .eq("tenant_id", tenantData.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const formattedProducts = (products || []).map((p: any) => ({
    id: p.id,
    tenantId: p.tenant_id,
    categoryId: p.category_id,
    category: p.category,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    comparePrice: p.compare_price,
    sku: p.sku,
    stockQuantity: p.stock_quantity,
    trackInventory: p.track_inventory,
    images: Array.isArray(p.images) ? p.images : [],
    isActive: p.is_active,
    isFeatured: p.is_featured,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  const formattedCategories = (categories || []).map((c: any) => ({
    id: c.id,
    tenantId: c.tenant_id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.image_url,
    parentId: c.parent_id,
    sortOrder: c.sort_order,
    isActive: c.is_active,
    createdAt: c.created_at,
  }));

  return NextResponse.json({
    products: formattedProducts,
    categories: formattedCategories,
  });
}
