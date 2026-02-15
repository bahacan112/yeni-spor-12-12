"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import {
  Link2,
  Copy,
  Check,
  Plus,
  QrCode,
  Eye,
  Calendar,
  Users,
  ExternalLink,
  Share2,
  Trash,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RegistrationLink } from "@/lib/types";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RegistrationLinksClient({
  links,
  tenantId,
}: {
  links: RegistrationLink[];
  tenantId: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isNewLinkOpen, setIsNewLinkOpen] = useState(false);
  const [qrDialog, setQrDialog] = useState<{
    open: boolean;
    link: RegistrationLink | null;
  }>({
    open: false,
    link: null,
  });
  const supabase = createClient();
  const [sportsOptions, setSportsOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [form, setForm] = useState<{
    title: string;
    code: string;
    branchId: string;
    groupId: string;
    expiresAt: string;
    isActive: boolean;
  }>({
    title: "",
    code: "",
    branchId: "",
    groupId: "",
    expiresAt: "",
    isActive: true,
  });
  const [editing, setEditing] = useState<RegistrationLink | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  useEffect(() => {
    const loadSports = async () => {
      const { data } = await supabase
        .from("sports")
        .select("id,name")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("sort_order")
        .order("name");
      const items = (data || []).map((s: any) => ({
        id: String(s.id),
        name: String(s.name),
      }));
      setSportsOptions(items);
    };
    loadSports();
  }, [tenantId, supabase]);

  const copyLink = (id: string, code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/kayit/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Kayıt Linkleri</h1>
          <p className="text-sm text-muted-foreground">
            Online kayıt formlarını yönetin
          </p>
        </div>
        <Sheet open={isNewLinkOpen} onOpenChange={setIsNewLinkOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm({
                  title: "",
                  code: "",
                  branchId: "",
                  groupId: "",
                  expiresAt: "",
                  isActive: true,
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Yeni Link
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>
                {editing ? "Linki Düzenle" : "Yeni Kayıt Linki"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Link Adı</Label>
                <Input
                  placeholder="Örn: 2024-2025 Genel Kayıt"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    akademi.com/kayit/
                  </span>
                  <Input
                    placeholder="genel-kayit"
                    className="flex-1"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Branş</Label>
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Branş seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Branşlar</SelectItem>
                    {sportsOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Son Geçerlilik Tarihi (Opsiyonel)</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                <div>
                  <p className="font-medium text-sm">Aktif</p>
                  <p className="text-xs text-muted-foreground">
                    Linki hemen yayınla
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: !!v })}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={async () => {
                  if (!form.code) {
                    toast.error("Slug zorunlu");
                    return;
                  }
                  if (editing) {
                    const { error } = await supabase
                      .from("registration_links")
                      .update({
                        title: form.title,
                        code: form.code,
                        expires_at: form.expiresAt || null,
                        is_active: form.isActive,
                      })
                      .eq("id", editing.id);
                    if (error) {
                      toast.error("Güncellenemedi");
                      return;
                    }
                  } else {
                    const { error } = await supabase
                      .from("registration_links")
                      .insert({
                        tenant_id: tenantId,
                        title: form.title,
                        code: form.code,
                        expires_at: form.expiresAt || null,
                        is_active: form.isActive,
                      });
                    if (error) {
                      toast.error("Oluşturulamadı");
                      return;
                    }
                  }
                  setIsNewLinkOpen(false);
                  location.reload();
                }}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{links.length}</p>
            <p className="text-xs text-muted-foreground">Toplam Link</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {links.filter((l) => l.isActive).length}
            </p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {links.reduce((acc, l) => acc + (l.usedCount || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Başvuru</p>
          </CardContent>
        </Card>
      </div>

      {/* Links List */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Kayıt linki bulunamadı.
          </p>
        ) : (
          links.map((link) => (
            <Card key={link.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {link.title || link.code}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={
                          link.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-0"
                            : "bg-muted text-muted-foreground border-0"
                        }
                      >
                        {link.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      /kayit/{link.code}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => copyLink(link.id, link.code)}
                  >
                    {copiedId === link.id ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {/* Visits not tracked in basic model yet */}
                  {/* <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {link.visits} görüntülenme
                  </span> */}
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {link.usedCount} başvuru
                  </span>
                </div>

                {link.expiresAt && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3" />
                    Son geçerlilik:{" "}
                    {new Date(link.expiresAt).toLocaleDateString("tr-TR")}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => setQrDialog({ open: true, link })}
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    QR Kod
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => copyLink(link.id, link.code)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Linki kopyala
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setEditing(link);
                      setForm({
                        title: link.title || "",
                        code: link.code,
                        branchId: link.branchId || "",
                        groupId: link.groupId || "",
                        expiresAt: link.expiresAt || "",
                        isActive: link.isActive,
                      });
                      setIsNewLinkOpen(true);
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Paylaş
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      const url = `${window.location.origin}/kayit/${link.code}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Önizle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/10"
                    onClick={() => setDeleteDialog({ open: true, id: link.id })}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialog.open}
        onOpenChange={(open) => setQrDialog({ ...qrDialog, open })}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              {qrDialog.link?.title || qrDialog.link?.code}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-xl">
              <QRCode
                id="qr-svg"
                value={`${
                  typeof window !== "undefined" ? window.location.origin : ""
                }/kayit/${qrDialog.link?.code || ""}`}
                size={192}
                bgColor="#ffffff"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Bu QR kodu taratarak kayıt formuna ulaşılabilir
            </p>
            <Button
              className="w-full"
              onClick={() => {
                const svg = document.getElementById(
                  "qr-svg"
                ) as SVGSVGElement | null;
                if (!svg) return;
                const serializer = new XMLSerializer();
                const source = serializer.serializeToString(svg);
                const blob = new Blob([source], {
                  type: "image/svg+xml;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${qrDialog.link?.code || "qr"}.svg`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              QR Kodu İndir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kayıt linkini sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kayıt linkini silmek istediğinize emin misiniz? Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteDialog.id) return;
                const { error } = await supabase
                  .from("registration_links")
                  .delete()
                  .eq("id", deleteDialog.id);
                if (error) {
                  toast.error("Silinemedi");
                  return;
                }
                toast.success("Kayıt linki silindi");
                setDeleteDialog({ open: false, id: null });
                location.reload();
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
