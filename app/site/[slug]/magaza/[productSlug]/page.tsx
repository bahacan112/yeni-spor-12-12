import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductDetail from "@/components/site/product-detail";
import { getPublicWebsiteData } from "@/lib/api/public-website";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const protocol = process.env.VERCEL ? "https" : "http";
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
  const apiUrl = `${base}/api/public/site/${encodeURIComponent(
    slug
  )}/products/${encodeURIComponent(productSlug)}`;
  const res = await fetch(apiUrl, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Ürün bulunamadı");
  const { product } = (await res.json()) as { product: any };
  const { tenant, aboutPage, branchesPage, contactPage } =
    await getPublicWebsiteData(slug);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={tenant.logoUrl || "/placeholder.svg"}
              alt={tenant.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="font-bold text-lg hidden sm:block">
              {tenant.name}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/site/${slug}#hakkimizda`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {aboutPage?.title || "Hakkımızda"}
            </Link>
            <Link
              href={`/site/${slug}#branslar`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {branchesPage?.title || "Branşlar"}
            </Link>
            <Link
              href={`/site/${slug}#galeri`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {"Galeri"}
            </Link>
            <Link
              href={`/site/${slug}/magaza`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {"Mağaza"}
            </Link>
            <Link
              href={`/site/${slug}#iletisim`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {contactPage?.title || "İletişim"}
            </Link>
          </nav>
          <Button asChild>
            <Link href={`/site/${slug}/kayit`}>Kayıt Ol</Link>
          </Button>
        </div>
      </header>
      <div className="container mx-auto px-4 py-10">
        <ProductDetail product={product} slug={slug} />
      </div>
    </div>
  );
}
