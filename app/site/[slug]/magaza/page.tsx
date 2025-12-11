import Link from "next/link";
import { headers } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) || {};
  const qRaw = sp.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const catRaw = sp.category;
  const category = Array.isArray(catRaw) ? catRaw[0] : catRaw;
  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const protocol = process.env.VERCEL ? "https" : "http";
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (category) qs.set("category", category);
  const apiUrl = `${base}/api/public/site/${encodeURIComponent(slug)}/products${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  let products: Array<any> = [];
  let categories: Array<any> = [];
  let fetchError: string | null = null;
  try {
    const res = await fetch(apiUrl, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const json = (await res.json()) as {
        products: Array<any>;
        categories: Array<any>;
      };
      products = Array.isArray(json.products) ? json.products : [];
      categories = Array.isArray(json.categories) ? json.categories : [];
    } else {
      fetchError = "Mağaza verileri alınamadı";
    }
  } catch {
    fetchError = "Mağaza verileri alınamadı";
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Mağaza</h1>
          <div className="flex items-center gap-2">
            <form
              action={`/site/${slug}/magaza`}
              method="get"
              className="flex gap-2"
            >
              <Input
                name="q"
                defaultValue={q || ""}
                placeholder="Ürün ara..."
                className="w-60"
              />
              <Button type="submit" variant="outline">
                Ara
              </Button>
            </form>
            <Button asChild>
              <Link href={`/site/${slug}/sepet`}>Sepet</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/site/${slug}/siparisler`}>Siparişler</Link>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/site/${slug}/magaza`}
              className="text-sm px-3 py-1 rounded-md border"
            >
              Tümü
            </Link>
            {(categories || []).map((c) => (
              <Link
                key={c.id}
                href={`/site/${slug}/magaza?category=${encodeURIComponent(
                  c.id
                )}`}
                className="text-sm px-3 py-1 rounded-md border"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {fetchError ? (
          <p className="text-destructive">{fetchError}</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">Ürün bulunamadı.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <Card
                key={p.id}
                className="overflow-hidden bg-card/50 border-border/50"
              >
                <Link href={`/site/${slug}/magaza/${p.slug}`}>
                  <div className="aspect-square relative">
                    <img
                      src={
                        (Array.isArray(p.images) && p.images[0]) ||
                        "/placeholder.svg"
                      }
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <CardContent className="p-3">
                  <Link
                    href={`/site/${slug}/magaza/${p.slug}`}
                    className="font-medium text-sm"
                  >
                    {p.name}
                  </Link>
                  <p className="text-primary font-bold">₺{p.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
