"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Phone,
  Settings,
  MoreVertical,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  PencilLine,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { BranchWithCounts } from "@/lib/api/branches";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function BranchesClient({
  branches,
  tenantId,
}: {
  branches: BranchWithCounts[];
  tenantId: string;
}) {
  const router = useRouter();
  const { setCurrentBranch } = useAuthStore();
  const supabase = createClient();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const totalStudents = branches.reduce((acc, b) => acc + (b.students || 0), 0);
  const totalInstructors = branches.reduce(
    (acc, b) => acc + (b.instructors || 0),
    0
  );

  const handleBranchClick = (branch: BranchWithCounts) => {
    setCurrentBranch(branch);
    router.push(`/dashboard?branch=${branch.id}`);
    router.refresh(); // Opsiyonel, verilerin güncellenmesi için
  };

  const openNew = () => {
    setEditingBranchId(null);
    setForm({ name: "", address: "", phone: "", email: "" });
    setIsEditorOpen(true);
  };

  const openEdit = (branch: BranchWithCounts) => {
    setEditingBranchId(branch.id);
    setForm({
      name: branch.name || "",
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
    });
    setIsEditorOpen(true);
  };

  const saveBranch = async () => {
    if (!form.name) {
      toast.error("Şube adı zorunlu");
      return;
    }
    if (editingBranchId) {
      const { error } = await supabase
        .from("branches")
        .update({
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
        })
        .eq("id", editingBranchId);
      if (error) {
        toast.error("Şube güncellenemedi");
        return;
      }
      toast.success("Şube güncellendi");
    } else {
      const { error } = await supabase
        .from("branches")
        .insert({
          tenant_id: tenantId,
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
          is_active: true,
        });
      if (error) {
        toast.error("Şube oluşturulamadı");
        return;
      }
      toast.success("Şube oluşturuldu");
    }
    setIsEditorOpen(false);
    location.reload();
  };

  const toggleActive = async (branch: BranchWithCounts) => {
    const { error } = await supabase
      .from("branches")
      .update({ is_active: !branch.isActive })
      .eq("id", branch.id);
    if (error) {
      toast.error("Durum güncellenemedi");
      return;
    }
    toast.success(
      branch.isActive ? "Şube pasif yapıldı" : "Şube aktif yapıldı"
    );
    location.reload();
  };

  const makeMain = async (branch: BranchWithCounts) => {
    const { error: e1 } = await supabase
      .from("branches")
      .update({ is_main: false })
      .eq("tenant_id", tenantId);
    if (e1) {
      toast.error("Ana şube güncellenemedi");
      return;
    }
    const { error: e2 } = await supabase
      .from("branches")
      .update({ is_main: true })
      .eq("id", branch.id);
    if (e2) {
      toast.error("Ana şube atanamadı");
      return;
    }
    toast.success("Ana şube güncellendi");
    location.reload();
  };

  const removeBranch = async (branch: BranchWithCounts) => {
    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", branch.id);
    if (error) {
      toast.error("Şube silinemedi");
      return;
    }
    toast.success("Şube silindi");
    location.reload();
  };

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Şubeler</h1>
          <p className="text-sm text-muted-foreground">
            Tüm şubelerinizi yönetin
          </p>
        </div>
        <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <SheetTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" />
              Şube Ekle
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>
                {editingBranchId ? "Şube Düzenle" : "Yeni Şube"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Şube Adı</Label>
                <Input
                  placeholder="Örn: Kadıköy Şubesi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Textarea
                  placeholder="Tam adres"
                  rows={2}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  placeholder="0212 XXX XXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  placeholder="sube@akademi.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <Button className="w-full" size="lg" onClick={saveBranch}>
                <Building2 className="h-4 w-4 mr-2" />
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
            <Building2 className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold">{branches.length}</p>
            <p className="text-[10px] text-muted-foreground">Şube</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
            <p className="text-xl font-bold">{totalStudents}</p>
            <p className="text-[10px] text-muted-foreground">Öğrenci</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-amber-400" />
            <p className="text-xl font-bold">{totalInstructors}</p>
            <p className="text-[10px] text-muted-foreground">Eğitmen</p>
          </CardContent>
        </Card>
      </div>

      {/* Branches List */}
      <div className="space-y-3">
        {branches.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              Henüz şube bulunmuyor.
            </CardContent>
          </Card>
        ) : (
          branches.map((branch) => (
            <Card 
              key={branch.id} 
              className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleBranchClick(branch)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{branch.name}</h3>
                        {branch.isMain && (
                          <Badge className="bg-primary/10 text-primary border-0 text-xs">
                            Ana Şube
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">
                          {branch.address || "Adres girilmemiş"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(branch)}>
                        <PencilLine className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => makeMain(branch)}>
                        <Check className="h-4 w-4 mr-2" />
                        Ana Şube Yap
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(branch)}>
                        {branch.isActive ? (
                          <ToggleLeft className="h-4 w-4 mr-2" />
                        ) : (
                          <ToggleRight className="h-4 w-4 mr-2" />
                        )}
                        {branch.isActive ? "Pasif Yap" : "Aktif Yap"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => removeBranch(branch)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="font-bold text-lg">{branch.students}</p>
                    <p className="text-xs text-muted-foreground">Öğrenci</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/50">
                    <p className="font-bold text-lg">{branch.instructors}</p>
                    <p className="text-xs text-muted-foreground">Eğitmen</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background/50">
                    <div className="flex items-center justify-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {branch.phone || "Telefon girilmemiş"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      İletişim
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
