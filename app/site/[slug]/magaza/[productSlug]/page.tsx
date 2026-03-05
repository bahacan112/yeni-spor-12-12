import Link from "next/link";
import { headers } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductDetail from "@/components/site/product-detail";
import { getPublicWebsiteData } from "@/lib/api/public-website";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const { tenant, aboutPage, branchesPage, contactPage } =
    await getPublicWebsiteData(slug);
  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const protocol = process.env.VERCEL ? "https" : "http";
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  let product: any = null;
  let fetchError: string | null = null;
  try {
    const res = await fetch(
      `${base}/api/public/site/${encodeURIComponent(
        slug
      )}/products/${encodeURIComponent(productSlug)}`,
      { cache: "no-store", next: { revalidate: 0 } }
    );
    if (res.ok) {
      const json = (await res.json()) as { product: any };
      product = json.product;
    } else {
      fetchError = "Ürün bulunamadı";
    }
  } catch {
    fetchError = "Ürün bulunamadı";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={tenant?.logoUrl || "/placeholder.svg"}
              alt={tenant.name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <span className="font-bold text-lg truncate hidden sm:block">
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
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/site/${slug}/magaza`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Mağazaya Dön
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/site/${slug}/sepet`}>Sepet</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/site/${slug}/siparisler`}>Siparişler</Link>
            </Button>
          </div>
        </div>

        {fetchError ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <p className="text-destructive">{fetchError}</p>
            </CardContent>
          </Card>
        ) : !product ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <p className="text-muted-foreground">Yükleniyor...</p>
            </CardContent>
          </Card>
        ) : (
          <ProductDetail product={product} slug={slug} />
        )}
      </div>
    </div>
  );
}
