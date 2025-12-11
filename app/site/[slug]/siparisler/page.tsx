import { headers } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const protocol = process.env.VERCEL ? "https" : "http";
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
  const res = await fetch(
    `${base}/api/public/site/${encodeURIComponent(slug)}/orders?limit=20`,
    {
      cache: "no-store",
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) throw new Error("Siparişler alınamadı");
  const { orders } = (await res.json()) as { orders: Array<any> };
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Siparişler</h1>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">Henüz sipariş yok.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Card key={o.id} className="bg-card/50 border-border/50">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{o.order_no}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₺{o.total}</p>
                      <p className="text-xs">Durum: {o.status}</p>
                    </div>
                  </div>
                  {o.shipping_address ? (
                    <div className="text-xs text-muted-foreground">
                      <p>Ad Soyad: {o.shipping_address?.fullName || "-"}</p>
                      <p>
                        Öğrenci: {o.shipping_address?.studentFullName || "-"}
                      </p>
                      <p>Doğum Yılı: {o.shipping_address?.birthYear || "-"}</p>
                      <p>Telefon: {o.shipping_address?.phone || "-"}</p>
                      <p>E-posta: {o.shipping_address?.email || "-"}</p>
                      <p>Adres: {o.shipping_address?.address || "-"}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
