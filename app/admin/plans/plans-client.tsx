"use client";

import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Users,
  Layers,
  Building2,
  UserCog,
  Infinity,
  Star,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformPlan } from "@/lib/types";

const featureLabels: Record<string, string> = {
  basic_features: "Temel Özellikler",
  email_support: "E-posta Desteği",
  sms_notifications: "SMS Bildirimleri",
  website: "Web Sitesi",
  ecommerce: "E-ticaret",
  priority_support: "Öncelikli Destek",
  custom_domain: "Özel Domain",
  api_access: "API Erişimi",
};

interface PlansClientProps {
  plans: PlatformPlan[];
}

export function PlansClient({ plans }: PlansClientProps) {
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [items, setItems] = useState<PlatformPlan[]>(plans);
  const [newPlan, setNewPlan] = useState<{
    name: string;
    description: string;
    monthlyPrice: string;
    yearlyPrice: string;
    maxStudents: string;
    maxGroups: string;
    maxBranches: string;
    maxInstructors: string;
    features: string[];
    trialEnabled: boolean;
    trialDefaultDays: string;
  }>({
    name: "",
    description: "",
    monthlyPrice: "",
    yearlyPrice: "",
    maxStudents: "",
    maxGroups: "",
    maxBranches: "",
    maxInstructors: "",
    features: [],
    trialEnabled: false,
    trialDefaultDays: "",
  });
  const [editing, setEditing] = useState<PlatformPlan | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  async function createPlan() {
    const payload = {
      name: newPlan.name,
      description: newPlan.description,
      monthlyPrice: Number(newPlan.monthlyPrice || 0),
      yearlyPrice: Number(newPlan.yearlyPrice || 0),
      maxStudents: newPlan.maxStudents ? Number(newPlan.maxStudents) : null,
      maxGroups: newPlan.maxGroups ? Number(newPlan.maxGroups) : null,
      maxBranches: newPlan.maxBranches ? Number(newPlan.maxBranches) : null,
      maxInstructors: newPlan.maxInstructors
        ? Number(newPlan.maxInstructors)
        : null,
      features: newPlan.features,
      isActive: true,
      trialEnabled: newPlan.trialEnabled,
      trialDefaultDays: newPlan.trialDefaultDays
        ? Number(newPlan.trialDefaultDays)
        : null,
    };
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const created = (await res.json()) as PlatformPlan;
    setItems((prev) => [...prev, created]);
    setIsNewPlanOpen(false);
    setNewPlan({
      name: "",
      description: "",
      monthlyPrice: "",
      yearlyPrice: "",
      maxStudents: "",
      maxGroups: "",
      maxBranches: "",
      maxInstructors: "",
      features: [],
      trialEnabled: false,
      trialDefaultDays: "",
    });
  }

  async function updatePlan(id: string, patch: Partial<PlatformPlan>) {
    const res = await fetch(`/api/admin/plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as PlatformPlan;
    setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function deletePlan(id: string) {
    const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  async function setFeaturedPlan(id: string) {
    const current = items.find((p) => p.isFeatured);
    if (current && current.id !== id) {
      await updatePlan(current.id, { isFeatured: false });
    }
    await updatePlan(id, { isFeatured: true });
  }

  async function reorderPlans(nextItems: PlatformPlan[]) {
    setItems(nextItems);
    for (let i = 0; i < nextItems.length; i++) {
      const p = nextItems[i];
      const desired = i + 1;
      if (p.sortOrder !== desired) {
        await updatePlan(p.id, { sortOrder: desired });
      }
    }
  }

  async function movePlan(planId: string, direction: "up" | "down") {
    const index = items.findIndex((p) => p.id === planId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(newIndex, 0, moved);
    const normalized = next.map((p, i) => ({ ...p, sortOrder: i + 1 }));
    await reorderPlans(normalized);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Paketler</h1>
          <p className="text-slate-400">
            Platform abonelik paketlerini yönetin
          </p>
        </div>
        <Dialog open={isNewPlanOpen} onOpenChange={setIsNewPlanOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Paket Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                Yeni Paket Oluştur
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Yeni bir abonelik paketi tanımlayın
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Paket Adı</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                  placeholder="Örn: Profesyonel"
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Açıklama</Label>
                <Textarea
                  value={newPlan.description}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, description: e.target.value })
                  }
                  placeholder="Paket açıklaması..."
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Aylık Fiyat (TL)</Label>
                  <Input
                    type="number"
                    value={newPlan.monthlyPrice}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, monthlyPrice: e.target.value })
                    }
                    placeholder="999"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Yıllık Fiyat (TL)</Label>
                  <Input
                    type="number"
                    value={newPlan.yearlyPrice}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, yearlyPrice: e.target.value })
                    }
                    placeholder="9990"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Öğrenci</Label>
                  <Input
                    type="number"
                    value={newPlan.maxStudents}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, maxStudents: e.target.value })
                    }
                    placeholder="100 (boş = sınırsız)"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Grup</Label>
                  <Input
                    type="number"
                    value={newPlan.maxGroups}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, maxGroups: e.target.value })
                    }
                    placeholder="10"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Şube</Label>
                  <Input
                    type="number"
                    value={newPlan.maxBranches}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, maxBranches: e.target.value })
                    }
                    placeholder="1"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Eğitmen</Label>
                  <Input
                    type="number"
                    value={newPlan.maxInstructors}
                    onChange={(e) =>
                      setNewPlan({ ...newPlan, maxInstructors: e.target.value })
                    }
                    placeholder="5"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Trial Varsayılan Gün</Label>
                  <Input
                    type="number"
                    value={newPlan.trialDefaultDays}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        trialDefaultDays: e.target.value,
                      })
                    }
                    placeholder="14 (boş = tanımsız)"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Trial Açılabilir</Label>
                  <Switch
                    checked={newPlan.trialEnabled}
                    onCheckedChange={(v) =>
                      setNewPlan({ ...newPlan, trialEnabled: v })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Özellikler</Label>
                <div className="space-y-2">
                  {Object.entries(featureLabels).map(([key, label]) => {
                    const checked = newPlan.features.includes(key);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setNewPlan({
                              ...newPlan,
                              features: e.target.checked
                                ? [...newPlan.features, key]
                                : newPlan.features.filter((f) => f !== key),
                            });
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={createPlan}
              >
                Paket Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map((plan) => (
          <Card
            key={plan.id}
            className={`relative border-slate-800 bg-slate-900 ${
              plan.isFeatured ? "ring-2 ring-blue-500" : ""
            }`}
          >
            {plan.isFeatured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">En Popüler</Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-white">
                  {plan.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={(v) =>
                      updatePlan(plan.id, { isActive: v })
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      plan.isFeatured
                        ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                        : "border-slate-700 text-slate-300 bg-transparent"
                    }
                    onClick={() => setFeaturedPlan(plan.id)}
                    aria-label="Öne çıkar"
                  >
                    <Star
                      className={
                        plan.isFeatured
                          ? "h-4 w-4 fill-blue-400 text-blue-400"
                          : "h-4 w-4 text-slate-300"
                      }
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 bg-transparent"
                    onClick={() => movePlan(plan.id, "up")}
                    aria-label="Yukarı taşı"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 bg-transparent"
                    onClick={() => movePlan(plan.id, "down")}
                    aria-label="Aşağı taşı"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-400">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {plan.monthlyPrice.toLocaleString("tr-TR")}
                  </span>
                  <span className="text-slate-400">TL/ay</span>
                </div>
                <p className="text-sm text-slate-500">
                  veya {plan.yearlyPrice.toLocaleString("tr-TR")} TL/yıl
                </p>
              </div>

              {/* Limits */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Users className="h-4 w-4" />
                    Öğrenci
                  </span>
                  <span className="font-medium text-white">
                    {plan.maxStudents === null ? (
                      <Infinity className="h-4 w-4" />
                    ) : (
                      plan.maxStudents
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Layers className="h-4 w-4" />
                    Grup
                  </span>
                  <span className="font-medium text-white">
                    {plan.maxGroups === null ? (
                      <Infinity className="h-4 w-4" />
                    ) : (
                      plan.maxGroups
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Building2 className="h-4 w-4" />
                    Şube
                  </span>
                  <span className="font-medium text-white">
                    {plan.maxBranches === null ? (
                      <Infinity className="h-4 w-4" />
                    ) : (
                      plan.maxBranches
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <UserCog className="h-4 w-4" />
                    Eğitmen
                  </span>
                  <span className="font-medium text-white">
                    {plan.maxInstructors === null ? (
                      <Infinity className="h-4 w-4" />
                    ) : (
                      plan.maxInstructors
                    )}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Özellikler
                </p>
                <div className="space-y-2">
                  {Object.entries(featureLabels).map(([key, label]) => {
                    const hasFeature = plan.features.includes(key);
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-sm"
                      >
                        {hasFeature ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 text-slate-600" />
                        )}
                        <span
                          className={
                            hasFeature ? "text-slate-300" : "text-slate-600"
                          }
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-700 text-slate-300 bg-transparent"
                  onClick={() => {
                    setEditing(plan);
                    setIsEditOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                  onClick={() => deletePlan(plan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Paket Düzenle</DialogTitle>
            <DialogDescription className="text-slate-400">
              Paket detaylarını güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Paket Adı</Label>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Açıklama</Label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Öne Çıkar</Label>
                <Switch
                  checked={!!editing.isFeatured}
                  onCheckedChange={(v) =>
                    setEditing({ ...editing, isFeatured: v })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Aylık Fiyat (TL)</Label>
                  <Input
                    type="number"
                    value={String(editing.monthlyPrice)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        monthlyPrice: Number(e.target.value),
                      })
                    }
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Yıllık Fiyat (TL)</Label>
                  <Input
                    type="number"
                    value={String(editing.yearlyPrice)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        yearlyPrice: Number(e.target.value),
                      })
                    }
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Öğrenci</Label>
                  <Input
                    type="number"
                    value={
                      editing.maxStudents === null
                        ? ""
                        : String(editing.maxStudents)
                    }
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxStudents: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Grup</Label>
                  <Input
                    type="number"
                    value={
                      editing.maxGroups === null
                        ? ""
                        : String(editing.maxGroups)
                    }
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxGroups: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Şube</Label>
                  <Input
                    type="number"
                    value={
                      editing.maxBranches === null
                        ? ""
                        : String(editing.maxBranches)
                    }
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxBranches: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Max Eğitmen</Label>
                  <Input
                    type="number"
                    value={
                      editing.maxInstructors === null
                        ? ""
                        : String(editing.maxInstructors)
                    }
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        maxInstructors: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Trial Varsayılan Gün</Label>
                  <Input
                    type="number"
                    value={String(editing.trialDefaultDays ?? "")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        trialDefaultDays: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Trial Açılabilir</Label>
                  <Switch
                    checked={Boolean(editing.trialEnabled)}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, trialEnabled: v })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Özellikler</Label>
                <div className="space-y-2">
                  {Object.entries(featureLabels).map(([key, label]) => {
                    const checked = editing.features.includes(key);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...editing.features, key]
                              : editing.features.filter((f) => f !== key);
                            setEditing({ ...editing, features: next });
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    if (!editing) return;
                    updatePlan(editing.id, {
                      name: editing.name,
                      description: editing.description,
                      monthlyPrice: editing.monthlyPrice,
                      yearlyPrice: editing.yearlyPrice,
                      maxStudents: editing.maxStudents,
                      maxGroups: editing.maxGroups,
                      maxBranches: editing.maxBranches,
                      maxInstructors: editing.maxInstructors,
                      features: editing.features,
                      isFeatured: editing.isFeatured,
                      trialEnabled: editing.trialEnabled,
                      trialDefaultDays: editing.trialDefaultDays ?? null,
                    });
                    setIsEditOpen(false);
                  }}
                >
                  Kaydet
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-700 bg-transparent text-slate-300"
                  onClick={() => setIsEditOpen(false)}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
