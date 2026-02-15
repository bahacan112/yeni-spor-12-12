"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformPlan } from "@/lib/types";

const staticFaqs = [
  {
    question: "Ücretsiz deneme süresi ne kadar?",
    answer:
      "14 gün ücretsiz deneme süresi sunuyoruz. Bu süre içinde tüm Pro özellikleri kullanabilirsiniz. Kredi kartı gerekmez.",
  },
  {
    question: "Paket değişikliği yapabilir miyim?",
    answer:
      "Evet, dilediğiniz zaman paketinizi yükseltebilir veya düşürebilirsiniz. Fark hesaplanarak yansıtılır.",
  },
  {
    question: "Yıllık ödemede indirim var mı?",
    answer: "Evet, yıllık ödemede 2 ay ücretsiz kullanım hakkı kazanırsınız.",
  },
  {
    question: "Kurulum ücreti var mı?",
    answer:
      "Hayır, kurulum ücreti yoktur. Hemen kaydolup kullanmaya başlayabilirsiniz.",
  },
  {
    question: "Verilerim güvende mi?",
    answer:
      "Evet, 256-bit SSL şifreleme, KVKK ve GDPR uyumlu altyapı ile verileriniz tamamen güvende.",
  },
  {
    question: "Destek nasıl sağlanıyor?",
    answer:
      "E-posta, canlı chat ve telefon desteği sunuyoruz. Kurumsal paketlerde öncelikli destek mevcuttur.",
  },
];

function PlanCard({
  plan,
  onStart,
}: {
  plan: PlatformPlan;
  onStart: (p: PlatformPlan) => void;
}) {
  const monthly = Number(plan.monthlyPrice || 0);
  const yearly = Number(plan.yearlyPrice || 0);
  return (
    <Card
      className={`relative bg-slate-900/50 border-slate-800 ${
        plan.isFeatured ? "border-emerald-500 scale-105" : ""
      }`}
    >
      {plan.isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-emerald-500 text-white">En Popüler</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-white">{plan.name}</CardTitle>
        <CardDescription className="text-slate-400">
          {plan.description || ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <span className="text-4xl font-bold text-white">
            ₺{monthly.toLocaleString("tr-TR")}
          </span>
          <span className="text-slate-400">/ay</span>
          {yearly > 0 && (
            <p className="text-sm text-emerald-500 mt-1">
              Yıllık: ₺{yearly.toLocaleString("tr-TR")}
            </p>
          )}
        </div>
        <div className="space-y-3">
          {(plan.features || []).map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-sm text-slate-300"
            >
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              {feature}
            </div>
          ))}
        </div>
        <Button
          className={`w-full ${
            plan.isFeatured
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-slate-800 hover:bg-slate-700 text-white"
          }`}
          onClick={() => onStart(plan)}
        >
          Hemen Başla
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlatformPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [taxNo, setTaxNo] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/billing/plans");
        const json = await res.json();
        if (res.ok && Array.isArray(json.plans)) {
          const mapped = (json.plans || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            monthlyPrice: Number(p.monthly_price || 0),
            yearlyPrice: Number(p.yearly_price || 0),
            maxStudents: p.max_students,
            maxGroups: p.max_groups,
            maxBranches: p.max_branches,
            maxInstructors: p.max_instructors,
            features: Array.isArray(p.features) ? p.features : [],
            isActive: !!p.is_active,
            trialEnabled: !!p.trial_enabled,
            trialDefaultDays: p.trial_default_days ?? null,
            isFeatured: !!p.is_featured,
            sortOrder: Number(p.sort_order || 0),
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          })) as PlatformPlan[];
          setPlans(mapped);
        } else {
          setPlans([]);
        }
      } catch {
        setPlans([]);
      }
    })();
  }, []);

  async function startCheckout() {
    if (!selectedPlan) return;
    setSaving(true);
    setError(null);
    try {
      console.log("ui:checkout:start", { planId: selectedPlan.id });
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingPeriod: "monthly",
          invoice: {
            companyName,
            taxNo,
            taxOffice,
            city,
            email,
            phone,
            address,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Ödeme başlatılamadı");
        console.log("ui:checkout:error", { error: json.error });
        return;
      }
      const url = json.redirectUrl as string | undefined;
      if (url) {
        console.log("ui:checkout:redirect", { redirectUrl: url });
        window.location.href = url;
      } else {
        setError("Yönlendirme adresi alınamadı");
        console.log("ui:checkout:no-redirect-url");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Fiyatlandırma
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Size uygun planı
            <span className="block mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              seçin
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Her bütçeye uygun esnek fiyatlandırma. Yıllık ödemede 2 ay ücretsiz.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-4">
            {plans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                onStart={(plan) => {
                  setSelectedPlan(plan);
                  setOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-900/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
              SSS
            </Badge>
            <h2 className="text-3xl font-bold text-white">
              Sık Sorulan Sorular
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {staticFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-slate-800 rounded-lg bg-slate-900/50 px-4"
              >
                <AccordionTrigger className="text-white hover:text-emerald-500 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Hala kararsız mısınız?
          </h2>
          <p className="text-slate-400 mb-6">
            Uzmanlarımızla görüşün, size en uygun paketi birlikte belirleyelim.
          </p>
          <Link href="/contact">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 bg-transparent"
            >
              Demo Talep Et
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="bg-slate-900 border-slate-800">
          <SheetHeader>
            <SheetTitle className="text-white">Fatura Bilgileri</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Şirket Ünvanı</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Vergi Numarası</Label>
              <Input
                value={taxNo}
                onChange={(e) => setTaxNo(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Vergi Dairesi</Label>
              <Input
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Şehir</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">E‑posta</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Telefon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Adres</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            {error && (
              <div className="rounded-md border border-red-600 bg-red-950/30 p-3 text-red-200">
                {error}
              </div>
            )}
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={
                saving || !selectedPlan || !companyName || !taxNo || !email
              }
              onClick={startCheckout}
            >
              Ödemeye Geç
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
