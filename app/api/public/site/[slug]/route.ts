import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);

  const { slug } = await context.params;

  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenantData) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { data: homePageData } = await supabase
    .from("website_pages")
    .select("*")
    .eq("tenant_id", tenantData.id)
    .eq("slug", "home")
    .maybeSingle();

  const { data: aboutPageData } = await supabase
    .from("website_pages")
    .select("*")
    .eq("tenant_id", tenantData.id)
    .eq("slug", "hakkimizda")
    .maybeSingle();

  const { data: contactPageData } = await supabase
    .from("website_pages")
    .select("*")
    .eq("tenant_id", tenantData.id)
    .eq("slug", "iletisim")
    .maybeSingle();

  const { data: branchesPageData } = await supabase
    .from("website_pages")
    .select("*")
    .eq("tenant_id", tenantData.id)
    .eq("slug", "branslar")
    .maybeSingle();

  const tenant = {
    id: tenantData.id,
    name: tenantData.name,
    slug: tenantData.slug,
    logoUrl: tenantData.logo_url,
    primaryColor: tenantData.primary_color,
    secondaryColor: tenantData.secondary_color,
    email: tenantData.email,
    phone: tenantData.phone,
    address: tenantData.address,
    websiteEnabled: tenantData.website_enabled,
    websiteDomain: tenantData.website_domain,
    galleryImages: Array.isArray(tenantData.gallery_images)
      ? tenantData.gallery_images
      : [],
    createdAt: tenantData.created_at,
    updatedAt: tenantData.updated_at,
  };

  const homePage = homePageData
    ? {
        id: homePageData.id,
        tenantId: homePageData.tenant_id,
        title: homePageData.title,
        slug: homePageData.slug,
        content: homePageData.content,
        metaTitle: homePageData.meta_title,
        metaDescription: homePageData.meta_description,
        isPublished: homePageData.is_published,
        sortOrder: homePageData.sort_order,
        createdAt: homePageData.created_at,
        updatedAt: homePageData.updated_at,
      }
    : null;

  const aboutPage = aboutPageData
    ? {
        id: aboutPageData.id,
        tenantId: aboutPageData.tenant_id,
        title: aboutPageData.title,
        slug: aboutPageData.slug,
        content: aboutPageData.content,
        metaTitle: aboutPageData.meta_title,
        metaDescription: aboutPageData.meta_description,
        isPublished: aboutPageData.is_published,
        sortOrder: aboutPageData.sort_order,
        createdAt: aboutPageData.created_at,
        updatedAt: aboutPageData.updated_at,
      }
    : null;

  const contactPage = contactPageData
    ? {
        id: contactPageData.id,
        tenantId: contactPageData.tenant_id,
        title: contactPageData.title,
        slug: contactPageData.slug,
        content: contactPageData.content,
        metaTitle: contactPageData.meta_title,
        metaDescription: contactPageData.meta_description,
        isPublished: contactPageData.is_published,
        sortOrder: contactPageData.sort_order,
        createdAt: contactPageData.created_at,
        updatedAt: contactPageData.updated_at,
      }
    : null;

  const branchesPage = branchesPageData
    ? {
        id: branchesPageData.id,
        tenantId: branchesPageData.tenant_id,
        title: branchesPageData.title,
        slug: branchesPageData.slug,
        content: branchesPageData.content,
        metaTitle: branchesPageData.meta_title,
        metaDescription: branchesPageData.meta_description,
        isPublished: branchesPageData.is_published,
        sortOrder: branchesPageData.sort_order,
        createdAt: branchesPageData.created_at,
        updatedAt: branchesPageData.updated_at,
      }
    : null;

  return NextResponse.json(
    { tenant, homePage, aboutPage, contactPage, branchesPage },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
