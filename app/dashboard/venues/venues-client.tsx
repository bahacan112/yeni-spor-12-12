"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  Users,
  DollarSign,
  Building,
  MoreVertical,
  Edit,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Venue, Branch } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

interface VenuesClientProps {
  initialVenues: Venue[];
  tenantId?: string;
  branches?: Branch[];
}

export function VenuesClient({
  initialVenues,
  tenantId,
  branches = [],
}: VenuesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewVenueOpen, setIsNewVenueOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState<{
    name: string;
    type?: string;
    capacity?: string;
    hourlyRate?: string;
    address?: string;
    description?: string;
    isActive: boolean;
    branchId?: string;
  }>({
    name: "",
    type: undefined,
    capacity: "",
    hourlyRate: "",
    address: "",
    description: "",
    isActive: true,
    branchId: "",
  });
  const supabase = createClient();
  const { currentBranch } = useAuthStore();
  const fallbackBranchId =
    branches.find((b) => b.isMain)?.id || branches[0]?.id;

  const venues = initialVenues;

  const filteredVenues = venues.filter(
    (venue) =>
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "outdoor":
        return "bg-green-500/20 text-green-500";
      case "indoor":
        return "bg-blue-500/20 text-blue-500";
      case "pool":
        return "bg-cyan-500/20 text-cyan-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const getTypeName = (type?: string) => {
    switch (type) {
      case "outdoor":
        return "Açık Alan";
      case "indoor":
        return "Kapalı Salon";
      case "pool":
        return "Havuz";
      default:
        return "Diğer";
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Sahalar</h1>
          <p className="text-sm text-muted-foreground">
            {venues.length} saha mevcut
          </p>
        </div>
        <Sheet open={isNewVenueOpen} onOpenChange={setIsNewVenueOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditingVenue(null);
                setForm({
                  name: "",
                  type: undefined,
                  capacity: "",
                  hourlyRate: "",
                  address: "",
                  description: "",
                  isActive: true,
                  branchId: "",
                });
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Saha</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[85vh] rounded-t-xl overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>
                {editingVenue ? "Saha Düzenle" : "Yeni Saha Ekle"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Saha Adı</Label>
                <Input
                  placeholder="Örn: Ana Salon"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tesis Tipi</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tip seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Kapalı Salon</SelectItem>
                    <SelectItem value="outdoor">Açık Alan</SelectItem>
                    <SelectItem value="pool">Havuz</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Şube</Label>
                <Select
                  value={form.branchId || ""}
                  onValueChange={(v) =>
                    setForm({ ...form, branchId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Şube atama</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Kapasite (Kişi)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saatlik Ücret (₺)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.hourlyRate}
                    onChange={(e) =>
                      setForm({ ...form, hourlyRate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adres / Konum</Label>
                <Textarea
                  placeholder="Tesis adresi veya konumu..."
                  rows={2}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  placeholder="Saha özellikleri..."
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <div>
                  <p className="font-medium text-sm">Aktif</p>
                  <p className="text-xs text-muted-foreground">
                    Rezervasyona açık
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: !!v })}
                />
              </div>

              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={async () => {
                  try {
                    console.log("Sahayı Kaydet tıklandı", {
                      form,
                      tenantId,
                      currentBranch,
                    });
                    if (!form.name) {
                      toast.error("Saha adı zorunlu");
                      return;
                    }
                    if (!tenantId) {
                      toast.error("Tenant bilgisi bulunamadı");
                      return;
                    }
                    const selectedBranchId = form.branchId || "";
                    if (editingVenue) {
                      const { error } = await supabase
                        .from("venues")
                        .update({
                          tenant_id: tenantId,
                          branch_id: selectedBranchId || null,
                          name: form.name,
                          type: form.type || null,
                          capacity: form.capacity
                            ? Number(form.capacity)
                            : null,
                          hourly_rate: form.hourlyRate
                            ? Number(form.hourlyRate)
                            : null,
                          address: form.address,
                          description: form.description,
                          is_active: form.isActive,
                        })
                        .eq("id", editingVenue.id);
                      if (error) {
                        toast.error("Saha güncellenemedi");
                        return;
                      }
                    } else {
                      const { error } = await supabase.from("venues").insert({
                        tenant_id: tenantId,
                        branch_id: selectedBranchId || null,
                        name: form.name,
                        type: form.type || null,
                        capacity: form.capacity ? Number(form.capacity) : null,
                        hourly_rate: form.hourlyRate
                          ? Number(form.hourlyRate)
                          : null,
                        address: form.address,
                        description: form.description,
                        amenities: [],
                        is_active: form.isActive,
                      });
                      if (error) {
                        toast.error("Saha oluşturulamadı");
                        return;
                      }
                    }
                    setIsNewVenueOpen(false);
                    location.reload();
                  } catch (e: any) {
                    console.error("Saha kaydetmede hata", e);
                    toast.error("Beklenmeyen bir hata oluştu");
                  }
                }}
              >
                <Building className="h-4 w-4 mr-2" />
                Sahayı Kaydet
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Saha ara..."
          className="pl-9 bg-card/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Venue List */}
      <div className="space-y-3">
        {filteredVenues.map((venue) => (
          <Card
            key={venue.id}
            className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${getTypeIcon(
                    venue.type
                  )}`}
                >
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{venue.name}</p>
                      <Badge variant="outline" className="mt-1">
                        {getTypeName(venue.type)}
                      </Badge>
                    </div>
                    <Badge
                      className={
                        venue.isActive
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }
                    >
                      {venue.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingVenue(venue);
                            setForm({
                              name: venue.name,
                              type: venue.type,
                              capacity: venue.capacity
                                ? String(venue.capacity)
                                : "",
                              hourlyRate: venue.hourlyRate
                                ? String(venue.hourlyRate)
                                : "",
                              address: venue.address || "",
                              description: venue.description || "",
                              isActive: venue.isActive,
                              branchId: venue.branchId || "",
                            });
                            setIsNewVenueOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            const { error } = await supabase
                              .from("venues")
                              .update({ is_active: !venue.isActive })
                              .eq("id", venue.id);
                            if (error) {
                              toast.error("Durum güncellenemedi");
                              return;
                            }
                            location.reload();
                          }}
                        >
                          {venue.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Pasif Yap
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Aktif Yap
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Sahayı silmek istediğinize emin misiniz?"
                              )
                            ) {
                              return;
                            }
                            const { error } = await supabase
                              .from("venues")
                              .delete()
                              .eq("id", venue.id);
                            if (error) {
                              toast.error("Saha silinemedi");
                              return;
                            }
                            location.reload();
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {venue.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {venue.capacity} kişi
                      </span>
                    )}
                    {venue.hourlyRate && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(venue.hourlyRate)}/saat
                      </span>
                    )}
                  </div>

                  {venue.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {venue.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredVenues.length === 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Saha bulunamadı</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
