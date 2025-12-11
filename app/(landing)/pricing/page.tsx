import Link from "next/link"
import { Check, ArrowRight, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const plans = [
  {
    name: "Deneme",
    description: "Sistemi tanımak için",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["30 öğrenci", "2 grup", "1 şube", "2 eğitmen", "Temel özellikler"],
    limitations: ["SMS bildirimi yok", "Web sitesi yok", "E-ticaret yok"],
    cta: "Ücretsiz Başla",
    popular: false,
  },
  {
    name: "Başlangıç",
    description: "Küçük spor okulları için",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    features: ["100 öğrenci", "5 grup", "1 şube", "5 eğitmen", "E-posta desteği", "Temel raporlar"],
    limitations: ["SMS bildirimi yok", "Web sitesi yok"],
    cta: "Hemen Başla",
    popular: false,
  },
  {
    name: "Profesyonel",
    description: "Büyüyen akademiler için",
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    features: [
      "500 öğrenci",
      "20 grup",
      "3 şube",
      "15 eğitmen",
      "SMS + E-posta bildirimi",
      "Web sitesi",
      "E-ticaret",
      "Detaylı raporlar",
    ],
    limitations: [],
    cta: "Hemen Başla",
    popular: true,
  },
  {
    name: "Kurumsal",
    description: "Büyük kurumlar için",
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    features: [
      "Sınırsız öğrenci",
      "Sınırsız grup",
      "Sınırsız şube",
      "Sınırsız eğitmen",
      "Öncelikli destek",
      "Özel domain",
      "API erişimi",
      "Özel entegrasyonlar",
    ],
    limitations: [],
    cta: "İletişime Geç",
    popular: false,
  },
]

const faqs = [
  {
    question: "Ücretsiz deneme süresi ne kadar?",
    answer:
      "14 gün ücretsiz deneme süresi sunuyoruz. Bu süre içinde tüm Pro özellikleri kullanabilirsiniz. Kredi kartı gerekmez.",
  },
  {
    question: "Paket değişikliği yapabilir miyim?",
    answer: "Evet, dilediğiniz zaman paketinizi yükseltebilir veya düşürebilirsiniz. Fark hesaplanarak yansıtılır.",
  },
  {
    question: "Yıllık ödemede indirim var mı?",
    answer: "Evet, yıllık ödemede 2 ay ücretsiz kullanım hakkı kazanırsınız.",
  },
  {
    question: "Kurulum ücreti var mı?",
    answer: "Hayır, kurulum ücreti yoktur. Hemen kaydolup kullanmaya başlayabilirsiniz.",
  },
  {
    question: "Verilerim güvende mi?",
    answer: "Evet, 256-bit SSL şifreleme, KVKK ve GDPR uyumlu altyapı ile verileriniz tamamen güvende.",
  },
  {
    question: "Destek nasıl sağlanıyor?",
    answer: "E-posta, canlı chat ve telefon desteği sunuyoruz. Kurumsal paketlerde öncelikli destek mevcuttur.",
  },
]

export default function PricingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Fiyatlandırma</Badge>
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
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative bg-slate-900/50 border-slate-800 ${plan.popular ? "border-emerald-500 scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">En Popüler</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-4xl font-bold text-white">₺{plan.monthlyPrice.toLocaleString("tr-TR")}</span>
                    <span className="text-slate-400">/ay</span>
                    {plan.yearlyPrice > 0 && (
                      <p className="text-sm text-emerald-500 mt-1">
                        Yıllık: ₺{plan.yearlyPrice.toLocaleString("tr-TR")}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="h-4 w-4 text-center">-</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.monthlyPrice === 0 ? "/auth/register" : "/auth/register"}>
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-900/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">SSS</Badge>
            <h2 className="text-3xl font-bold text-white">Sık Sorulan Sorular</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-slate-800 rounded-lg bg-slate-900/50 px-4"
              >
                <AccordionTrigger className="text-white hover:text-emerald-500 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Hala kararsız mısınız?</h2>
          <p className="text-slate-400 mb-6">Uzmanlarımızla görüşün, size en uygun paketi birlikte belirleyelim.</p>
          <Link href="/contact">
            <Button variant="outline" className="border-slate-700 text-slate-300 bg-transparent">
              Demo Talep Et
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
