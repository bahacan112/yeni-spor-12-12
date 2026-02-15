"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Check,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface Sport {
  id: string;
  name: string;
  slug?: string;
  isActive: boolean;
  sortOrder: number;
}

export function SportsClient({
  initialSports,
  tenantId,
}: {
  initialSports: Sport[];
  tenantId: string;
}) {
  const supabase = createClient();
  const [sports, setSports] = useState<Sport[]>(initialSports);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [reassignDialog, setReassignDialog] = useState<{
    open: boolean;
    sourceSportId: string | null;
  }>({ open: false, sourceSportId: null });
  const [reassignTargetId, setReassignTargetId] = useState<string>("");
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const ids = sports.map((s) => s.id);
        if (!ids.length) return;
        const [{ count: groupsCountAll }, { count: appsCountAll }] =
          await Promise.all([
            supabase
              .from("groups")
              .select("id", { count: "exact", head: true })
              .eq("tenant_id", tenantId),
            supabase
              .from("applications")
              .select("id", { count: "exact", head: true })
              .eq("tenant_id", tenantId),
          ]);
        // Fetch per sport usage
        const usageEntries: Array<[string, number]> = [];
        for (const id of ids) {
          const [{ count: gCount }, { count: aCount }] = await Promise.all([
            supabase
              .from("groups")
              .select("id", { count: "exact", head: true })
              .eq("tenant_id", tenantId)
              .eq("sport_id", id),
            supabase
              .from("applications")
              .select("id", { count: "exact", head: true })
              .eq("tenant_id", tenantId)
              .eq("sport_id", id),
          ]);
          usageEntries.push([id, (gCount || 0) + (aCount || 0)]);
        }
        setUsageMap(Object.fromEntries(usageEntries));
      } catch {
        // silent
      }
    };
    loadUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sports, tenantId]);

  const addSport = async () => {
    if (!name.trim()) {
      toast.error("Branş adı zorunlu");
      return;
    }
    setSaving(true);
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const { data, error } = await supabase
        .from("sports")
        .insert({
          tenant_id: tenantId,
          name,
          slug,
          is_active: true,
          sort_order: sports.length + 1,
        })
        .select("*")
        .single();
      if (error) {
        toast.error("Branş eklenemedi");
        return;
      }
      setSports((prev) => [
        ...prev,
        {
          id: String(data.id),
          name: String(data.name),
          slug: data.slug ? String(data.slug) : undefined,
          isActive: Boolean(data.is_active),
          sortOrder: Number(data.sort_order || 0),
        },
      ]);
      setName("");
      toast.success("Branş eklendi");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (sport: Sport) => {
    const { error } = await supabase
      .from("sports")
      .update({ is_active: !sport.isActive })
      .eq("id", sport.id);
    if (error) {
      toast.error("Durum güncellenemedi");
      return;
    }
    setSports((prev) =>
      prev.map((s) => (s.id === sport.id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const startEdit = (sport: Sport) => {
    setEditingId(sport.id);
    setEditingName(sport.name);
  };
  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("sports")
      .update({ name: editingName })
      .eq("id", editingId);
    if (error) {
      toast.error("Branş güncellenemedi");
      return;
    }
    setSports((prev) =>
      prev.map((s) => (s.id === editingId ? { ...s, name: editingName } : s))
    );
    setEditingId(null);
    setEditingName("");
    toast.success("Branş güncellendi");
  };

  const removeSport = async (sport: Sport) => {
    const usage = usageMap[sport.id] || 0;
    if (usage > 0) {
      setReassignDialog({ open: true, sourceSportId: sport.id });
      return;
    }
    const { error } = await supabase.from("sports").delete().eq("id", sport.id);
    if (error) {
      toast.error("Branş silinemedi");
      return;
    }
    setSports((prev) => prev.filter((s) => s.id !== sport.id));
    toast.success("Branş silindi");
  };

  const confirmReassignAndDelete = async () => {
    if (!reassignDialog.sourceSportId || !reassignTargetId) return;
    setReassigning(true);
    try {
      const sourceId = reassignDialog.sourceSportId;
      if (sourceId === reassignTargetId) {
        toast.error("Aynı branşa yeniden atama yapılamaz");
        return;
      }
      const [{ error: gErr }, { error: aErr }] = await Promise.all([
        supabase
          .from("groups")
          .update({ sport_id: reassignTargetId })
          .eq("tenant_id", tenantId)
          .eq("sport_id", sourceId),
        supabase
          .from("applications")
          .update({ sport_id: reassignTargetId })
          .eq("tenant_id", tenantId)
          .eq("sport_id", sourceId),
      ]);
      if (gErr || aErr) {
        toast.error("Yeniden atama başarısız");
        return;
      }
      const [{ count: gCount }, { count: aCount }] = await Promise.all([
        supabase
          .from("groups")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("sport_id", sourceId),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("sport_id", sourceId),
      ]);
      const remaining = (gCount || 0) + (aCount || 0);
      if (remaining > 0) {
        toast.error("Tüm kullanımlar yeniden atanamadı");
        return;
      }
      const { error: delErr } = await supabase
        .from("sports")
        .delete()
        .eq("id", sourceId);
      if (delErr) {
        toast.error("Branş silinemedi");
        return;
      }
      setSports((prev) => prev.filter((s) => s.id !== sourceId));
      setUsageMap((prev) => {
        const copy = { ...prev };
        delete copy[sourceId];
        return copy;
      });
      toast.success("Yeniden atandı ve silindi");
      setReassignDialog({ open: false, sourceSportId: null });
      setReassignTargetId("");
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Branşlar</h1>
          <p className="text-sm text-muted-foreground">
            {sports.length} branş tanımlı
          </p>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-2">
            <Label>Branş Adı</Label>
            <Input
              placeholder="Örn: Basketbol"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" disabled={saving} onClick={addSport}>
              <Plus className="h-4 w-4 mr-1" />
              Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sports.map((sport) => (
          <Card
            key={sport.id}
            className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {editingId === sport.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-56"
                  />
                ) : (
                  <p className="font-medium">{sport.name}</p>
                )}
                <Badge
                  className={
                    sport.isActive
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "bg-slate-700 text-slate-300"
                  }
                >
                  {sport.isActive ? "Aktif" : "Pasif"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Kullanım: {usageMap[sport.id] || 0}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {editingId === sport.id ? (
                  <Button size="sm" variant="outline" onClick={saveEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Kaydet
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(sport)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Düzenle
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(sport)}
                >
                  {sport.isActive ? (
                    <ToggleRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 mr-1" />
                  )}
                  Durum
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeSport(sport)}
                  disabled={(usageMap[sport.id] || 0) > 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Sil
                </Button>
                {(usageMap[sport.id] || 0) > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setReassignDialog({ open: true, sourceSportId: sport.id })
                    }
                  >
                    Yeniden Ata
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog
        open={reassignDialog.open}
        onOpenChange={(open) =>
          setReassignDialog((prev) => ({
            ...prev,
            open,
            sourceSportId: open ? prev.sourceSportId : null,
          }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeniden Ata</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bu branş şu anda kullanılmaktadır. Silmeden önce tüm kullanımları
              başka bir aktif branşa yeniden atayın.
            </p>
            <div className="space-y-2">
              <Label>Yeni Branş</Label>
              <Select
                value={reassignTargetId}
                onValueChange={setReassignTargetId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branş seçin" />
                </SelectTrigger>
                <SelectContent>
                  {sports
                    .filter(
                      (s) => s.isActive && s.id !== reassignDialog.sourceSportId
                    )
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setReassignDialog({ open: false, sourceSportId: null })
              }
              className="bg-transparent"
            >
              İptal
            </Button>
            <Button
              onClick={confirmReassignAndDelete}
              disabled={!reassignTargetId || reassigning}
            >
              {reassigning ? "İşleniyor..." : "Yeniden Ata ve Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
