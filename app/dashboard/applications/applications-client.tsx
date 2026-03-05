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
    Array<{ id: string; name: string; monthlyFee?: number | null }>
  >([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [tenantName, setTenantName] = useState<string>("");
  const [branchName, setBranchName] = useState<string>("");
  const [tenantSlug, setTenantSlug] = useState<string>("");
  const [selectedGroupFee, setSelectedGroupFee] = useState<number | null>(null);
  const [overrideAmount, setOverrideAmount] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    fullName: string;
    tenantId?: string;
    branchId?: string;
    sportId?: string;
    birthDate?: string;
    gender?: string;
    phone?: string;
    email?: string;
    guardianName?: string;
    guardianPhone?: string;
    address?: string;
  }>({
    fullName: "",
    tenantId: "",
    branchId: "",
    sportId: "",
    birthDate: "",
    gender: "",
    phone: "",
    email: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
  });
  const [userRole, setUserRole] = useState<string>("");
  const [editTenants, setEditTenants] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [editBranches, setEditBranches] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [editSports, setEditSports] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [branchSportsLoading, setBranchSportsLoading] =
    useState<boolean>(false);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadTenantBranch = async () => {
      const appLite = selectedApp;
      if (!appLite) return;
      try {
        const { data: t0 } = await supabase
          .from("tenants")
          .select("name,slug")
          .eq("id", appLite.tenantId)
          .maybeSingle();
        setTenantName(String(t0?.name || ""));
        setTenantSlug(String(t0?.slug || ""));
      } catch {
        setTenantName("");
        setTenantSlug("");
      }
      // Public fallback: fetch branches/sports by slug regardless of auth
      if (tenantSlug) {
        try {
          const resB = await fetch(
            `/api/public/tenants/${tenantSlug}/branches`,
          );
          const jsonB = await resB.json();
          const bOpts = (jsonB?.branches || []).map((b: any) => ({
            id: String(b.id),
            name: String(b.name),
          }));
          if (bOpts.length) {
            setEditBranches(bOpts);
          }
        } catch {}
        try {
          const resS = await fetch(`/api/public/tenants/${tenantSlug}/sports`);
          const jsonS = await resS.json();
          const sOpts = (jsonS?.sports || []).map((s: any) => ({
            id: String(s.id),
            name: String(s.name),
          }));
          if (sOpts.length) {
            setEditSports(sOpts);
          }
        } catch {}
      }
      setEditForm({
        fullName: appLite.fullName,
        tenantId: appLite.tenantId,
        branchId: appLite.branchId || "",
        sportId: appLite.sportId || "",
        birthDate: appLite.birthDate || "",
        gender: appLite.gender || "",
        phone: appLite.phone || "",
        email: appLite.email || "",
        guardianName: appLite.guardianName || "",
        guardianPhone: appLite.guardianPhone || "",
        address: appLite.address || "",
      });
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.data?.user?.id || "";
      if (uid) {
        const { data: u } = await supabase
          .from("users")
          .select("role,tenant_id")
          .eq("id", uid)
          .maybeSingle();
        setUserRole(String(u?.role || ""));
        const currentTenantId = String(appLite.tenantId);
        if (u?.role === "super_admin") {
          const { data: ts } = await supabase
            .from("tenants")
            .select("id,name")
            .order("name");
          setEditTenants(
            (ts || []).map((t: any) => ({
              id: String(t.id),
              name: String(t.name),
            })),
          );
        } else {
          const { data: t } = await supabase
            .from("tenants")
            .select("id,name")
            .eq("id", currentTenantId)
            .maybeSingle();
          setEditTenants(t ? [{ id: String(t.id), name: String(t.name) }] : []);
        }
        try {
          const r = await fetch(
            `/api/admin/tenants/${currentTenantId}/options`,
          );
          const j = await r.json();
          const b0 = (j?.branches || []).map((b: any) => ({
            id: String(b.id),
            name: String(b.name),
          }));
          const s0 = (j?.sports || []).map((s: any) => ({
            id: String(s.id),
            name: String(s.name),
          }));
          if (b0.length) setEditBranches(b0);
          if (s0.length) setEditSports(s0);
        } catch {}
        const { data: bs } = await supabase
          .from("branches")
          .select("id,name")
          .eq("tenant_id", currentTenantId)
          .order("name");
        let branchOpts = (bs || []).map((b: any) => ({
          id: String(b.id),
          name: String(b.name),
        }));
        if (!branchOpts.length && tenantSlug) {
          try {
            const res = await fetch(
              `/api/public/tenants/${tenantSlug}/branches`,
            );
            const json = await res.json();
            branchOpts = (json?.branches || []).map((b: any) => ({
              id: String(b.id),
              name: String(b.name || b.title || "Şube"),
            }));
          } catch {}
        }
        if (branchOpts.length) {
          setEditBranches(branchOpts);
        } else if ((appLite.branchId || "").length > 0) {
          setEditBranches([
            { id: String(appLite.branchId), name: branchName || "Şube" },
          ]);
        }
        const { data: ss } = await supabase
          .from("sports")
          .select("id,name")
          .eq("tenant_id", currentTenantId)
          .order("name");
        let sportOpts = (ss || []).map((s: any) => ({
          id: String(s.id),
          name: String(s.name),
        }));
        if (!sportOpts.length && tenantSlug) {
          try {
            const res2 = await fetch(
              `/api/public/tenants/${tenantSlug}/sports`,
            );
            const json2 = await res2.json();
            sportOpts = (json2?.sports || []).map((s: any) => ({
              id: String(s.id),
              name: String(s.name),
            }));
          } catch {}
        }
        if (sportOpts.length) {
          setEditSports(sportOpts);
        }
      }
      try {
        const r2 = await fetch(
          `/api/admin/tenants/${appLite.tenantId}/options`,
        );
        const j2 = await r2.json();
        const b1 = (j2?.branches || []).map((b: any) => ({
          id: String(b.id),
          name: String(b.name),
        }));
        const s1 = (j2?.sports || []).map((s: any) => ({
          id: String(s.id),
          name: String(s.name),
        }));
        if (b1.length) setEditBranches(b1);
        if (s1.length) setEditSports(s1);
      } catch {}
      try {
        const { data: t } = await supabase
          .from("tenants")
          .select("name,slug")
          .eq("id", appLite.tenantId)
          .maybeSingle();
        setTenantName(String(t?.name || ""));
        setTenantSlug(String(t?.slug || ""));
      } catch {
        setTenantName("");
        setTenantSlug("");
      }
      try {
        if (appLite.branchId) {
          const { data: b } = await supabase
            .from("branches")
            .select("name")
            .eq("id", appLite.branchId)
            .maybeSingle();
          setBranchName(String(b?.name || ""));
        } else {
          setBranchName("");
        }
      } catch {
        setBranchName("");
      }
    };
    loadTenantBranch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp]);

  useEffect(() => {
    const loadAudit = async () => {
      if (!selectedApp) return;
      setLoadingAudit(true);
      try {
        const { data } = await supabase
          .from("audit_logs")
          .select("id,action,created_at,new_values,user_id")
          .eq("entity_type", "applications")
          .eq("entity_id", selectedApp.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setAuditEvents(data || []);
      } finally {
        setLoadingAudit(false);
      }
    };
    loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id]);

  useEffect(() => {
    const loadBranchSports = async () => {
      if (!editMode) return;
      const appLite = selectedApp;
      const bid = editForm.branchId || appLite?.branchId || "";
      if (!bid) return;
      setBranchSportsLoading(true);
      try {
        const { data: gs } = await supabase
          .from("groups")
          .select("sport_id")
          .eq("branch_id", bid);
        const rawIds = (gs || [])
          .map((g: any) => g.sport_id)
          .filter((id: any) => typeof id === "string" && id.length > 0);
        const sportIds = Array.from(new Set(rawIds));
        let opts: Array<{ id: string; name: string }> = [];
        if (sportIds.length > 0) {
          const { data: ss2 } = await supabase
            .from("sports")
            .select("id,name")
            .in("id", sportIds);
          opts = (ss2 || []).map((s: any) => ({
            id: String(s.id),
            name: String(s.name),
          }));
        } else {
          const { data: ss3 } = await supabase
            .from("sports")
            .select("id,name")
            .eq("tenant_id", String(appLite?.tenantId || ""));
          opts = (ss3 || []).map((s: any) => ({
            id: String(s.id),
            name: String(s.name),
          }));
        }
        if (opts.length) setEditSports(opts);
      } finally {
        setBranchSportsLoading(false);
      }
    };
    loadBranchSports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, editForm.branchId]);

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
        // Primary query: by tenant + branch + sport
        async function q(
          branchId?: string | null,
          sportId?: string | null,
        ): Promise<any[]> {
          let query = supabase
            .from("groups")
            .select("id,name,status,monthly_fee")
            .eq("tenant_id", String(appLite?.tenantId || ""))
            .order("name");
          if (branchId) query = query.eq("branch_id", branchId);
          if (sportId) query = query.eq("sport_id", sportId);
          const { data } = await query;
          return (data || []).filter((g: any) => g.status === "active");
        }
        let data =
          (await q(appLite.branchId || null, appLite.sportId || null)) || [];
        // Fallback 1: drop sport filter
        if (!data.length) {
          data = (await q(appLite.branchId || null, null)) || [];
        }
        // Fallback 2: drop branch filter
        if (!data.length) {
          data = (await q(null, appLite.sportId || null)) || [];
        }
        // Fallback 3: tenant-wide active groups
        if (!data.length) {
          data = (await q(null, null)) || [];
        }
        const opts = data.map((g: any) => ({
          id: String(g.id),
          name: String(g.name),
          monthlyFee: g.monthly_fee != null ? Number(g.monthly_fee) : null,
        }));
        setApproveGroups(opts);
        const preferred = appLite.preferredGroupId
          ? String(appLite.preferredGroupId)
          : "";
        if (
          preferred &&
          opts.some((o: { id: string; name: string }) => o.id === preferred)
        ) {
          setApproveGroupId(preferred);
          const sel = opts.find((o) => o.id === preferred);
          setSelectedGroupFee(sel?.monthlyFee ?? null);
        } else {
          setApproveGroupId("");
          setSelectedGroupFee(null);
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

        const oAmt = Number(overrideAmount || "");
        const dPct = Number(discountPercent || "");
        if (!isNaN(oAmt) || !isNaN(dPct)) {
          const payload: any = {
            tenant_id: app.tenant_id,
            branch_id: branchId,
            student_id: studentId,
            effective_from: new Date().toISOString().split("T")[0],
            created_by: processedBy,
          };
          if (!isNaN(oAmt) && overrideAmount) {
            payload.override_amount = oAmt;
          } else if (!isNaN(dPct) && discountPercent) {
            payload.discount_percent = dPct;
          }
          if (payload.override_amount || payload.discount_percent) {
            await supabase.from("student_fee_overrides").upsert(payload, {
              onConflict: "tenant_id,student_id,branch_id",
            });
          }
        }

        const { error: updErr } = await supabase
          .from("applications")
          .update({
            status: "approved",
            processed_at: new Date().toISOString(),
            processed_by: processedBy,
          })
          .eq("id", confirmDialog.id);
        if (updErr) throw updErr;

        try {
          const r = await fetch("/api/admin/applications/create-student-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              applicationId: confirmDialog.id,
              studentId,
            }),
          });
          const j = await r.json().catch(() => ({}));
          await supabase.from("audit_logs").insert({
            user_id: processedBy,
            tenant_id: app.tenant_id,
            action: "application_approved",
            entity_type: "applications",
            entity_id: confirmDialog.id,
            new_values: {
              student_id: studentId,
              group_id: approveGroupId,
              override_amount: overrideAmount || null,
              discount_percent: discountPercent || null,
              auth_user_id: j?.userId || null,
              account_created_ok: r.ok,
            },
            created_at: new Date().toISOString(),
          } as any);
          if (!r.ok) {
            toast.error(j?.error || "Öğrenci hesabı oluşturulamadı");
          }
        } catch {}
      } else {
        const { error } = await supabase
          .from("applications")
          .update({
            status: "rejected",
            processed_at: new Date().toISOString(),
          })
          .eq("id", confirmDialog.id);
        if (error) throw error;
        try {
          const { data: u } = await supabase.auth.getUser();
          const processedBy = u?.user?.id || null;
          await supabase.from("audit_logs").insert({
            user_id: processedBy,
            tenant_id: (selectedApp?.tenantId as any) || null,
            action: "application_rejected",
            entity_type: "applications",
            entity_id: confirmDialog.id,
            created_at: new Date().toISOString(),
          } as any);
        } catch {}
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === confirmDialog.id ? { ...app, status: newStatus } : app,
        ),
      );

      if (selectedApp?.id === confirmDialog.id) {
        setSelectedApp((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }

      toast.success(
        `Başvuru başarıyla ${
          newStatus === "approved" ? "onaylandı" : "reddedildi"
        }`,
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
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-xl overflow-y-auto"
        >
          {selectedApp && (
            <>
              <SheetHeader>
                <SheetTitle>Başvuru Detayı</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-transparent"
                    onClick={() => setEditMode((v) => !v)}
                  >
                    {editMode ? "Düzenlemeyi Kapat" : "Düzenle"}
                  </Button>
                </div>
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
                          "tr-TR",
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Okul</p>
                      <p className="font-medium">{tenantName || "-"}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">Şube</p>
                      <p className="font-medium">{branchName || "-"}</p>
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
                    {!editMode ? (
                      <>
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
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Şube
                            </label>
                            <Select
                              value={editForm.branchId || ""}
                              onValueChange={(v) =>
                                setEditForm({
                                  ...editForm,
                                  branchId: v,
                                  sportId: "",
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {editBranches.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Branş
                            </label>
                            <Select
                              value={editForm.sportId || ""}
                              onValueChange={(v) =>
                                setEditForm({ ...editForm, sportId: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    branchSportsLoading
                                      ? "Yükleniyor..."
                                      : "Seçin"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {editSports.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Ad Soyad
                            </label>
                            <Input
                              value={editForm.fullName}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  fullName: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Doğum Tarihi
                            </label>
                            <Input
                              type="date"
                              value={editForm.birthDate || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  birthDate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Cinsiyet
                            </label>
                            <Select
                              value={editForm.gender || ""}
                              onValueChange={(v) =>
                                setEditForm({ ...editForm, gender: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Erkek</SelectItem>
                                <SelectItem value="female">Kız</SelectItem>
                                <SelectItem value="other">Diğer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">
                              E-posta
                            </label>
                            <Input
                              type="email"
                              value={editForm.email || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  email: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Telefon
                            </label>
                            <Input
                              value={editForm.phone || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Adres
                            </label>
                            <Input
                              value={editForm.address || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  address: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Parent Info */}
                <Card className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Veli Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {!editMode ? (
                      <>
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
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Veli Adı Soyadı
                          </label>
                          <Input
                            value={editForm.guardianName || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                guardianName: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Veli Telefon
                          </label>
                          <Input
                            value={editForm.guardianPhone || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                guardianPhone: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
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

                <Card className="bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Onay Geçmişi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {loadingAudit ? (
                      <p className="text-sm text-muted-foreground">
                        Yükleniyor...
                      </p>
                    ) : auditEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Kayıt yok</p>
                    ) : (
                      auditEvents.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm truncate">
                              {String(e.action || "-")}
                            </p>
                            {e?.new_values?.error && (
                              <p className="text-xs text-destructive truncate">
                                {String(e.new_values.error)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {e.created_at
                              ? new Date(e.created_at).toLocaleString("tr-TR")
                              : "-"}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {editMode && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={editLoading}
                      onClick={async () => {
                        if (!selectedApp) return;
                        setEditLoading(true);
                        try {
                          const payload: any = {
                            full_name: editForm.fullName,
                            tenant_id:
                              editForm.tenantId || selectedApp.tenantId,
                            branch_id:
                              editForm.branchId || selectedApp.branchId || null,
                            sport_id:
                              editForm.sportId || selectedApp.sportId || null,
                            sport_name: null,
                            birth_date: editForm.birthDate || null,
                            gender: editForm.gender || null,
                            phone: editForm.phone || null,
                            email: editForm.email || null,
                            guardian_name: editForm.guardianName || null,
                            guardian_phone: editForm.guardianPhone || null,
                            address: editForm.address || null,
                            updated_at: new Date().toISOString(),
                          };
                          let upd = await supabase
                            .from("applications")
                            .update(payload)
                            .eq("id", selectedApp.id);
                          if (
                            upd.error &&
                            String(upd.error.message || "")
                              .toLowerCase()
                              .includes("updated_at")
                          ) {
                            const p2 = { ...payload };
                            delete (p2 as any).updated_at;
                            upd = await supabase
                              .from("applications")
                              .update(p2)
                              .eq("id", selectedApp.id);
                          }
                          if (upd.error) {
                            toast.error("Güncelleme başarısız");
                          } else {
                            toast.success("Başvuru bilgileri güncellendi");
                            setApplications((prev) =>
                              prev.map((a) =>
                                a.id === selectedApp.id
                                  ? {
                                      ...a,
                                      tenantId: (editForm.tenantId ||
                                        a.tenantId) as string,
                                      branchId: (editForm.branchId ||
                                        a.branchId) as string,
                                      sportId: (editForm.sportId ||
                                        a.sportId) as string,
                                      fullName: editForm.fullName,
                                      birthDate:
                                        editForm.birthDate || undefined,
                                      gender:
                                        (editForm.gender as
                                          | "male"
                                          | "female"
                                          | "other"
                                          | undefined) || undefined,
                                      phone: editForm.phone || undefined,
                                      email: editForm.email || undefined,
                                      guardianName:
                                        editForm.guardianName || undefined,
                                      guardianPhone:
                                        editForm.guardianPhone || undefined,
                                      address: editForm.address || undefined,
                                    }
                                  : a,
                              ),
                            );
                            setSelectedApp((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    tenantId: (editForm.tenantId ||
                                      prev.tenantId) as string,
                                    branchId: (editForm.branchId ||
                                      prev.branchId) as string,
                                    sportId: (editForm.sportId ||
                                      prev.sportId) as string,
                                    fullName: editForm.fullName,
                                    birthDate: editForm.birthDate || undefined,
                                    gender:
                                      (editForm.gender as
                                        | "male"
                                        | "female"
                                        | "other"
                                        | undefined) || undefined,
                                    phone: editForm.phone || undefined,
                                    email: editForm.email || undefined,
                                    guardianName:
                                      editForm.guardianName || undefined,
                                    guardianPhone:
                                      editForm.guardianPhone || undefined,
                                    address: editForm.address || undefined,
                                  }
                                : null,
                            );
                            setEditMode(false);
                          }
                        } finally {
                          setEditLoading(false);
                        }
                      }}
                    >
                      Kaydet
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-700 bg-transparent"
                      onClick={() => {
                        setEditMode(false);
                        setEditForm({
                          fullName: selectedApp.fullName,
                          birthDate: selectedApp.birthDate || "",
                          gender: selectedApp.gender || "",
                          phone: selectedApp.phone || "",
                          email: selectedApp.email || "",
                          guardianName: selectedApp.guardianName || "",
                          guardianPhone: selectedApp.guardianPhone || "",
                          address: selectedApp.address || "",
                        });
                      }}
                    >
                      İptal
                    </Button>
                  </div>
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
                onValueChange={(v) => {
                  setApproveGroupId(v);
                  const sel = approveGroups.find((g) => g.id === v);
                  setSelectedGroupFee(sel?.monthlyFee ?? null);
                }}
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
                      {g.monthlyFee != null
                        ? ` — ₺${Number(g.monthlyFee).toLocaleString("tr-TR")}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Grup Ücreti
                  </p>
                  <p className="font-medium">
                    {selectedGroupFee != null
                      ? `₺${Number(selectedGroupFee).toLocaleString("tr-TR")}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Öğrenci Aylık Ücreti (override)
                  </label>
                  <Input
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(e.target.value)}
                    placeholder={
                      selectedGroupFee != null
                        ? String(selectedGroupFee)
                        : "örn. 1500"
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  İndirim (%) — boş bırakılabilir
                </label>
                <Input
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="örn. 10"
                />
              </div>
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
