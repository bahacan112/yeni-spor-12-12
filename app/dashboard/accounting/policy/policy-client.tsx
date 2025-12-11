"use client";

import { useEffect, useState } from "react";
import { Save, Shield, CalendarCheck, Cog, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PolicyClientProps {
  branchId?: string;
  tenantId: string;
}

type FeeModel = "fixed" | "first_month_remaining" | "min_participation";
type FreezePolicy = "free" | "percent50" | "justified_only_free";
type ConflictPriority = "freeze_first" | "attendance_first";

export default function PolicyClient({
  branchId,
  tenantId,
}: PolicyClientProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [feeModel, setFeeModel] = useState<FeeModel>("fixed");
  const [freezeEnabled, setFreezeEnabled] = useState(false);
  const [freezeBeforeStartOnly, setFreezeBeforeStartOnly] = useState(true);
  const [yearlyFreezeLimit, setYearlyFreezeLimit] = useState<number>(0);
  const [freezeFeePolicy, setFreezeFeePolicy] = useState<FreezePolicy>("free");
  const [plannedLessons, setPlannedLessons] = useState<number | undefined>(8);
  const [minFullAttendance, setMinFullAttendance] = useState<
    number | undefined
  >(4);
  const [discountRangeMin, setDiscountRangeMin] = useState<number | undefined>(
    2
  );
  const [discountRangeMax, setDiscountRangeMax] = useState<number | undefined>(
    3
  );
  const [discountFeePercent, setDiscountFeePercent] = useState<
    number | undefined
  >(50);
  const [freeRangeMax, setFreeRangeMax] = useState<number | undefined>(1);
  const [conflictPriority, setConflictPriority] =
    useState<ConflictPriority>("freeze_first");

  useEffect(() => {
    const load = async () => {
      try {
        if (!branchId) {
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/branches/${branchId}/fee-policy`);
        const json = await res.json();
        const p = json.policy;
        if (p) {
          setFeeModel(p.fee_model as FeeModel);
          setFreezeEnabled(!!p.freeze_enabled);
          setFreezeBeforeStartOnly(!!p.freeze_before_month_start_only);
          setYearlyFreezeLimit(p.yearly_freeze_limit ?? 0);
          setFreezeFeePolicy((p.freeze_fee_policy || "free") as FreezePolicy);
          setPlannedLessons(p.planned_lessons_per_month ?? undefined);
          setMinFullAttendance(p.min_full_attendance ?? undefined);
          setDiscountRangeMin(p.discount_range_min ?? undefined);
          setDiscountRangeMax(p.discount_range_max ?? undefined);
          setDiscountFeePercent(p.discount_fee_percent ?? undefined);
          setFreeRangeMax(p.free_range_max ?? undefined);
          setConflictPriority(
            (p.conflict_priority || "freeze_first") as ConflictPriority
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [branchId]);

  const handleSave = async () => {
    try {
      if (!branchId) {
        toast.error("Önce bir şube seçin");
        return;
      }
      setSaving(true);
      const payload = {
        fee_model: feeModel,
        freeze_enabled: freezeEnabled,
        freeze_before_month_start_only: freezeBeforeStartOnly,
        yearly_freeze_limit: yearlyFreezeLimit,
        freeze_fee_policy: freezeFeePolicy,
        planned_lessons_per_month: plannedLessons,
        min_full_attendance: minFullAttendance,
        discount_range_min: discountRangeMin,
        discount_range_max: discountRangeMax,
        discount_fee_percent: discountFeePercent,
        free_range_max: freeRangeMax,
        conflict_priority: conflictPriority,
      };
      const res = await fetch(`/api/branches/${branchId}/fee-policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
      toast.success("Aidat politikası kaydedildi");
    } catch (e) {
      console.error(e);
      toast.error("Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Aidat Politikası
          </h1>
          <p className="text-sm text-muted-foreground">
            Şube bazlı aidat ve devamsızlık kuralları
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleSave}
            disabled={saving || loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" /> Aidat Modeli
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded hover:bg-muted">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Aidat hesaplama yöntemi; seçiminiz aylık ücretin nasıl
                  belirleneceğini etkiler.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-6 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="feeModel"
                checked={feeModel === "fixed"}
                onChange={() => setFeeModel("fixed")}
              />{" "}
              Sabit Aylık Aidat
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Katılımdan bağımsız tam aidat.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="feeModel"
                checked={feeModel === "first_month_remaining"}
                onChange={() => setFeeModel("first_month_remaining")}
              />{" "}
              İlk Ay Kalan Ders
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>İlk ay kalan derse göre; sonraki aylar sabit.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="feeModel"
                checked={feeModel === "min_participation"}
                onChange={() => setFeeModel("min_participation")}
              />{" "}
              Minimum Katılım
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Katılım aralıklarına göre indirim/ücretsiz.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" /> Dondurma Politikası
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded hover:bg-muted">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Ay dondurma ayarları ve dondurulan ayın ücret politikası.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Dondurma Aktif</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dondurma özelliğini aç/kapat.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={freezeEnabled}
              onCheckedChange={setFreezeEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">
                Sadece ay başlamadan
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ay başlamadan yapılan dondurmaları kabul eder.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={freezeBeforeStartOnly}
              onCheckedChange={setFreezeBeforeStartOnly}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">
                  Yıllık maks. dondurma
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted">
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bir öğrencinin yıllık dondurma hakkı.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                value={yearlyFreezeLimit}
                onChange={(e) =>
                  setYearlyFreezeLimit(parseInt(e.target.value || "0", 10))
                }
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">
                  Dondurulan ay ücreti
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted">
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Dondurulan ayın ücretlendirme kuralı.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <select
                className="w-full rounded-md bg-background text-foreground border border-border p-2"
                value={freezeFeePolicy}
                onChange={(e) =>
                  setFreezeFeePolicy(e.target.value as FreezePolicy)
                }
              >
                <option value="free">Ücretsiz</option>
                <option value="percent50">%50 Ücret</option>
                <option value="justified_only_free">Raporlular Ücretsiz</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Cog className="h-5 w-5" /> Minimum Katılım Kuralları
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded hover:bg-muted">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Aylık planlanan ders ve katılım eşikleri.
                  Tam/indirimli/ücretsiz seviyeleri ayarlayın.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">
                Aylık planlanan ders
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ay içinde planlanan toplam ders sayısı.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={plannedLessons ?? ""}
              onChange={(e) =>
                setPlannedLessons(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">
                Tam aidat için minimum
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tam ücret için gereken minimum katılım.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={minFullAttendance ?? ""}
              onChange={(e) =>
                setMinFullAttendance(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">
                İndirim aralığı (min)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>İndirim uygulanan alt sınır.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={discountRangeMin ?? ""}
              onChange={(e) =>
                setDiscountRangeMin(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">
                İndirim aralığı (max)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>İndirim uygulanan üst sınır.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={discountRangeMax ?? ""}
              onChange={(e) =>
                setDiscountRangeMax(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">İndirim yüzdesi</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>İndirim oranı (%).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={discountFeePercent ?? ""}
              onChange={(e) =>
                setDiscountFeePercent(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">
                Ücretsiz aralık (max)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1 rounded hover:bg-muted">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ücretsiz kabul edilen en fazla katılım.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="number"
              value={freeRangeMax ?? ""}
              onChange={(e) =>
                setFreeRangeMax(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-foreground">Kural Önceliği</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded hover:bg-muted">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Çakışan durumlarda hangi kuralın önce uygulanacağını seçin.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm text-muted-foreground">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="priority"
              checked={conflictPriority === "freeze_first"}
              onChange={() => setConflictPriority("freeze_first")}
            />{" "}
            Dondurma öncelikli
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded hover:bg-muted">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ay dondurulduysa katılım değerlendirilmez.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="priority"
              checked={conflictPriority === "attendance_first"}
              onChange={() => setConflictPriority("attendance_first")}
            />{" "}
            Katılım öncelikli
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded hover:bg-muted">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dondurma olsa bile katılım kuralları uygulanır.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
