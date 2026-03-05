"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Users,
  ChevronRight,
  MoreVertical,
  User,
  Phone,
  MapPin,
  Camera,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Student, Group, Branch } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface StudentsClientProps {
  initialStudents: Student[];
  groups: Group[];
  branches: Branch[];
  tenantId: string;
}

export function StudentsClient({
  initialStudents,
  groups,
  branches,
  tenantId,
}: StudentsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [isNewStudentOpen, setIsNewStudentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    birthDate: "",
    gender: "",
    isLicensed: "false",
    branchId: branches.length > 0 ? branches[0].id : "",
    groupId: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    notes: "",
  });

  const filteredStudents = students.filter((student) => {
    const name = (student.fullName || "").toLowerCase();
    const no = (student.studentNo || "").toLowerCase();
    const phone = student.phone || "";
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      name.includes(q) || no.includes(q) || phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;
    const matchesGroup = groupFilter === "all"; // Temporary until groupId is properly linked in types/data

    return matchesSearch && matchesStatus && matchesGroup;
  });

  const openDeleteDialog = (e: any, student: Student) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingStudent(student);
    setDeleteConfirmInput("");
    setIsDeleteOpen(true);
  };

  const performDeleteStudent = async () => {
    if (!deletingStudent) return;
    if (deleteConfirmInput.trim() !== deletingStudent.fullName.trim()) {
      toast.error("Onay için öğrencinin adını birebir yazın");
      return;
    }
    setIsDeleting(true);
    try {
      const r = await fetch(`/api/admin/students/${deletingStudent.id}/purge`, {
        method: "POST",
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(j?.error || "Öğrenci silinemedi");
        return;
      }
      setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
      toast.success("Öğrenci silindi");
      setIsDeleteOpen(false);
      setDeletingStudent(null);
      setDeleteConfirmInput("");
      router.refresh();
    } catch (err) {
      console.error("Student delete error:", err);
      toast.error("Öğrenci silinemedi");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
            Aktif
          </Badge>
        );
      case "passive":
        return (
          <Badge className="bg-gray-500/20 text-gray-500 hover:bg-gray-500/30">
            Pasif
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
            Askıda
          </Badge>
        );
      case "graduated":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
            Mezun
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: tenantRow } = await supabase
        .from("tenants")
        .select("subscription_status, is_limited, max_students")
        .eq("id", tenantId)
        .single();

      const { count: studentCount } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);
      const { data: activeSub } = await supabase
        .from("tenant_subscriptions")
        .select("status, plan:platform_plans(max_students)")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      const isLimited = Boolean(tenantRow?.is_limited);
      const subStatus = String(tenantRow?.subscription_status || "active");
      const configuredMax = Number(tenantRow?.max_students ?? 0) || 0;
      const planMax = Number((activeSub as any)?.plan?.max_students ?? 0) || 0;
      let allowedMax = configuredMax;
      if (!isLimited && subStatus === "active") {
        allowedMax = configuredMax || planMax || Number.POSITIVE_INFINITY;
      }
      if (isLimited || subStatus !== "active") {
        // When limited or expired, a missing max implies 0
        allowedMax = configuredMax || 0;
      }
      if (
        studentCount !== null &&
        allowedMax !== Number.POSITIVE_INFINITY &&
        (studentCount || 0) >= allowedMax
      ) {
        toast.error(
          "Öğrenci limiti aşıldı. Paket veya abonelik sürenizi güncelleyin.",
        );
        setIsSubmitting(false);
        return;
      }
      // 1. Insert student
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          tenant_id: tenantId,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          birth_date: formData.birthDate || null,
          gender: formData.gender,
          is_licensed: formData.isLicensed === "true",
          branch_id: formData.branchId || null,
          guardian_name: formData.guardianName,
          guardian_phone: formData.guardianPhone,
          address: formData.address,
          notes: formData.notes,
          status: "active",
        })
        .select()
        .single();

      if (studentError) {
        throw studentError;
      }

      // 2. Insert into group if selected
      if (formData.groupId && student) {
        const { error: groupError } = await supabase
          .from("student_groups")
          .upsert(
            {
              student_id: student.id,
              group_id: formData.groupId,
              status: "active",
              joined_at: new Date().toISOString().split("T")[0],
              left_at: null,
            },
            { onConflict: "student_id,group_id" },
          );

        if (groupError) {
          console.error("Error adding student to group:", groupError);
          toast.error("Grup ataması yapılamadı");
        }
      }

      // Success
      toast.success("Öğrenci başarıyla oluşturuldu");
      setIsNewStudentOpen(false);
      router.refresh();

      // Reset form
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        birthDate: "",
        gender: "",
        isLicensed: "false",
        branchId: branches.length > 0 ? branches[0].id : "",
        groupId: "",
        guardianName: "",
        guardianPhone: "",
        address: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating student:", error);
      toast.error("Öğrenci oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Öğrenciler</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} öğrenci kayıtlı
          </p>
        </div>
        <Sheet open={isNewStudentOpen} onOpenChange={setIsNewStudentOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Öğrenci</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[90vh] rounded-t-xl overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Yeni Öğrenci Kaydı</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-6 pb-8">
              {/* Photo */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback
                      name={formData.fullName}
                      className="bg-primary/20 text-2xl"
                    />
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Personal Info */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    Kişisel Bilgiler
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ad Soyad *</Label>
                    <Input
                      placeholder="Öğrenci adı soyadı"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleFormChange("fullName", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Doğum Tarihi</Label>
                      <Input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) =>
                          handleFormChange("birthDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cinsiyet</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(v) => handleFormChange("gender", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Erkek</SelectItem>
                          <SelectItem value="female">Kadın</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Lisans Durumu</Label>
                      <Select
                        value={formData.isLicensed}
                        onValueChange={(v) => handleFormChange("isLicensed", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Lisanssız</SelectItem>
                          <SelectItem value="true">Lisanslı</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    İletişim Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      placeholder="+90 5XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) =>
                        handleFormChange("phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <Input
                      type="email"
                      placeholder="ornek@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleFormChange("email", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adres</Label>
                    <Textarea
                      placeholder="Ev adresi"
                      value={formData.address}
                      onChange={(e) =>
                        handleFormChange("address", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Guardian Info */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Veli Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Veli Adı Soyadı</Label>
                    <Input
                      placeholder="Veli adı soyadı"
                      value={formData.guardianName}
                      onChange={(e) =>
                        handleFormChange("guardianName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Veli Telefon</Label>
                    <Input
                      placeholder="+90 5XX XXX XXXX"
                      value={formData.guardianPhone}
                      onChange={(e) =>
                        handleFormChange("guardianPhone", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Branch & Group */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    Şube ve Grup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Şube</Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={(v) => handleFormChange("branchId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Şube seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                        {branches.length === 0 && (
                          <SelectItem value="none" disabled>
                            Şube bulunamadı
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Grup (Opsiyonel)</Label>
                    <Select
                      value={formData.groupId}
                      onValueChange={(v) => handleFormChange("groupId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Grup seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                        {groups.length === 0 && (
                          <SelectItem value="none" disabled>
                            Grup bulunamadı
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="bg-card/50 border-border/50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Label>Notlar</Label>
                    <Textarea
                      placeholder="Öğrenci ile ilgili ek notlar..."
                      value={formData.notes}
                      onChange={(e) =>
                        handleFormChange("notes", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={!formData.fullName || isSubmitting}
              >
                {isSubmitting ? "Kaydediliyor..." : "Öğrenci Kaydet"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="İsim, numara veya telefon ara..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Filtreler</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Durum</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="passive">Pasif</SelectItem>
                    <SelectItem value="suspended">Askıda</SelectItem>
                    <SelectItem value="graduated">Mezun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Grup</label>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grup seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => {}}>
                Filtreleri Uygula
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-500">
              {students.filter((s) => s.status === "active").length}
            </p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-500/10 border-gray-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-gray-400">
              {students.filter((s) => s.status === "passive").length}
            </p>
            <p className="text-xs text-muted-foreground">Pasif</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-red-500">
              {students.filter((s) => s.status === "suspended").length}
            </p>
            <p className="text-xs text-muted-foreground">Askıda</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-blue-500">
              {students.filter((s) => s.status === "graduated").length}
            </p>
            <p className="text-xs text-muted-foreground">Mezun</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.map((student) => (
          <Card
            key={student.id}
            className="bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
            onClick={() => router.push(`/dashboard/students/${student.id}`)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.photoUrl || "/placeholder.svg"} />
                  <AvatarFallback
                    name={student.fullName}
                    className="bg-primary/20"
                  />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{student.fullName}</p>
                    {student.isLicensed && (
                      <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
                        Lisanslı
                      </Badge>
                    )}
                    {getStatusBadge(student.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {(() => {
                      const b = branches.find(
                        (br) => br.id === student.branchId,
                      );
                      return b ? <span>{b.name}</span> : null;
                    })()}
                    {branches.find((br) => br.id === student.branchId) && (
                      <span>•</span>
                    )}
                    {student.studentNo && <span>#{student.studentNo}</span>}
                    {student.phone && (
                      <>
                        <span>•</span>
                        <span>{student.phone}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/dashboard/students/${student.id}`);
                        }}
                      >
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/dashboard/students/${student.id}`);
                        }}
                      >
                        Ödeme Al
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/dashboard/students/${student.id}`);
                        }}
                      >
                        Grup Ata
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(e) => openDeleteDialog(e as any, student)}
                      >
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredStudents.length === 0 && (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Öğrenci bulunamadı</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Öğrenciyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Silmeyi onaylamak için öğrencinin adını
              birebir yazın.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Onay</Label>
            <Input
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={deletingStudent?.fullName || ""}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeletingStudent(null);
                setDeleteConfirmInput("");
              }}
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performDeleteStudent}
              className="bg-red-600 hover:bg-red-700"
              disabled={
                isDeleting ||
                !deletingStudent ||
                deleteConfirmInput.trim() !== deletingStudent.fullName.trim()
              }
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
