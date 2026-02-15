"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  User,
  Calendar,
  Filter,
  Search,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/sheet";
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
import { Application } from "@/lib/types";
import { ApplicationStats } from "@/lib/api/applications";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ApplicationsClientProps {
  applications: Application[];
  stats: ApplicationStats;
}

export default function ApplicationsClient({
  applications: initialApplications,
  stats,
}: ApplicationsClientProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "approve" | "reject";
    id: string | null;
  }>({
    open: false,
    type: "approve",
    id: null,
  });
  const [approveGroupId, setApproveGroupId] = useState<string>("");
  const [approveGroups, setApproveGroups] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadGroupsForApproval = async () => {
      if (
        !confirmDialog.open ||
        confirmDialog.type !== "approve" ||
        !confirmDialog.id
      )
        return;
      const appLite = applications.find((a) => a.id === confirmDialog.id);
      if (!appLite) return;
      setLoadingGroups(true);
      try {
        let query = supabase
          .from("groups")
          .select("id,name,status")
          .eq("tenant_id", appLite.tenantId)
          .order("name");
        if (appLite.branchId) {
          query = query.eq("branch_id", appLite.branchId);
        }
        if (appLite.sportId) {
          query = query.eq("sport_id", appLite.sportId);
        }
        const { data } = await query;
        const opts = (data || [])
          .filter((g: any) => g.status === "active")
          .map((g: any) => ({ id: String(g.id), name: String(g.name) }));
        setApproveGroups(opts);
        const preferred = appLite.preferredGroupId
          ? String(appLite.preferredGroupId)
          : "";
        if (
          preferred &&
          opts.some((o: { id: string; name: string }) => o.id === preferred)
        ) {
          setApproveGroupId(preferred);
        } else {
          setApproveGroupId("");
        }
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroupsForApproval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmDialog]);

  const handleUpdateStatus = async () => {
    if (!confirmDialog.id) return;

    const newStatus =
      confirmDialog.type === "approve" ? "approved" : "rejected";

    try {
      if (confirmDialog.type === "approve") {
        if (!approveGroupId) {
          toast.error("Onay için grup seçmelisiniz");
          return;
        }
        const { data: app, error: appErr } = await supabase
          .from("applications")
          .select("*")
          .eq("id", confirmDialog.id)
          .single();
        if (appErr || !app) throw appErr || new Error("Başvuru bulunamadı");

        let branchId = app.branch_id || null;
        if (!branchId) {
          const { data: branches } = await supabase
            .from("branches")
            .select("id,is_main")
            .eq("tenant_id", app.tenant_id)
            .order("is_main", { ascending: false })
            .limit(1);
          branchId = branches && branches[0]?.id;
        }
        if (!branchId) throw new Error("Geçerli bir şube bulunamadı");

        const { data: userRes } = await supabase.auth.getUser();
        const processedBy = userRes?.data?.user?.id || null;

        const msg = String(app.message || "");
        const licensed =
          /\[LICENSED:(true|1)\]/i.test(msg) || /lisanslı/i.test(msg);

        const { data: studentInsert, error: stuErr } = await supabase
          .from("students")
          .insert({
            tenant_id: app.tenant_id,
            branch_id: branchId,
            full_name: app.full_name,
            birth_date: app.birth_date || null,
            gender: app.gender || null,
            phone: app.phone || null,
            email: app.email || null,
            address: app.address || null,
            is_licensed: licensed,
            status: "active",
          })
          .select("id")
          .single();
        if (stuErr) throw stuErr;

        const studentId = studentInsert.id;

        if (app.guardian_name || app.guardian_phone) {
          await supabase.from("student_guardians").insert({
            student_id: studentId,
            full_name: app.guardian_name || "Veli",
            relationship: "guardian",
            phone: app.guardian_phone || null,
            is_primary: true,
          });
        }

        await supabase.from("student_groups").insert({
          student_id: studentId,
          group_id: approveGroupId,
          status: "active",
        });

        const { error: updErr } = await supabase
          .from("applications")
          .update({
            status: "approved",
            processed_at: new Date().toISOString(),
            processed_by: processedBy,
          })
          .eq("id", confirmDialog.id);
        if (updErr) throw updErr;
      } else {
        const { error } = await supabase
          .from("applications")
          .update({
            status: "rejected",
            processed_at: new Date().toISOString(),
          })
          .eq("id", confirmDialog.id);
        if (error) throw error;
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === confirmDialog.id ? { ...app, status: newStatus } : app
        )
      );

      if (selectedApp?.id === confirmDialog.id) {
        setSelectedApp((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }

      toast.success(
        `Başvuru başarıyla ${
          newStatus === "approved" ? "onaylandı" : "reddedildi"
        }`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("İşlem sırasında bir hata oluştu");
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesFilter = filter === "all" || app.status === filter;
    const matchesSearch =
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (app.preferredGroup?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-0">
            Bekliyor
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
            Onaylandı
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-400 border-0">
            Reddedildi
          </Badge>
        );
      default:
        return null;
    }
  };

  const statCards = [
    {
      label: "Toplam Başvuru",
      value: stats.total,
      icon: FileText,
      color: "text-blue-400",
    },
    {
      label: "Bekleyen",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-400",
    },
    {
      label: "Onaylanan",
      value: stats.approved,
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      label: "Reddedilen",
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-400",
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Başvurular</h1>
        <p className="text-sm text-muted-foreground">
          Yeni üyelik başvurularını yönetin
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-2 text-center">
              <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Başvuru ara..."
            className="pl-9 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[130px] bg-card/50">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="pending">Bekleyen</SelectItem>
            <SelectItem value="approved">Onaylanan</SelectItem>
            <SelectItem value="rejected">Reddedilen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <div className="space-y-2">
        {filteredApps.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Başvuru bulunamadı.
          </p>
        ) : (
          filteredApps.map((app) => (
            <Card
              key={app.id}
              className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors cursor-pointer"
              onClick={() => setSelectedApp(app)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={`/stylized-child.png?height=40&width=40&query=child ${app.fullName}`}
                    />
                    <AvatarFallback
                      name={app.fullName}
                      className="bg-primary/10 text-primary text-sm"
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{app.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.preferredGroup?.name || "Grup Tercihi Yok"}
                        </p>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(app.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                      {app.birthDate && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {new Date().getFullYear() -
                            new Date(app.birthDate).getFullYear()}{" "}
                          yaş
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {app.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDialog({
                          open: true,
                          type: "approve",
                          id: app.id,
                        });
                      }}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDialog({
                          open: true,
                          type: "reject",
                          id: app.id,
                        });
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reddet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Application Detail Sheet */}
      <Sheet open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
          {selectedApp && (
            <>
              <SheetHeader>
                <SheetTitle>Başvuru Detayı</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {/* Applicant Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={`/stylized-child.png?height=64&width=64&query=child ${selectedApp.fullName}`}
                    />
                    <AvatarFallback
                      name={selectedApp.fullName}
                      className="bg-primary/10 text-primary text-xl"
                    />
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedApp.fullName}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedApp.preferredGroup?.name || "Grup Tercihi Yok"}
                    </p>
                    {selectedApp.sport?.name && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Branş: {selectedApp.sport.name}
                        </Badge>
                        {selectedApp.sport.isActive === false && (
                          <Badge className="bg-red-500/20 text-red-500 border-0 text-[10px]">
                            Pasif
                          </Badge>
                        )}
                      </div>
                    )}
                    {getStatusBadge(selectedApp.status)}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-card/50">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Yaş</p>
                      <p className="font-medium">
                        {selectedApp.birthDate
                          ? `${
                              new Date().getFullYear() -
                              new Date(selectedApp.birthDate).getFullYear()
                            } yaşında`
                          : "Belirtilmemiş"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Başvuru Tarihi
                      </p>
                      <p className="font-medium">
                        {new Date(selectedApp.createdAt).toLocaleDateString(
                          "tr-TR"
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact */}
                <Card className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      İletişim Bilgileri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedApp.email || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedApp.phone || "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Parent Info */}
                <Card className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Veli Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedApp.guardianName || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedApp.guardianPhone || "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedApp.notes && (
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Notlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedApp.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                {selectedApp.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          type: "approve",
                          id: selectedApp.id,
                        });
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Başvuruyu Onayla
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          type: "reject",
                          id: selectedApp.id,
                        });
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reddet
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "approve"
                ? "Başvuruyu Onayla"
                : "Başvuruyu Reddet"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "approve"
                ? "Bu başvuruyu onaylamak istediğinize emin misiniz? Öğrenci sisteme kaydedilecektir."
                : "Bu başvuruyu reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmDialog.type === "approve" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Grup seçin</p>
              <Select
                value={approveGroupId}
                onValueChange={(v) => setApproveGroupId(v)}
              >
                <SelectTrigger className="bg-card/50">
                  <SelectValue
                    placeholder={
                      loadingGroups ? "Gruplar yükleniyor..." : "Grup seçin"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {approveGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateStatus}
              className={
                confirmDialog.type === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              disabled={confirmDialog.type === "approve" && !approveGroupId}
            >
              {confirmDialog.type === "approve" ? "Onayla" : "Reddet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
