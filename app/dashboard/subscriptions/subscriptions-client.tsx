"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { TenantSubscription, TenantPayment, PlatformPlan } from "@/lib/types";
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  subscription: TenantSubscription | null;
  payments: TenantPayment[];
  usage: {
    students: number;
    groups: number;
    branches: number;
    limits: {
      maxStudents?: number | null;
      maxGroups?: number | null;
      maxBranches?: number | null;
    };
  };
  tenantId: string;
}

export default function SubscriptionsClient({
  subscription,
  payments,
  usage,
}: Props) {
  const router = useRouter();
  const [subState, setSubState] = useState<TenantSubscription | null>(
    subscription,
  );
  const [plans, setPlans] = useState<any[]>([]);
  const [planId, setPlanId] = useState<string | undefined>(undefined);
  const [planSlug, setPlanSlug] = useState<string | undefined>(undefined);
  const [autoRenew, setAutoRenew] = useState<boolean>(
    !!subscription?.autoRenew,
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    subscription?.paymentMethod || "",
  );
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingPM, setLoadingPM] = useState(false);
  const [loadingAR, setLoadingAR] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  useEffect(() => {
    setAutoRenew(!!subscription?.autoRenew);
    setPaymentMethod(subscription?.paymentMethod || "");
    setSubState(subscription);
  }, [subscription]);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/billing/plans");
      const json = await res.json().catch(() => ({ plans: [] }));
      const list = json.plans || json || [];
      setPlans(list);
    } catch {
      setPlans([]);
    }
  }

  function mapPlanRow(row: any): PlatformPlan {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      monthlyPrice: row.monthly_price,
      yearlyPrice: row.yearly_price,
      maxStudents: row.max_students,
      maxGroups: row.max_groups,
      maxBranches: row.max_branches,
      maxInstructors: row.max_instructors,
      features: row.features,
      isActive: row.is_active,
      trialEnabled: row.trial_enabled,
      trialDefaultDays: row.trial_default_days,
      isFeatured: row.is_featured,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async function changePlan() {
    if (!planId) return;
    setLoadingPlan(true);
    try {
      await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_plan", planId }),
      }).then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || res.statusText);
          setSuccess(null);
          return;
        }
        const selPlan = (plans || []).find((p) => p.id === planId);
        const updatedPlan = selPlan ? mapPlanRow(selPlan) : subState?.plan;
        const updatedSub: TenantSubscription | null = subState
          ? {
              ...subState,
              planId,
              plan: updatedPlan,
              updatedAt: new Date().toISOString(),
            }
          : json.subscription || null;
        setSubState(updatedSub);
        setError(null);
        setSuccess("Plan güncellendi");
      });
    } finally {
      setLoadingPlan(false);
    }
  }

  async function updatePaymentMethod() {
    if (!paymentMethod) return;
    setLoadingPM(true);
    try {
      await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_payment_method",
          paymentMethod,
        }),
      }).then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || res.statusText);
          setSuccess(null);
          return;
        }
        setSubState(
          subState
            ? {
                ...subState,
                paymentMethod,
                status:
                  subState.status !== "active" ? "active" : subState.status,
                updatedAt: new Date().toISOString(),
              }
            : subState,
        );
        setError(null);
        setSuccess("Ödeme yöntemi güncellendi");
      });
    } finally {
      setLoadingPM(false);
    }
  }

  async function toggleAutoRenew(next: boolean) {
    setAutoRenew(next);
    setLoadingAR(true);
    try {
      await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_auto_renew", autoRenew: next }),
      }).then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || res.statusText);
          setSuccess(null);
          return;
        }
        setSubState(
          subState
            ? {
                ...subState,
                autoRenew: next,
                updatedAt: new Date().toISOString(),
              }
            : subState,
        );
        setError(null);
        setSuccess(next ? "Oto yenileme açık" : "Oto yenileme kapalı");
      });
    } finally {
      setLoadingAR(false);
    }
  }

  const planName = subState?.plan?.name || "Plan Yok";
  const status = subState?.status || "inactive";
  const period = subState?.billingPeriod || "monthly";
  const start = subState?.currentPeriodStart
    ? new Date(subState.currentPeriodStart)
    : null;
  const end = subState?.currentPeriodEnd
    ? new Date(subState.currentPeriodEnd)
    : null;
  const daysLeft = end
    ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
    : null;

  const studentLimit = usage.limits.maxStudents ?? undefined;
  const groupLimit = usage.limits.maxGroups ?? undefined;
  const branchLimit = usage.limits.maxBranches ?? undefined;

  const studentPct = studentLimit
    ? Math.min(100, Math.round((usage.students / studentLimit) * 100))
    : 0;
  const groupPct = groupLimit
    ? Math.min(100, Math.round((usage.groups / groupLimit) * 100))
    : 0;
  const branchPct = branchLimit
    ? Math.min(100, Math.round((usage.branches / branchLimit) * 100))
    : 0;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Abonelik</h1>
          <p className="text-sm text-slate-400">
            Plan, kullanım ve faturalandırma
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={planDialogOpen}
            onOpenChange={(o) => {
              setPlanDialogOpen(o);
              if (o && plans.length === 0) fetchPlans();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Planı Değiştir
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Plan Seç</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 bg-transparent"
                  onClick={() => {
                    setPlanId(undefined);
                    fetchPlans();
                  }}
                >
                  Planları Yükle
                </Button>
                <Select
                  value={planId}
                  onValueChange={(v) => {
                    const nextId = v && v !== "undefined" ? v : undefined;
                    setPlanId(nextId);
                    const sel =
                      (plans || []).find(
                        (p) => String(p.id ?? "") === String(nextId ?? ""),
                      ) || (plans || []).find((p) => p.slug === v);
                    setPlanSlug(sel?.slug);
                  }}
                >
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                    <SelectValue placeholder="Plan seçin" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {plans.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={String(p.id ?? "")}
                        className="text-white"
                      >
                        {p.name} — ₺
                        {Number(p.monthly_price || 0).toLocaleString("tr-TR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-slate-400">
                  Yükseltme ise hemen uygulanır ve simülasyon ödemesi
                  oluşturulur. Düşürme ise dönem sonunda geçerlidir; mevcut
                  özellikler dönem sonuna kadar kullanılabilir.
                </div>
                <DialogFooter>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!planId || planId === "undefined"}
                    onClick={async () => {
                      if (!planId) return;
                      setLoadingPlan(true);
                      setError(null);
                      setSuccess(null);
                      try {
                        const res = await fetch(
                          "/api/billing/simulate-change",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ planId, planSlug }),
                          },
                        );
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          setError(json.error || "Plan değiştirilemedi");
                        } else {
                          const sel = (plans || []).find(
                            (p) => String(p.id ?? "") === String(planId),
                          );
                          const mapped = sel ? mapPlanRow(sel) : subState?.plan;
                          setSubState(
                            subState
                              ? {
                                  ...subState,
                                  planId: String(planId),
                                  plan: mapped,
                                  status:
                                    json.effect === "upgraded_now"
                                      ? "active"
                                      : subState.status,
                                  updatedAt: new Date().toISOString(),
                                  pendingDowngradePlanId:
                                    json.effect === "scheduled_downgrade"
                                      ? String(planId)
                                      : subState.pendingDowngradePlanId,
                                  pendingDowngradeEffectiveAt:
                                    json.effect === "scheduled_downgrade"
                                      ? String(json.effectiveAt || "")
                                      : subState.pendingDowngradeEffectiveAt,
                                }
                              : subState,
                          );
                          setSuccess(
                            json.effect === "upgraded_now"
                              ? "Plan yükseltildi ve simülasyon ödemesi oluşturuldu"
                              : `Plan düşürme dönem sonuna planlandı (${new Date(
                                  json.effectiveAt,
                                ).toLocaleDateString("tr-TR")})`,
                          );
                          router.refresh();
                        }
                      } finally {
                        setLoadingPlan(false);
                      }
                    }}
                  >
                    Simüle Ödeme ile Planı Değiştir
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 bg-transparent"
              >
                Ödeme Yöntemi
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-white">Ödeme Yöntemi</DialogTitle>
              </DialogHeader>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                  <SelectValue placeholder="Yöntem" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  <SelectItem value="cash" className="text-white">
                    Nakit
                  </SelectItem>
                  <SelectItem value="credit_card" className="text-white">
                    Kart
                  </SelectItem>
                  <SelectItem value="bank_transfer" className="text-white">
                    Havale
                  </SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button
                  onClick={updatePaymentMethod}
                  disabled={loadingPM || !paymentMethod}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex items-center gap-2">
            <Switch checked={autoRenew} onCheckedChange={toggleAutoRenew} />
            <span className="text-slate-300 text-sm">Oto Yenileme</span>
          </div>
        </div>
      </div>
      {error && (
        <div className="rounded-md border border-red-600 bg-red-950/30 p-3 text-red-200">
          Hata: {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-600 bg-green-950/30 p-3 text-green-200">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Plan Bilgisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white text-lg font-semibold">
                  {planName}
                </div>
                <div className="text-slate-400 text-sm">
                  {period === "yearly" ? "Yıllık" : "Aylık"} faturalandırma
                </div>
              </div>
              <Badge variant="outline" className="text-white border-slate-700">
                {status}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="h-4 w-4" />
                <span>{start ? start.toLocaleDateString("tr-TR") : "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <RefreshCw className="h-4 w-4" />
                <span>{end ? end.toLocaleDateString("tr-TR") : "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle className="h-4 w-4" />
                <span>{daysLeft !== null ? `${daysLeft} gün kaldı` : "-"}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Öğrenci</span>
                  <span>
                    {usage.students}
                    {studentLimit ? ` / ${studentLimit}` : ""}
                  </span>
                </div>
                <Progress value={studentPct} />
              </div>
              <div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Grup</span>
                  <span>
                    {usage.groups}
                    {groupLimit ? ` / ${groupLimit}` : ""}
                  </span>
                </div>
                <Progress value={groupPct} />
              </div>
              <div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Şube</span>
                  <span>
                    {usage.branches}
                    {branchLimit ? ` / ${branchLimit}` : ""}
                  </span>
                </div>
                <Progress value={branchPct} />
              </div>
            </div>
            {subscription?.isTrial && (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Deneme süresi aktif</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>Abonelik Ödemeleri</CardTitle>
          </CardHeader>
          <CardContent>
            {subState?.pendingDowngradePlanId &&
              subState?.pendingDowngradeEffectiveAt && (
                <div className="mb-3 rounded-md border border-amber-600 bg-amber-950/30 p-3 text-amber-200 text-sm">
                  Plan düşürme planlandı. Geçerlilik tarihi:{" "}
                  {new Date(
                    subState.pendingDowngradeEffectiveAt,
                  ).toLocaleDateString("tr-TR")}
                </div>
              )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Yöntem</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Fatura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {Number(p.amount || 0).toLocaleString("tr-TR")} TL
                    </TableCell>
                    <TableCell>{p.paymentMethod || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-white border-slate-700"
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.invoiceNo || "-"}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-slate-400">
                      Kayıt bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
