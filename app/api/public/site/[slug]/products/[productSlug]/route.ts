import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string; productSlug: string }> }
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

  const { slug, productSlug } = await context.params;

  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single();
  if (tenantError || !tenantData) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `*,
       category:product_categories(*),
       variants:product_variants(*)
      `
    )
    .eq("tenant_id", tenantData.id)
    .eq("slug", productSlug)
    .maybeSingle();
  if (error || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const formatted = {
    id: product.id,
    tenantId: product.tenant_id,
    categoryId: product.category_id,
    category: product.category,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    comparePrice: product.compare_price,
    sku: product.sku,
    stockQuantity: product.stock_quantity,
    trackInventory: product.track_inventory,
    images: Array.isArray(product.images) ? product.images : [],
    isActive: product.is_active,
    isFeatured: product.is_featured,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    variants: Array.isArray(product.variants)
      ? product.variants.map((v: any) => ({
          id: v.id,
          productId: v.product_id,
          name: v.name,
          sku: v.sku,
          price: v.price ?? undefined,
          stockQuantity: v.stock_quantity,
          attributes: v.attributes ?? undefined,
          isActive: v.is_active,
          createdAt: v.created_at,
        }))
      : [],
  };

  return NextResponse.json({ product: formatted });
}
