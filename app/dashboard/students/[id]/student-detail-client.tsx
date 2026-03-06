"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Edit,
  Wallet,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PaymentSheet } from "@/components/students/payment-sheet";
import { Student, Group, MonthlyDue } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ImageUploader from "@/components/media/image-uploader";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { sendDueReminderAction } from "../dues-actions";
import { BellRing } from "lucide-react";

interface StudentDetailClientProps {
  student: Student;
  groups: Group[];
  allBranchGroups: Group[];
  monthlyDues: MonthlyDue[];
}

export function StudentDetailClient({
  student,
  groups,
  allBranchGroups,
  monthlyDues,
}: StudentDetailClientProps) {
  const router = useRouter();
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<MonthlyDue | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const supabase = createClient();
  const [fullName, setFullName] = useState(student.fullName);
  const [phone, setPhone] = useState(student.phone || "");
  const [email, setEmail] = useState(student.email || "");
  const [birthDate, setBirthDate] = useState(student.birthDate || "");
  const [address, setAddress] = useState(student.address || "");
  const [status, setStatus] = useState<Student["status"]>(student.status);
  const [studentNo, setStudentNo] = useState(student.studentNo || "");
  const [gender, setGender] = useState<string>(student.gender || "");
  const [isLicensed, setIsLicensed] = useState<boolean>(!!student.isLicensed);
  const [licenseNo, setLicenseNo] = useState(student.licenseNo || "");
  const [licenseIssuedAt, setLicenseIssuedAt] = useState<string>(
    student.licenseIssuedAt || ""
  );
  const [licenseExpiresAt, setLicenseExpiresAt] = useState<string>(
    student.licenseExpiresAt || ""
  );
  const [licenseFederation, setLicenseFederation] = useState<string>(
    student.licenseFederation || ""
  );
  const [guardianName, setGuardianName] = useState<string>(
    student.guardianName || ""
  );
  const [guardianPhone, setGuardianPhone] = useState<string>(
    student.guardianPhone || ""
  );
  const [guardianEmail, setGuardianEmail] = useState<string>(
    student.guardianEmail || ""
  );
  const [photoUrl, setPhotoUrl] = useState<string>(student.photoUrl || "");
  const [notes, setNotes] = useState<string>(student.notes || "");
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [feePlanOpen, setFeePlanOpen] = useState(false);
  const [overrideType, setOverrideType] = useState<"amount" | "discount">(
    "amount"
  );
  const [overrideValue, setOverrideValue] = useState<string>("");
  const [currentOverride, setCurrentOverride] = useState<{
    override_amount?: number;
    discount_percent?: number;
  } | null>(null);
  const [branchName, setBranchName] = useState<string>("");
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("student_fee_overrides")
          .select("override_amount, discount_percent")
          .eq("student_id", student.id)
          .eq("branch_id", student.branchId)
          .limit(1)
          .maybeSingle();
        if (data) {
          setCurrentOverride(data as any);
          if (data.override_amount != null) {
            setOverrideType("amount");
            setOverrideValue(String(data.override_amount));
          } else if (data.discount_percent != null) {
            setOverrideType("discount");
            setOverrideValue(String(data.discount_percent));
          }
        }
      } catch {}
    };
    load();
  }, [student.id, student.branchId]);
  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await supabase
          .from("branches")
          .select("name")
          .eq("id", student.branchId)
          .maybeSingle();
        if (data?.name) setBranchName(String(data.name));
      } catch {}
    };
    run();
  }, [student.branchId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500">Aktif</Badge>;
      case "passive":
        return <Badge className="bg-gray-500/20 text-gray-500">Pasif</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-500">Askıda</Badge>;
      case "graduated":
        return <Badge className="bg-blue-500/20 text-blue-500">Mezun</Badge>;
      default:
        return null;
    }
  };

  const getDueStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/20 text-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Ödendi
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-500">
            <Clock className="mr-1 h-3 w-3" />
            Bekliyor
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-blue-500/20 text-blue-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Kısmi
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500/20 text-red-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            Gecikmiş
          </Badge>
        );
      default:
        return null;
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const totalDue = monthlyDues.reduce(
    (sum, d) => sum + Number((d.computedAmount ?? d.amount) || 0),
    0
  );
  const totalPaid = monthlyDues.reduce(
    (sum, d) => sum + Number(d.paidAmount || 0),
    0
  );
  const paymentProgress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("tr-TR", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const handlePayment = (due: MonthlyDue) => {
    setSelectedDue(due);
    setPaymentSheetOpen(true);
  };

  // Filter ALL branch groups based on birth date and license (for the group selector)
  const availableGroups = allBranchGroups.filter((group) => {
    if (group.status !== "active") return false;

    // Check birth date
    if (
      group.birthDateFrom &&
      birthDate &&
      new Date(birthDate) < new Date(group.birthDateFrom)
    )
      return false;
    if (
      group.birthDateTo &&
      birthDate &&
      new Date(birthDate) > new Date(group.birthDateTo)
    )
      return false;

    // Check license
    if (group.licenseRequirement === "licensed" && !isLicensed) return false;
    if (group.licenseRequirement === "unlicensed" && isLicensed) return false;

    return true;
  });

  const handleGroupJoin = async () => {
    if (!selectedGroup) {
      toast.error("Lütfen bir grup seçin");
      return;
    }

    try {
      // Use upsert to handle re-adding students who were previously removed (soft deleted)
      // On conflict (student_id, group_id), we update the status to active and clear left_at
      const { error } = await supabase.from("student_groups").upsert(
        {
          student_id: student.id,
          group_id: selectedGroup,
          status: "active",
          joined_at: new Date().toISOString().split("T")[0],
          left_at: null, // Clear left_at if it was set
        },
        { onConflict: "student_id,group_id" }
      );

      if (error) throw error;

      toast.success("Öğrenci gruba eklendi");
      setSelectedGroup("");
      router.refresh();
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Grup ataması başarısız");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Öğrenci Detayı</h1>
      </div>

      {/* Profile Card */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.photoUrl || "/placeholder.svg"} />
              <AvatarFallback
                name={student.fullName}
                className="bg-primary/20 text-lg"
              />
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{student.fullName}</h2>
                  <p className="text-sm text-muted-foreground">
                    #{student.studentNo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {branchName && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {branchName}
                    </Badge>
                  )}
                  {getStatusBadge(student.status)}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 bg-transparent"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit className="h-3 w-3" />
                  Düzenle
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => setPaymentSheetOpen(true)}
                >
                  <Wallet className="h-3 w-3" />
                  Ödeme Al
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="bg-card">
        <CardContent className="p-4 space-y-3">
          {student.phone && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
                <Phone className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="text-sm">{student.phone}</p>
              </div>
            </div>
          )}
          {student.email && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20">
                <Mail className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-posta</p>
                <p className="text-sm">{student.email}</p>
              </div>
            </div>
          )}
          {student.birthDate && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Doğum Tarihi</p>
                <p className="text-sm">
                  {new Date(student.birthDate).toLocaleDateString("tr-TR")}
                  {calculateAge(student.birthDate) && (
                    <span className="text-muted-foreground ml-1">
                      ({calculateAge(student.birthDate)} yaş)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          {student.address && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/20">
                <MapPin className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adres</p>
                <p className="text-sm">{student.address}</p>
              </div>
            </div>
          )}
          {(student.guardianName || student.guardianPhone) && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20">
                <Users className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Veli Bilgisi</p>
                <p className="text-sm">{student.guardianName}</p>
                {student.guardianPhone && (
                  <a
                    href={`tel:${student.guardianPhone}`}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    {student.guardianPhone}
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">Ödemeler</TabsTrigger>
          <TabsTrigger value="groups">Gruplar</TabsTrigger>
          <TabsTrigger value="attendance">Yoklama</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4 space-y-4">
          <Card className="bg-card">
            <CardHeader className="pb-2 flex items-center justify-between">
              <CardTitle className="text-sm">Ücret Planı</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-transparent"
                onClick={() => setFeePlanOpen(true)}
              >
                <Edit className="mr-1 h-3 w-3" /> Düzenle
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const groupsTotal = groups.reduce(
                  (sum, g) => sum + Number(g.monthlyFee || 0),
                  0
                );
                const latest = monthlyDues[0];
                const applied =
                  currentOverride?.override_amount != null
                    ? Number(currentOverride.override_amount)
                    : currentOverride?.discount_percent != null
                    ? Math.round(
                        groupsTotal *
                          (1 - Number(currentOverride.discount_percent) / 100)
                      )
                    : Number(
                        (latest?.computedAmount ?? latest?.amount) ||
                          groupsTotal ||
                          0
                      );
                return (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Mevcut Aylık Ücret
                    </span>
                    <span className="font-medium">
                      {formatCurrency(applied)}
                    </span>
                  </div>
                );
              })()}
              {monthlyDues[0]?.calculationNotes && (
                <p className="text-[10px] text-muted-foreground">
                  {monthlyDues[0]?.calculationNotes}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ödeme Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Toplam Borç</span>
                <span className="font-medium">{formatCurrency(totalDue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ödenen</span>
                <span className="font-medium text-green-500">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kalan</span>
                <span className="font-medium text-amber-500">
                  {formatCurrency(totalDue - totalPaid)}
                </span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                %{Math.round(paymentProgress)} ödendi
              </p>
            </CardContent>
          </Card>

          {/* Monthly Dues List */}
          <div className="space-y-2">
            {monthlyDues.map((due) => (
              <Card key={due.id} className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{formatDate(due.dueMonth)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(due.paidAmount || 0))} /{" "}
                        {formatCurrency(
                          Number((due.computedAmount ?? due.amount) || 0)
                        )}
                      </p>
                      {due.originalAmount &&
                        due.computedAmount &&
                        due.originalAmount !== due.computedAmount && (
                          <p className="text-[10px] text-muted-foreground">
                            {formatCurrency(due.originalAmount)} →{" "}
                            {formatCurrency(due.computedAmount)}
                          </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getDueStatusBadge(due.status)}

                      {due.status !== "paid" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-transparent"
                            disabled={!due.id}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const promise = sendDueReminderAction(due.id);
                              toast.promise(promise, {
                                loading: "Hatırlatma gönderiliyor...",
                                success: "Hatırlatma başarıyla gönderildi",
                                error: (err) => err.message || "Hatırlatma gönderilemedi",
                              });
                            }}
                          >
                            <BellRing className="mr-1 h-3 w-3" />
                            Hatırlat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-transparent"
                            onClick={() => handlePayment(due)}
                          >
                            Öde
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {monthlyDues.length === 0 && (
              <div className="text-center p-4 text-muted-foreground">
                Henüz ödeme kaydı yok
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="mt-4 space-y-2">
          <div className="flex justify-end mb-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm">Grup Ekle</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Gruba Ekle</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Grup Seçin</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Grup seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGroups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} ({formatCurrency(g.monthlyFee || 0)})
                          </SelectItem>
                        ))}
                        {availableGroups.length === 0 && (
                          <SelectItem value="none" disabled>
                            Uygun grup bulunamadı (Yaş/Lisans kriteri)
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleGroupJoin}>
                    Kaydet
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {groups.map((group) => (
            <Card key={group.id} className="bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20">
                    <Users className="h-5 w-5 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.sportType} • {group.ageGroup}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatCurrency(group.monthlyFee || 0)}/ay
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {groups.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              Henüz kayıtlı grup yok
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Yoklama geçmişi yüklenecek
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Sheet */}
      <PaymentSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        student={student}
        due={selectedDue}
      />

      <Sheet open={feePlanOpen} onOpenChange={setFeePlanOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Ücret Planı</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select
                value={overrideType}
                onValueChange={(v) => setOverrideType(v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">Sabit Ücret</SelectItem>
                  <SelectItem value="discount">İndirim Yüzdesi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{overrideType === "amount" ? "Tutar" : "Yüzde"}</Label>
              <Input
                type="number"
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  try {
                    const payload: any = {
                      tenant_id: student.tenantId,
                      branch_id: student.branchId,
                      student_id: student.id,
                      override_amount:
                        overrideType === "amount"
                          ? Number(overrideValue || 0)
                          : null,
                      discount_percent:
                        overrideType === "discount"
                          ? Math.max(
                              0,
                              Math.min(100, Number(overrideValue || 0))
                            )
                          : null,
                      effective_from: new Date().toISOString().split("T")[0],
                    };
                    const { error } = await supabase
                      .from("student_fee_overrides")
                      .upsert(payload, {
                        onConflict: "tenant_id,student_id,branch_id",
                      });
                    if (error) throw error;
                    toast.success("Ücret planı kaydedildi");
                    setFeePlanOpen(false);
                    try {
                      const month =
                        new Date().toISOString().slice(0, 7) + "-01";
                      await fetch(
                        `/api/branches/${student.branchId}/recompute-dues`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ month }),
                        }
                      );
                    } catch {}
                    router.refresh();
                  } catch (e) {
                    console.error(e);
                    toast.error("Kaydetme sırasında hata oluştu");
                  }
                }}
              >
                Kaydet
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await supabase
                      .from("student_fee_overrides")
                      .delete()
                      .eq("tenant_id", student.tenantId)
                      .eq("student_id", student.id)
                      .eq("branch_id", student.branchId);
                    toast.success("Ücret planı kaldırıldı");
                    setOverrideValue("");
                    setCurrentOverride(null);
                    setFeePlanOpen(false);
                    try {
                      const month =
                        new Date().toISOString().slice(0, 7) + "-01";
                      await fetch(
                        `/api/branches/${student.branchId}/recompute-dues`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ month }),
                        }
                      );
                    } catch {}
                    router.refresh();
                  } catch (e) {
                    console.error(e);
                    toast.error("Silme sırasında hata oluştu");
                  }
                }}
              >
                Kaldır
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Öğrenci Bilgilerini Düzenle</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Öğrenci No</Label>
              <Input
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Doğum Tarihi</Label>
                <Input
                  type="date"
                  value={birthDate || ""}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as Student["status"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="passive">Pasif</SelectItem>
                    <SelectItem value="suspended">Askıda</SelectItem>
                    <SelectItem value="graduated">Mezun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cinsiyet</Label>
                <Select value={gender} onValueChange={(v) => setGender(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lisanslı</Label>
                <Select
                  value={isLicensed ? "true" : "false"}
                  onValueChange={(v) => setIsLicensed(v === "true")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Evet</SelectItem>
                    <SelectItem value="false">Hayır</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lisans No</Label>
                <Input
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Federasyon</Label>
                <Input
                  value={licenseFederation}
                  onChange={(e) => setLicenseFederation(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Lisans Başlangıç</Label>
                <Input
                  type="date"
                  value={licenseIssuedAt || ""}
                  onChange={(e) => setLicenseIssuedAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Lisans Bitiş</Label>
                <Input
                  type="date"
                  value={licenseExpiresAt || ""}
                  onChange={(e) => setLicenseExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Veli Ad Soyad</Label>
                <Input
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Veli Telefon</Label>
                <Input
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Veli E-posta</Label>
              <Input
                type="email"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fotoğraf</Label>
                <ImageUploader
                  value={photoUrl}
                  tenantId={student.tenantId}
                  folder="students"
                  onChange={(url) => setPhotoUrl(url)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kayıt Tarihi</Label>
                <Input
                  disabled
                  value={
                    student.registrationDate
                      ? new Date(student.registrationDate)
                          .toISOString()
                          .slice(0, 10)
                      : ""
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gruba Ekle (İsteğe Bağlı)</Label>
              <Select
                value={selectedGroupForEdit}
                onValueChange={setSelectedGroupForEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grup seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({formatCurrency(g.monthlyFee || 0)})
                    </SelectItem>
                  ))}
                  {availableGroups.length === 0 && (
                    <SelectItem value="none" disabled>
                      Uygun grup bulunamadı (Yaş/Lisans kriteri)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={async () => {
                if (!fullName) {
                  toast.error("Ad Soyad zorunlu");
                  return;
                }
                const { error } = await supabase
                  .from("students")
                  .update({
                    student_no: studentNo || null,
                    full_name: fullName,
                    phone,
                    email,
                    birth_date: birthDate || null,
                    gender: gender || null,
                    is_licensed: isLicensed,
                    license_no: licenseNo || null,
                    license_issued_at: licenseIssuedAt || null,
                    license_expires_at: licenseExpiresAt || null,
                    license_federation: licenseFederation || null,
                    address,
                    guardian_name: guardianName || null,
                    guardian_phone: guardianPhone || null,
                    guardian_email: guardianEmail || null,
                    photo_url: photoUrl || null,
                    status,
                    notes: notes || null,
                  })
                  .eq("id", student.id);
                if (error) {
                  toast.error("Öğrenci güncellenemedi");
                } else {
                  // Add to group if selected
                  if (selectedGroupForEdit) {
                    // Use upsert to handle re-adding students
                    const { error: groupError } = await supabase
                      .from("student_groups")
                      .upsert(
                        {
                          student_id: student.id,
                          group_id: selectedGroupForEdit,
                          status: "active",
                          joined_at: new Date().toISOString().split("T")[0],
                          left_at: null,
                        },
                        { onConflict: "student_id,group_id" }
                      );
                    if (groupError) {
                      console.error("Error adding to group:", groupError);
                      toast.error("Öğrenci güncellendi ancak gruba eklenemedi");
                    } else {
                      toast.success("Öğrenci güncellendi ve gruba eklendi");
                    }
                  } else {
                    toast.success("Öğrenci güncellendi");
                  }
                  setEditOpen(false);
                  router.refresh();
                }
              }}
            >
              Kaydet
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
