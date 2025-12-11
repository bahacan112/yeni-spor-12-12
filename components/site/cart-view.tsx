"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/stores/cart-store";

export default function CartView({ slug }: { slug: string }) {
  const cart = useCartStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [studentFullName, setStudentFullName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const items = cart.items;
  const subtotal = cart.subtotal();
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmed, setConfirmed] = useState<{
    orderNo: string;
    total: number;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    customer: Record<string, string>;
  } | null>(null);

  const checkout = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        items: items.map((it) => ({
          productId: it.product.id,
          variantId: it.variant?.id,
          quantity: it.quantity,
        })),
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          notes: notes.trim(),
          studentFullName: studentFullName.trim(),
          birthYear: birthYear.trim(),
        },
      };
      const res = await fetch(
        `/api/public/site/${encodeURIComponent(slug)}/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error || "Sipariş oluşturulamadı");
      } else {
        const summaryItems = items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          unitPrice: Number(it.product.price || 0),
        }));
        const totalCalc = summaryItems.reduce(
          (acc, i) => acc + i.quantity * i.unitPrice,
          0
        );
        setConfirmed({
          orderNo: String(json.orderNo || ""),
          total: totalCalc,
          items: summaryItems,
          customer: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim(),
            notes: notes.trim(),
            studentFullName: studentFullName.trim(),
            birthYear: birthYear.trim(),
          },
        });
        cart.clearCart();
        setOpenDialog(true);
      }
    } catch (e: any) {
      setMessage(e?.message || "Hata oluştu");
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return <p className="text-muted-foreground">Sepetiniz boş.</p>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-3">
        {items.map((it) => (
          <Card
            key={`${it.product.id}-${it.variant?.id || "_"}`}
            className="bg-card/50 border-border/50"
          >
            <CardContent className="p-3 flex gap-3 items-center">
              <img
                src={
                  (Array.isArray(it.product.images) && it.product.images[0]) ||
                  "/placeholder.svg"
                }
                alt={it.product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{it.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  ₺{it.product.price}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={it.quantity}
                  onChange={(e) =>
                    cart.updateQuantity(
                      it.product.id,
                      Number(e.target.value || 1),
                      it.variant?.id
                    )
                  }
                  className="w-20"
                />
                <Button
                  variant="outline"
                  onClick={() => cart.removeItem(it.product.id, it.variant?.id)}
                >
                  Kaldır
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-3">
            <p className="font-bold">Ara Toplam: ₺{subtotal}</p>
            <div className="space-y-2">
              <Input
                placeholder="Öğrenci Ad Soyad"
                value={studentFullName}
                onChange={(e) => setStudentFullName(e.target.value)}
              />
              <Input
                placeholder="Doğum Yılı (YYYY)"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
              />
              <Input
                placeholder="Ad Soyad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                placeholder="Telefon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Adres"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                placeholder="Notlar (isteğe bağlı)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={checkout} disabled={loading}>
              {loading ? "İşleniyor" : "Siparişi Tamamla"}
            </Button>
            {message ? (
              <div className="text-sm text-muted-foreground">{message}</div>
            ) : null}
          </CardContent>
        </Card>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Siparişiniz alındı</DialogTitle>
              <DialogDescription>
                Sipariş numaranız {confirmed?.orderNo}. Detayları aşağıda
                görebilirsiniz.
              </DialogDescription>
            </DialogHeader>
            {confirmed ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm">Ürünler</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {confirmed.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {i.name} × {i.quantity}
                        </span>
                        <span>₺{(i.unitPrice * i.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold">
                      <span>Toplam</span>
                      <span>₺{confirmed.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm">Müşteri</p>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>Ad Soyad: {confirmed.customer.fullName || "-"}</p>
                    <p>Öğrenci: {confirmed.customer.studentFullName || "-"}</p>
                    <p>Doğum Yılı: {confirmed.customer.birthYear || "-"}</p>
                    <p>Telefon: {confirmed.customer.phone || "-"}</p>
                    <p>E-posta: {confirmed.customer.email || "-"}</p>
                    <p>Adres: {confirmed.customer.address || "-"}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button asChild variant="outline">
                <Link href={`/site/${slug}/magaza`}>Alışverişe Devam Et</Link>
              </Button>
              <Button asChild>
                <Link href={`/site/${slug}/siparisler`}>Siparişlerimi Gör</Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
