"use client";

import { useEffect, useState } from "react";
import {
  Search,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Plus,
  Send,
  ChevronLeft,
  ChevronRight,
  Receipt,
  TrendingUp,
  Bell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MonthlyDue, Group } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { differenceInCalendarDays } from "date-fns";

interface DuesClientProps {
  initialDues: MonthlyDue[];
  groups: Group[];
  tenantId: string;
  initialMonth?: string;
}

export function DuesClient({
  initialDues,
  groups,
  tenantId,
  initialMonth,
}: DuesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<MonthlyDue | null>(null);
  const [selectedDues, setSelectedDues] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(
    initialMonth ? new Date(initialMonth) : new Date()
  );
  const [bulkMonth, setBulkMonth] = useState<"current" | "next">("current");
  const [bulkGroup, setBulkGroup] = useState<string>("all");
  const [bulkDueDate, setBulkDueDate] = useState<string>("");
  const supabase = createClient();
  const [paymentAmount, setPaymentAmount] = useState("");
  const { currentBranch } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dues = initialDues;

  const normalizeDueDate = (value?: string) => {
    if (!value) return undefined as unknown as Date;
    const dStr = value.split("T")[0];
    return new Date(`${dStr}T00:00:00`);
  };

  const getEffectiveStatus = (d: MonthlyDue) => {
    if (d.status === "paid") return "paid";
    const dd = normalizeDueDate(d.dueDate);
    const daysLeft = differenceInCalendarDays(dd, new Date());
    if (daysLeft < 0) return "overdue";
    if (d.status === "partial") return "partial";
    return "pending";
  };

  const filteredDues = dues.filter((due) => {
    const studentName = due.student?.fullName || "";
    const matchesSearch = studentName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "overdue"
        ? getEffectiveStatus(due) === "overdue"
        : due.status === statusFilter);
    // Note: Filtering by group requires joining student_groups or similar.
    // For now we might skip group filtering on client side if group info is not directly in 'due' or 'student'
    // But typically we'd fetch that. Assuming simple filter for now or skipping group check if not available.
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalDues = dues.reduce(
    (sum, d) => sum + (d.computedAmount ?? d.amount ?? 0),
    0
  );
  const paidAmount = dues.reduce((sum, d) => sum + (d.paidAmount ?? 0), 0);

  const pendingAmount = Math.max(0, totalDues - paidAmount);
  const paidCount = dues.filter((d) => d.status === "paid").length;
  const pendingCount = dues.filter(
    (d) => getEffectiveStatus(d) === "pending"
  ).length;
  const overdueCount = dues.filter(
    (d) => getEffectiveStatus(d) === "overdue"
  ).length;
  const partialCount = dues.filter((d) => d.status === "partial").length;
  const collectionRate =
    totalDues > 0 ? Math.round((paidAmount / totalDues) * 100) : 0;

  const formatDateSafe = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("tr-TR");
  };

  const getProgressValue = (d: MonthlyDue) => {
    const paid = d.paidAmount ?? 0;
    const total = d.computedAmount ?? d.amount ?? 0;
    if (!total || total <= 0) return 0;
    const pct = (paid / total) * 100;
    if (!isFinite(pct) || isNaN(pct)) return 0;
    return Math.min(100, Math.max(0, pct));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Ödendi
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400">
            <Clock className="mr-1 h-3 w-3" />
            Bekliyor
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-blue-500/20 text-blue-400">
            <CreditCard className="mr-1 h-3 w-3" />
            Kısmi
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500/20 text-red-400">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Gecikmiş
          </Badge>
        );
      default:
        return null;
    }
  };

  const openPaymentSheet = (due: MonthlyDue) => {
    setSelectedDue(due);
    setIsPaymentSheetOpen(true);
  };

  const toggleDueSelection = (dueId: string) => {
    setSelectedDues((prev) =>
      prev.includes(dueId)
        ? prev.filter((id) => id !== dueId)
        : [...prev, dueId]
    );
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  };

  useEffect(() => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const firstDay = `${y}-${m}-01`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", firstDay);
    if (currentBranch?.id) {
      params.set("branch", currentBranch.id);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    router.refresh();
  }, [currentMonth, currentBranch?.id]);

  const prevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Aidat Takibi</h1>
          <p className="text-sm text-slate-400">
            Öğrenci aylık aidat ödemelerini yönetin
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 bg-transparent"
          >
            <Download className="mr-2 h-4 w-4" />
            Rapor
          </Button>
          <Link href="/dashboard/notifications">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 bg-transparent"
            >
              <Bell className="mr-2 h-4 w-4" />
              Hatırlat
            </Button>
          </Link>
          <Dialog open={isBulkCreateOpen} onOpenChange={setIsBulkCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Toplu Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent className="border-slate-800 bg-slate-900 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Toplu Aidat Oluştur
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Seçili ay için tüm öğrencilerin aidatlarını oluşturun
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Ay</Label>
                  <Select
                    value={bulkMonth}
                    onValueChange={(v) => setBulkMonth(v as "current" | "next")}
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      <SelectItem value="current" className="text-white">
                        {formatMonth(currentMonth)}
                      </SelectItem>
                      <SelectItem value="next" className="text-white">
                        {formatMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1
                          )
                        )}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Grup</Label>
                  <Select value={bulkGroup} onValueChange={setBulkGroup}>
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      <SelectItem value="all" className="text-white">
                        Tüm Gruplar
                      </SelectItem>
                      {groups.map((group) => (
                        <SelectItem
                          key={group.id}
                          value={group.id}
                          className="text-white"
                        >
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Son Ödeme Tarihi</Label>
                  <Input
                    type="date"
                    className="border-slate-700 bg-slate-800 text-white"
                    value={bulkDueDate}
                    onChange={(e) => setBulkDueDate(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      if (!currentBranch?.id) {
                        toast.error("Şube zorunlu");
                        return;
                      }
                      const branchId = currentBranch.id;
                      const target =
                        bulkMonth === "current"
                          ? new Date(
                              currentMonth.getFullYear(),
                              currentMonth.getMonth(),
                              1
                            )
                          : new Date(
                              currentMonth.getFullYear(),
                              currentMonth.getMonth() + 1,
                              1
                            );
                      const y = target.getFullYear();
                      const m = String(target.getMonth() + 1).padStart(2, "0");
                      const firstDay = `${y}-${m}-01`;

                      if (bulkGroup === "all") {
                        const res = await fetch(
                          `/api/branches/${branchId}/recompute-dues`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ month: firstDay }),
                          }
                        );
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok)
                          throw new Error(json.error || "Oluşturulamadı");
                        if (bulkDueDate) {
                          await supabase
                            .from("monthly_dues")
                            .update({ due_date: bulkDueDate })
                            .eq("branch_id", branchId)
                            .eq("due_month", firstDay);
                        }
                        toast.success("Aidatlar oluşturuldu");
                      } else {
                        const { data: sgs, error: sgErr } = await supabase
                          .from("student_groups")
                          .select("student_id")
                          .eq("group_id", bulkGroup)
                          .eq("status", "active");
                        if (sgErr) throw sgErr;
                        if (!sgs || sgs.length === 0) {
                          toast.error("Bu grupta aktif öğrenci yok");
                          return;
                        }
                        for (const row of sgs as { student_id: string }[]) {
                          await supabase.from("monthly_dues").upsert(
                            {
                              tenant_id: tenantId,
                              branch_id: branchId,
                              student_id: row.student_id,
                              due_month: firstDay,
                              amount: 0,
                              paid_amount: 0,
                              due_date: bulkDueDate || firstDay,
                              status: "pending",
                            },
                            { onConflict: "student_id,due_month" }
                          );
                          await supabase.rpc("compute_monthly_due_v3", {
                            p_tenant_id: tenantId,
                            p_branch_id: branchId,
                            p_student_id: row.student_id,
                            p_due_month: firstDay,
                          });
                        }
                        toast.success("Seçili grup için aidatlar oluşturuldu");
                      }
                      setIsBulkCreateOpen(false);
                      router.refresh();
                    } catch (e) {
                      console.error(e);
                      toast.error("Toplu oluşturma sırasında hata oluştu");
                    }
                  }}
                >
                  Aidatları Oluştur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Month Selector */}
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">
                {formatMonth(currentMonth)}
              </h2>
              <p className="text-sm text-slate-400">Aidat dönemi</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400"
              onClick={nextMonth}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Toplam Beklenen</p>
                <p className="text-xl font-bold text-white">
                  {totalDues.toLocaleString("tr-TR")} TL
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Receipt className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Tahsil Edilen</p>
                <p className="text-xl font-bold text-emerald-400">
                  {paidAmount.toLocaleString("tr-TR")} TL
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Bekleyen</p>
                <p className="text-xl font-bold text-amber-400">
                  {pendingAmount.toLocaleString("tr-TR")} TL
                </p>
              </div>
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Tahsilat Oranı</p>
                <p className="text-xl font-bold text-white">
                  {collectionRate}%
                </p>
              </div>
              <div className="rounded-lg bg-purple-500/20 p-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Tahsilat Durumu</span>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Ödendi ({paidCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Kısmi ({partialCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Bekliyor ({pendingCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Gecikmiş ({overdueCount})
                </span>
              </div>
            </div>
            <span className="text-sm font-medium text-white">
              {collectionRate}%
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-700">
            <div
              className="bg-emerald-500 transition-all"
              style={{
                width: `${
                  dues.length > 0 ? (paidCount / dues.length) * 100 : 0
                }%`,
              }}
            />
            <div
              className="bg-blue-500 transition-all"
              style={{
                width: `${
                  dues.length > 0 ? (partialCount / dues.length) * 100 : 0
                }%`,
              }}
            />
            <div
              className="bg-amber-500 transition-all"
              style={{
                width: `${
                  dues.length > 0 ? (pendingCount / dues.length) * 100 : 0
                }%`,
              }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{
                width: `${
                  dues.length > 0 ? (overdueCount / dues.length) * 100 : 0
                }%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {paidAmount.toLocaleString("tr-TR")} TL /{" "}
            {totalDues.toLocaleString("tr-TR")} TL tahsil edildi
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-slate-700"
          >
            Liste
          </TabsTrigger>
          <TabsTrigger
            value="overdue"
            className="data-[state=active]:bg-slate-700"
          >
            Gecikmiş ({overdueCount})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-slate-700"
          >
            Bekleyen ({pendingCount})
          </TabsTrigger>
          <TabsTrigger
            value="paid"
            className="data-[state=active]:bg-slate-700"
          >
            Ödenen ({paidCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Öğrenci ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white sm:w-36">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="all" className="text-white">
                      Tümü
                    </SelectItem>
                    <SelectItem value="paid" className="text-white">
                      Ödendi
                    </SelectItem>
                    <SelectItem value="pending" className="text-white">
                      Bekliyor
                    </SelectItem>
                    <SelectItem value="partial" className="text-white">
                      Kısmi
                    </SelectItem>
                    <SelectItem value="overdue" className="text-white">
                      Gecikmiş
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white sm:w-36">
                    <SelectValue placeholder="Grup" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="all" className="text-white">
                      Tüm Gruplar
                    </SelectItem>
                    {groups.map((group) => (
                      <SelectItem
                        key={group.id}
                        value={group.id}
                        className="text-white"
                      >
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dues List */}
          <div className="space-y-3">
            {filteredDues.map((due) => (
              <Card
                key={due.id}
                className="border-slate-800 bg-slate-900 transition-colors hover:bg-slate-800/50"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedDues.includes(due.id)}
                      onCheckedChange={() => toggleDueSelection(due.id)}
                      className="border-slate-600 data-[state=checked]:bg-blue-600"
                    />
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={due.student?.photoUrl || "/placeholder.svg"}
                      />
                      <AvatarFallback
                        name={due.student?.fullName}
                        className="bg-slate-700 text-white"
                      />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/dashboard/students/${due.studentId}`}>
                          <h3 className="font-medium text-white truncate hover:text-blue-400">
                            {due.student?.fullName}
                          </h3>
                        </Link>
                        {getStatusBadge(due.status)}
                        {due.freezeApplied && (
                          <Badge className="bg-slate-600/30 text-slate-300">
                            Dondurma
                          </Badge>
                        )}
                        {typeof due.appliedDiscountPercent === "number" &&
                          due.appliedDiscountPercent > 0 && (
                            <Badge className="bg-blue-500/20 text-blue-300">
                              -%{due.appliedDiscountPercent}
                            </Badge>
                          )}
                      </div>
                      <p className="text-sm text-slate-400">
                        Son ödeme: {formatDateSafe(due.dueDate)}
                      </p>
                      {due.status === "partial" && (
                        <div className="mt-1">
                          <Progress
                            value={getProgressValue(due)}
                            className="h-1.5 bg-slate-700"
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            {due.paidAmount.toLocaleString("tr-TR")} /{" "}
                            {due.amount.toLocaleString("tr-TR")} TL
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {(
                          (due.computedAmount ?? due.amount ?? 0) -
                          (due.paidAmount ?? 0)
                        ).toLocaleString("tr-TR")}{" "}
                        TL
                      </p>
                      {due.originalAmount &&
                        due.computedAmount &&
                        due.originalAmount !== due.computedAmount && (
                          <p className="text-xs text-slate-400">
                            {due.originalAmount.toLocaleString("tr-TR")} →{" "}
                            {due.computedAmount.toLocaleString("tr-TR")} TL
                          </p>
                        )}
                      {due.status !== "paid" && (
                        <Button
                          size="sm"
                          className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => openPaymentSheet(due)}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Ödeme Al
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDues.length === 0 && (
              <div className="text-center p-8 text-slate-400">
                Kayıt bulunamadı.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Gecikmiş Ödemeler</p>
                  <p className="text-sm text-red-400/70">
                    Bu öğrencilerin ödeme tarihi geçmiş. Hatırlatma göndermek
                    için bildirimler sayfasını kullanın.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {dues
              .filter((d) => getEffectiveStatus(d) === "overdue")
              .map((due) => {
                const daysOverdue = Math.ceil(
                  (Date.now() - new Date(due.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <Card key={due.id} className="border-slate-800 bg-slate-900">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={due.student?.photoUrl || "/placeholder.svg"}
                          />
                          <AvatarFallback
                            name={due.student?.fullName}
                            className="bg-red-500/20 text-red-400"
                          />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">
                            {due.student?.fullName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Son ödeme: {formatDateSafe(due.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-red-500/20 text-red-400 mb-1">
                            {daysOverdue} gün gecikti
                          </Badge>
                          <p className="font-semibold text-white">
                            {(
                              (due.computedAmount ?? due.amount ?? 0) -
                              (due.paidAmount ?? 0)
                            ).toLocaleString("tr-TR")}{" "}
                            TL
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => openPaymentSheet(due)}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Ödeme Al
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Henüz ödenmemiş aidatlar</p>
            <Link href="/dashboard/notifications">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 bg-transparent"
              >
                <Send className="mr-2 h-4 w-4" />
                Toplu Hatırlatma
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {dues
              .filter((d) => getEffectiveStatus(d) === "pending")
              .map((due) => {
                const dueDateStr =
                  typeof due.dueDate === "string"
                    ? due.dueDate.split("T")[0]
                    : (due.dueDate as any);
                const dueDateObj = new Date(`${dueDateStr}T00:00:00`);
                const daysLeft = differenceInCalendarDays(
                  dueDateObj,
                  new Date()
                );
                return (
                  <Card key={due.id} className="border-slate-800 bg-slate-900">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={due.student?.photoUrl || "/placeholder.svg"}
                          />
                          <AvatarFallback
                            name={due.student?.fullName}
                            className="bg-amber-500/20 text-amber-400"
                          />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">
                            {due.student?.fullName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Son ödeme: {formatDateSafe(due.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              daysLeft < 0
                                ? "bg-red-500/20 text-red-400"
                                : daysLeft <= 3
                                ? "bg-red-500/20 text-red-400"
                                : daysLeft <= 7
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-slate-500/20 text-slate-400"
                            }
                          >
                            {daysLeft > 0
                              ? `${daysLeft} gün kaldı`
                              : daysLeft === 0
                              ? "Bugün son gün"
                              : `${Math.abs(daysLeft)} gün gecikti`}
                          </Badge>
                          <p className="font-semibold text-white mt-1">
                            {(
                              (due.computedAmount ?? due.amount ?? 0) -
                              (due.paidAmount ?? 0)
                            ).toLocaleString("tr-TR")}{" "}
                            TL
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => openPaymentSheet(due)}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Ödeme Al
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <div className="space-y-3">
            {dues
              .filter((d) => d.status === "paid")
              .map((due) => (
                <Card key={due.id} className="border-slate-800 bg-slate-900">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={due.student?.photoUrl || "/placeholder.svg"}
                        />
                        <AvatarFallback
                          name={due.student?.fullName}
                          className="bg-emerald-500/20 text-emerald-400"
                        />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {due.student?.fullName}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Son ödeme: {formatDateSafe(due.dueDate)}
                        </p>
                        {due.paidAt && (
                          <p className="text-xs text-slate-400">
                            Ödeme tarihi: {formatDateSafe(due.paidAt)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-500/20 text-emerald-400 mb-1">
                          Ödendi
                        </Badge>
                        <p className="font-semibold text-white">
                          {(
                            due.computedAmount ??
                            due.amount ??
                            0
                          ).toLocaleString("tr-TR")}{" "}
                          TL
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-slate-700 text-slate-300 bg-transparent"
                        >
                          <Receipt className="mr-1 h-3 w-3" />
                          Makbuz
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {dues.filter((d) => d.status === "paid").length === 0 && (
              <div className="text-center p-8 text-slate-400">
                Kayıt bulunamadı.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Bar for Selected Items */}
      {selectedDues.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 md:bottom-4 md:left-auto md:right-4 md:w-auto">
          <Card className="border-blue-500/50 bg-blue-950/90 backdrop-blur">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <span className="text-sm text-white">
                <span className="font-bold">{selectedDues.length}</span> öğrenci
                seçildi
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 bg-transparent"
                  onClick={() => setSelectedDues([])}
                >
                  İptal
                </Button>
                <Link href="/dashboard/notifications">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Bell className="mr-2 h-4 w-4" />
                    Hatırlatma Gönder
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Sheet */}
      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
        <SheetContent className="w-full border-slate-800 bg-slate-900 sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Ödeme Al</SheetTitle>
            <SheetDescription className="text-slate-400">
              {selectedDue?.student?.fullName} - Aidat Ödemesi
            </SheetDescription>
          </SheetHeader>
          {selectedDue && (
            <div className="mt-6 space-y-6">
              {/* Student Info */}
              <div className="flex items-center gap-4 rounded-lg bg-slate-800 p-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={selectedDue.student?.photoUrl || "/placeholder.svg"}
                  />
                  <AvatarFallback
                    name={selectedDue.student?.fullName}
                    className="bg-slate-700 text-white"
                  />
                </Avatar>
                <div>
                  <h3 className="font-medium text-white">
                    {selectedDue.student?.fullName}
                  </h3>
                  <p className="text-sm text-slate-400">
                    #{selectedDue.student?.studentNo}
                  </p>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="rounded-lg bg-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Toplam Tutar</span>
                  <span className="text-xl font-bold text-white">
                    {(
                      selectedDue.computedAmount ??
                      selectedDue.amount ??
                      0
                    ).toLocaleString("tr-TR")}{" "}
                    TL
                  </span>
                </div>
                {selectedDue.paidAmount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Ödenen</span>
                      <span className="text-emerald-400">
                        -{(selectedDue.paidAmount ?? 0).toLocaleString("tr-TR")}{" "}
                        TL
                      </span>
                    </div>
                    {selectedDue.originalAmount &&
                      selectedDue.computedAmount &&
                      selectedDue.originalAmount !==
                        selectedDue.computedAmount && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Orijinal</span>
                          <span className="text-slate-300">
                            {selectedDue.originalAmount.toLocaleString("tr-TR")}{" "}
                            TL
                          </span>
                        </div>
                      )}
                  </>
                )}
                <div className="border-t border-slate-700 pt-2 flex items-center justify-between">
                  <span className="text-slate-400">Kalan</span>
                  <span className="font-bold text-white">
                    {(
                      (selectedDue.computedAmount ?? selectedDue.amount ?? 0) -
                      (selectedDue.paidAmount ?? 0)
                    ).toLocaleString("tr-TR")}{" "}
                    TL
                  </span>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Ödeme Tutarı</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="border-slate-700 bg-slate-800 text-white text-lg font-medium"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-700 text-slate-300 bg-transparent text-xs"
                    >
                      Tam Ödeme
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-700 text-slate-300 bg-transparent text-xs"
                    >
                      Yarısı
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Ödeme Yöntemi</Label>
                  <Select defaultValue="cash">
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      <SelectItem value="cash" className="text-white">
                        Nakit
                      </SelectItem>
                      <SelectItem value="credit_card" className="text-white">
                        Kredi Kartı
                      </SelectItem>
                      <SelectItem value="bank_transfer" className="text-white">
                        Havale/EFT
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Not (Opsiyonel)</Label>
                  <Textarea
                    placeholder="Ödeme notu..."
                    className="border-slate-700 bg-slate-800 text-white"
                    rows={2}
                  />
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={async () => {
                  if (!selectedDue) return;
                  const remaining =
                    (selectedDue.computedAmount ?? selectedDue.amount ?? 0) -
                    (selectedDue.paidAmount ?? 0);
                  const amountNum = Number(
                    paymentAmount !== "" ? paymentAmount : remaining
                  );
                  const branchIdForPayment =
                    selectedDue.branchId || currentBranch?.id || null;
                  if (!branchIdForPayment) {
                    toast.error("Şube zorunlu");
                    return;
                  }
                  const { error: pErr } = await supabase
                    .from("payments")
                    .insert({
                      tenant_id: tenantId,
                      branch_id: branchIdForPayment,
                      student_id: selectedDue.studentId,
                      monthly_due_id: selectedDue.id,
                      amount: amountNum,
                      payment_type: "dues",
                      payment_date: new Date().toISOString().split("T")[0],
                    });
                  if (pErr) {
                    toast.error("Ödeme kaydedilemedi");
                    return;
                  }
                  const newPaid = (selectedDue.paidAmount ?? 0) + amountNum;
                  const newStatus =
                    newPaid >=
                    (selectedDue.computedAmount ?? selectedDue.amount ?? 0)
                      ? "paid"
                      : "partial";
                  const { error: dErr } = await supabase
                    .from("monthly_dues")
                    .update({
                      paid_amount: newPaid,
                      status: newStatus,
                      paid_at:
                        newStatus === "paid" ? new Date().toISOString() : null,
                    })
                    .eq("id", selectedDue.id);
                  if (dErr) {
                    toast.error("Aidat güncellenemedi");
                    return;
                  }
                  setIsPaymentSheetOpen(false);
                  location.reload();
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Ödemeyi Kaydet
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
