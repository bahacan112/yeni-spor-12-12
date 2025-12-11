import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";
import { Product, ProductCategory } from "@/lib/types";

export async function getProductsData() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!userData?.tenant_id) throw new Error("Tenant not found");
  const tenantId = userData.tenant_id;

  const svc = getSupabaseService();
  const { data: products, error: productsError } = await svc
    .from("products")
    .select(
      `
      *,
      category:product_categories(name)
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
    throw new Error("Failed to fetch products");
  }

  const { data: categories, error: categoriesError } = await svc
    .from("product_categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
  }

  const formattedProducts: Product[] = (products || []).map((p: any) => ({
    id: p.id,
    tenantId: p.tenant_id,
    categoryId: p.category_id,
    category: p.category, // Joined data
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    comparePrice: p.compare_price,
    sku: p.sku,
    stockQuantity: p.stock_quantity,
    trackInventory: p.track_inventory,
    images: p.images,
    isActive: p.is_active,
    isFeatured: p.is_featured,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  const formattedCategories: ProductCategory[] = (categories || []).map(
    (c: any) => ({
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
    })
  );

  return {
    products: formattedProducts,
    categories: formattedCategories,
    tenantId,
  };
}
