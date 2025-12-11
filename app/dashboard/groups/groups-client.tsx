"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  User,
  Clock,
  Plus,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Group, Instructor, Branch } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface GroupsClientProps {
  initialGroups: Group[];
  instructors: Instructor[];
  branches: Branch[];
  tenantId: string;
}

export function GroupsClient({
  initialGroups,
  instructors,
  branches,
  tenantId,
}: GroupsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const supabase = createClient();
  const [groupName, setGroupName] = useState("");
  const [sportType, setSportType] = useState("");
  const [birthDateFrom, setBirthDateFrom] = useState("");
  const [birthDateTo, setBirthDateTo] = useState("");
  const [licenseRequirement, setLicenseRequirement] = useState<string>("any");
  const [capacity, setCapacity] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const defaultBranchId = branches.find((b) => b.isMain)?.id || "";
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [description, setDescription] = useState("");

  // Edit States
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editSportType, setEditSportType] = useState("");
  const [editBirthDateFrom, setEditBirthDateFrom] = useState("");
  const [editBirthDateTo, setEditBirthDateTo] = useState("");
  const [editLicenseRequirement, setEditLicenseRequirement] =
    useState<string>("any");
  const [editCapacity, setEditCapacity] = useState("");
  const [editMonthlyFee, setEditMonthlyFee] = useState("");
  const [editInstructorId, setEditInstructorId] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleEditClick = (e: React.MouseEvent, group: Group) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();

    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditSportType(group.sportType || "");
    setEditBirthDateFrom(group.birthDateFrom || "");
    setEditBirthDateTo(group.birthDateTo || "");
    setEditLicenseRequirement(group.licenseRequirement || "any");
    setEditCapacity(group.capacity.toString());
    setEditMonthlyFee(group.monthlyFee?.toString() || "");
    setEditInstructorId(group.instructorId || "");
    setEditBranchId(group.branchId || "");
    setEditDescription(group.description || "");
    setIsEditGroupOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    if (!editGroupName) {
      toast.error("Grup adı zorunlu");
      return;
    }
    if (!editBranchId) {
      toast.error("Şube seçin");
      return;
    }

    const { error } = await supabase
      .from("groups")
      .update({
        name: editGroupName,
        sport_type: editSportType || null,
        birth_date_from: editBirthDateFrom || null,
        birth_date_to: editBirthDateTo || null,
        license_requirement: editLicenseRequirement,
        capacity: Number(editCapacity || 0),
        monthly_fee: Number(editMonthlyFee || 0),
        instructor_id: editInstructorId || null,
        branch_id: editBranchId,
        description: editDescription || null,
      })
      .eq("id", editingGroup.id);

    if (error) {
      toast.error("Grup güncellenemedi");
      return;
    }

    toast.success("Grup güncellendi");
    setIsEditGroupOpen(false);
    location.reload();
  };

  const groups = initialGroups;

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.sportType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport =
      selectedSport === "all" || group.sportType === selectedSport;
    return matchesSearch && matchesSport;
  });

  const sportTypes = [
    ...new Set(groups.map((g) => g.sportType).filter(Boolean)),
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDayAbbreviation = (day: string) => {
    const days: Record<string, string> = {
      monday: "Pzt",
      tuesday: "Sal",
      wednesday: "Çar",
      thursday: "Per",
      friday: "Cum",
      saturday: "Cmt",
      sunday: "Paz",
    };
    return days[day] || day;
  };

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gruplar</h1>
          <p className="text-sm text-muted-foreground">
            {groups.length} grup mevcut
          </p>
        </div>
        <Sheet open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Grup</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[85vh] rounded-t-xl overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Yeni Grup Oluştur</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Grup Adı</Label>
                <Input
                  placeholder="Örn: U12 Basketbol A"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Spor Branşı</Label>
                <Select value={sportType} onValueChange={setSportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Branş seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basketball">Basketbol</SelectItem>
                    <SelectItem value="football">Futbol</SelectItem>
                    <SelectItem value="volleyball">Voleybol</SelectItem>
                    <SelectItem value="swimming">Yüzme</SelectItem>
                    <SelectItem value="tennis">Tenis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Doğum Tarihi Başlangıç</Label>
                  <Input
                    type="date"
                    value={birthDateFrom}
                    onChange={(e) => setBirthDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Doğum Tarihi Bitiş</Label>
                  <Input
                    type="date"
                    value={birthDateTo}
                    onChange={(e) => setBirthDateTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Lisans Gereksinimi</Label>
                  <Select
                    value={licenseRequirement}
                    onValueChange={setLicenseRequirement}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Herhangi</SelectItem>
                      <SelectItem value="licensed">Sadece Lisanslı</SelectItem>
                      <SelectItem value="unlicensed">
                        Sadece Lisanssız
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kapasite</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Aylık Ücret (₺)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Şube</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                    {!branches.length && (
                      <SelectItem value="none" disabled>
                        Şube bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Eğitmen</Label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Eğitmen seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors?.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.fullName}
                      </SelectItem>
                    ))}
                    {!instructors?.length && (
                      <SelectItem value="none" disabled>
                        Eğitmen bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  placeholder="Grup hakkında notlar..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={async () => {
                  if (!groupName) {
                    toast.error("Grup adı zorunlu");
                    return;
                  }
                  if (!branchId) {
                    toast.error("Şube seçin");
                    return;
                  }
                  if (
                    birthDateFrom &&
                    birthDateTo &&
                    new Date(birthDateFrom) > new Date(birthDateTo)
                  ) {
                    toast.error("Tarih aralığı geçersiz");
                    return;
                  }
                  const { error } = await supabase.from("groups").insert({
                    tenant_id: tenantId,
                    branch_id: branchId,
                    name: groupName,
                    description,
                    sport_type: sportType || null,
                    birth_date_from: birthDateFrom || null,
                    birth_date_to: birthDateTo || null,
                    license_requirement: licenseRequirement || "any",
                    capacity: Number(capacity || 0),
                    monthly_fee: Number(monthlyFee || 0),
                    instructor_id: instructorId || null,
                    status: "active",
                  });
                  if (error) {
                    toast.error("Grup oluşturulamadı");
                    return;
                  }
                  setIsNewGroupOpen(false);
                  location.reload();
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Grubu Kaydet
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Grup veya branş ara..."
          className="pl-9 bg-card/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sport Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedSport === "all" ? "default" : "outline"}
          size="sm"
          className="rounded-full whitespace-nowrap"
          onClick={() => setSelectedSport("all")}
        >
          Tümü
        </Button>
        {sportTypes.map((sport) => (
          <Button
            key={sport}
            variant={selectedSport === sport ? "default" : "outline"}
            size="sm"
            className="rounded-full whitespace-nowrap"
            onClick={() => setSelectedSport(sport || "all")}
          >
            {sport}
          </Button>
        ))}
      </div>

      {/* Group List */}
      <div className="space-y-3">
        {filteredGroups.map((group) => {
          const capacityPercent = group.studentCount
            ? (group.studentCount / group.capacity) * 100
            : 0;
          return (
            <div key={group.id} className="relative">
              <Link href={`/dashboard/groups/${group.id}`} className="block">
                <Card className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20">
                          <Users className="h-6 w-6 text-teal-500" />
                        </div>
                        <div>
                          <p className="font-semibold">{group.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{group.sportType}</span>
                            <span>•</span>
                            <span>
                              {group.birthDateFrom || group.birthDateTo
                                ? `${group.birthDateFrom || "—"} → ${
                                    group.birthDateTo || "—"
                                  }`
                                : "Tarih aralığı yok"}
                            </span>
                            <span>•</span>
                            <span>
                              {group.licenseRequirement === "licensed"
                                ? "Lisanslı"
                                : group.licenseRequirement === "unlicensed"
                                ? "Lisanssız"
                                : "Herhangi"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div onClick={(e) => e.preventDefault()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => handleEditClick(e, group)}
                            >
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem>Öğrenci Ekle</DropdownMenuItem>
                            <DropdownMenuItem>Program Düzenle</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Instructor */}
                    {group.instructor && (
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              group.instructor.photoUrl || "/placeholder.svg"
                            }
                          />
                          <AvatarFallback
                            name={group.instructor.fullName}
                            className="text-xs bg-purple-500/20 text-purple-500"
                          />
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {group.instructor.fullName}
                        </span>
                      </div>
                    )}

                    {/* Schedule */}
                    {group.schedule && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {Object.entries(group.schedule).map(([day, times]) => (
                          <Badge
                            key={day}
                            variant="outline"
                            className="text-xs"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {getDayAbbreviation(day)} {times[0]}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Capacity & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            <Users className="h-3 w-3 inline mr-1" />
                            {group.studentCount || 0} / {group.capacity} öğrenci
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(capacityPercent)}%
                          </span>
                        </div>
                        <Progress value={capacityPercent} className="h-1.5" />
                      </div>
                      <Badge className="ml-4 bg-green-500/20 text-green-500">
                        {formatCurrency(group.monthlyFee || 0)}/ay
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Grup bulunamadı</p>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Edit Group Sheet */}
      <Sheet open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Grubu Düzenle</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Grup Adı</Label>
              <Input
                placeholder="Örn: U12 Basketbol A"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Spor Branşı</Label>
              <Select value={editSportType} onValueChange={setEditSportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Branş seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basketball">Basketbol</SelectItem>
                  <SelectItem value="football">Futbol</SelectItem>
                  <SelectItem value="volleyball">Voleybol</SelectItem>
                  <SelectItem value="swimming">Yüzme</SelectItem>
                  <SelectItem value="tennis">Tenis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Doğum Tarihi Başlangıç</Label>
                <Input
                  type="date"
                  value={editBirthDateFrom}
                  onChange={(e) => setEditBirthDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Doğum Tarihi Bitiş</Label>
                <Input
                  type="date"
                  value={editBirthDateTo}
                  onChange={(e) => setEditBirthDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lisans Gereksinimi</Label>
                <Select
                  value={editLicenseRequirement}
                  onValueChange={setEditLicenseRequirement}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Herhangi</SelectItem>
                    <SelectItem value="licensed">Sadece Lisanslı</SelectItem>
                    <SelectItem value="unlicensed">Sadece Lisanssız</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kapasite</Label>
                <Input
                  type="number"
                  placeholder="20"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aylık Ücret (₺)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={editMonthlyFee}
                onChange={(e) => setEditMonthlyFee(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Şube</Label>
              <Select value={editBranchId} onValueChange={setEditBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Şube seçin" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Eğitmen</Label>
              <Select
                value={editInstructorId}
                onValueChange={setEditInstructorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Eğitmen seçin" />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.fullName}
                    </SelectItem>
                  ))}
                  <SelectItem value="none">Eğitmen Yok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                placeholder="Grup hakkında notlar..."
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <Button className="w-full" size="lg" onClick={handleUpdateGroup}>
              <Edit className="h-4 w-4 mr-2" />
              Grubu Güncelle
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
