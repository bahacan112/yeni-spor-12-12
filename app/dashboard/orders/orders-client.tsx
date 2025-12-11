"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function StatusBadge({ status }: { status: Order["status"] }) {
  switch (status) {
    case "pending":
      return <Badge className="bg-amber-500/20 text-amber-500">Bekliyor</Badge>;
    case "confirmed":
      return <Badge className="bg-blue-500/20 text-blue-500">Onaylandı</Badge>;
    case "shipped":
      return (
        <Badge className="bg-purple-500/20 text-purple-500">Kargoda</Badge>
      );
    case "delivered":
      return <Badge className="bg-green-500/20 text-green-500">Teslim</Badge>;
    case "cancelled":
      return <Badge className="bg-red-500/20 text-red-500">İptal</Badge>;
    default:
      return <Badge>Durum</Badge>;
  }
}

export default function OrdersClient({
  orders,
  tenantId,
}: {
  orders: Order[];
  tenantId: string;
}) {
  const [q, setQ] = useState("");
  const [ordersList, setOrdersList] = useState<Order[]>(orders);
  const [editing, setEditing] = useState<Order | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ordersList;
    return ordersList.filter((o) =>
      [
        o.orderNo,
        o.status,
        o.shippingAddress?.fullName,
        o.shippingAddress?.studentFullName,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .some((t) => t.includes(s))
    );
  }, [ordersList, q]);

  const updateStatus = async (orderId: string, status: Order["status"]) => {
    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      const json = await res.json();
      if (res.ok) {
        setOrdersList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch {}
  };

  const markPaid = async (orderId: string) => {
    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          markPaid: true,
          status: "confirmed",
        }),
      });
      const json = await res.json();
      if (res.ok && json.order) {
        setOrdersList((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: json.order.status } : o
          )
        );
      }
    } catch {}
  };

  const openEdit = (order: Order) => {
    setEditing(order);
    setEditFields({
      fullName: String(order.shippingAddress?.fullName || ""),
      studentFullName: String(order.shippingAddress?.studentFullName || ""),
      birthYear: String(order.shippingAddress?.birthYear || ""),
      phone: String(order.shippingAddress?.phone || ""),
      email: String(order.shippingAddress?.email || ""),
      address: String(order.shippingAddress?.address || ""),
      notes: String(order.notes || ""),
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          shippingAddress: {
            fullName: editFields.fullName,
            studentFullName: editFields.studentFullName,
            birthYear: editFields.birthYear,
            phone: editFields.phone,
            email: editFields.email,
            address: editFields.address,
          },
          notes: editFields.notes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.order) {
        setOrdersList((prev) =>
          prev.map((o) =>
            o.id === editing.id
              ? {
                  ...o,
                  shippingAddress:
                    json.order.shipping_address || o.shippingAddress,
                  notes: json.order.notes ?? o.notes,
                }
              : o
          )
        );
        setEditing(null);
      }
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Sipariş no, durum, ad soyad ile ara"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sipariş bulunamadı.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <Card key={o.id} className="border-border bg-secondary/30">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{o.orderNo}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₺{o.total}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                {o.shippingAddress ? (
                  <div className="text-xs text-muted-foreground">
                    <p>Ad Soyad: {o.shippingAddress?.fullName || "-"}</p>
                    <p>Öğrenci: {o.shippingAddress?.studentFullName || "-"}</p>
                    <p>Doğum Yılı: {o.shippingAddress?.birthYear || "-"}</p>
                    <p>Telefon: {o.shippingAddress?.phone || "-"}</p>
                    <p>E-posta: {o.shippingAddress?.email || "-"}</p>
                    <p>Adres: {o.shippingAddress?.address || "-"}</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(o.id, "confirmed")}
                  >
                    Onayla
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(o.id, "shipped")}
                  >
                    Kargoya Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(o.id, "delivered")}
                  >
                    Teslim
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(o.id, "cancelled")}
                  >
                    İptal
                  </Button>
                  <Button size="sm" onClick={() => markPaid(o.id)}>
                    Tahsil Edildi
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEdit(o)}
                  >
                    Düzenle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <SheetContent side="right">
          <DialogTitle>Sipariş Düzenle</DialogTitle>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Ad Soyad</Label>
              <Input
                value={editFields.fullName || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, fullName: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Öğrenci Ad Soyad</Label>
              <Input
                value={editFields.studentFullName || ""}
                onChange={(e) =>
                  setEditFields((f) => ({
                    ...f,
                    studentFullName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Doğum Yılı</Label>
              <Input
                value={editFields.birthYear || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, birthYear: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Telefon</Label>
              <Input
                value={editFields.phone || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>E-posta</Label>
              <Input
                value={editFields.email || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Adres</Label>
              <Input
                value={editFields.address || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, address: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Notlar</Label>
              <Input
                value={editFields.notes || ""}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Kapat
              </Button>
              <Button onClick={saveEdit}>Kaydet</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
