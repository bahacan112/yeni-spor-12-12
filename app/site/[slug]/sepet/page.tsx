import Link from "next/link";
import { Button } from "@/components/ui/button";
import CartView from "@/components/site/cart-view";
import { getPublicWebsiteData } from "@/lib/api/public-website";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
        <h1 className="text-3xl font-bold mb-6">Sepet</h1>
        <CartView slug={slug} />
      </div>
    </div>
  );
}
