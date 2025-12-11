import {
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  Smartphone,
  Globe,
  Bell,
  Shield,
  Building2,
  QrCode,
  FileText,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const mainFeatures = [
  {
    icon: Users,
    title: "Öğrenci Yönetimi",
    description: "Kapsamlı öğrenci kayıt sistemi ile tüm bilgileri tek yerden yönetin.",
    features: [
      "Detaylı öğrenci profilleri",
      "Veli bilgileri ve iletişim",
      "Sağlık ve acil durum bilgileri",
      "Belge yükleme ve saklama",
      "Grup atamaları",
      "Performans takibi",
    ],
  },
  {
    icon: CreditCard,
    title: "Aidat Takibi",
    description: "Aylık aidat ödemelerini kolayca takip edin ve otomatik hatırlatmalar gönderin.",
    features: [
      "Otomatik aidat oluşturma",
      "Ödeme hatırlatmaları",
      "Kısmi ödeme desteği",
      "Gecikme takibi",
      "Ödeme geçmişi",
      "Raporlama",
    ],
  },
  {
    icon: Calendar,
    title: "Antrenman Programı",
    description: "Haftalık ve aylık antrenman programlarını planlayın.",
    features: [
      "Sürükle-bırak takvim",
      "Grup bazlı programlama",
      "Saha/salon ataması",
      "Eğitmen ataması",
      "Tekrarlayan antrenmanlar",
      "İptal ve değişiklikler",
    ],
  },
  {
    icon: Bell,
    title: "Bildirim Sistemi",
    description: "SMS, e-posta ve push bildirimleri ile herkes bilgilendirilsin.",
    features: [
      "Otomatik hatırlatmalar",
      "Toplu bildirim gönderimi",
      "Şablon yönetimi",
      "Gönderim geçmişi",
      "Zamanlanmış bildirimler",
      "Kişiselleştirme",
    ],
  },
  {
    icon: BarChart3,
    title: "Raporlar & Analiz",
    description: "Detaylı raporlar ile işletmenizi daha iyi anlayın.",
    features: [
      "Gelir-gider raporları",
      "Öğrenci istatistikleri",
      "Katılım oranları",
      "Performans metrikleri",
      "Excel/PDF dışa aktarma",
      "Özel rapor oluşturma",
    ],
  },
  {
    icon: Globe,
    title: "Web Sitesi",
    description: "Akademiniz için otomatik web sitesi oluşturun.",
    features: [
      "Özelleştirilebilir tasarım",
      "Online kayıt formu",
      "Duyuru yayınlama",
      "Galeri ve medya",
      "E-ticaret entegrasyonu",
      "SEO optimizasyonu",
    ],
  },
]

const additionalFeatures = [
  { icon: Building2, title: "Çoklu Şube", description: "Tüm şubelerinizi tek panelden yönetin" },
  { icon: QrCode, title: "QR Kayıt", description: "QR kod ile hızlı kayıt linkleri oluşturun" },
  { icon: Shield, title: "Güvenlik", description: "256-bit SSL ve KVKK uyumlu altyapı" },
  { icon: Smartphone, title: "Mobil Uygulama", description: "iOS ve Android uyumlu mobil arayüz" },
  { icon: FileText, title: "Belge Yönetimi", description: "Sözleşme ve evrak şablonları" },
  { icon: Zap, title: "API Erişimi", description: "Diğer sistemlerle entegrasyon" },
]

export default function FeaturesPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-purple-500/10 text-purple-400 border-purple-500/20">Özellikler</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Spor okulunuz için
            <span className="block mt-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              güçlü özellikler
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Modern yönetim araçları ile spor akademinizi profesyonelce yönetin
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {mainFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex flex-col gap-12 lg:flex-row ${index % 2 === 1 ? "lg:flex-row-reverse" : ""} items-center`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div className="inline-flex rounded-lg bg-blue-500/10 p-3 mb-4">
                    <feature.icon className="h-8 w-8 text-blue-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">{feature.title}</h2>
                  <p className="text-lg text-slate-400 mb-6">{feature.description}</p>
                  <ul className="grid grid-cols-2 gap-3">
                    {feature.features.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-slate-300">
                        <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image */}
                <div className="flex-1">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2">
                    <img
                      src={`/.jpg?height=400&width=600&query=${feature.title} dashboard UI dark mode`}
                      alt={feature.title}
                      className="rounded-lg w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Ve çok daha fazlası...</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature) => (
              <Card key={feature.title} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="rounded-lg bg-slate-800 p-2">
                    <feature.icon className="h-6 w-6 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Tüm özellikleri keşfedin</h2>
          <p className="text-lg text-slate-400 mb-8">14 gün ücretsiz deneme ile başlayın</p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              Ücretsiz Başla
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
