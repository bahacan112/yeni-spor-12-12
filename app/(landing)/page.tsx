import Link from "next/link"
import {
  ArrowRight,
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  Shield,
  Smartphone,
  Globe,
  Check,
  Play,
  Building2,
  Wallet,
  ClipboardCheck,
  Link as LinkIcon,
  Bell,
  ShoppingBag,
  Map,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: Users,
    title: "Öğrenci Yönetimi",
    description: "Tüm öğrencilerinizi tek platformda yönetin. Kapsamlı öğrenci profilleri, iletişim bilgileri ve gelişim raporları.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: LinkIcon,
    title: "Online Kayıt Linkleri",
    description: "Web siteniz olmasa bile size özel kayıt linkleri oluşturun, yeni öğrencileri sosyal medya üzerinden kolayca toplayın.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Wallet,
    title: "Kapsamlı Finans Yönetimi",
    description: "Sadece aidat takibi değil; genel muhasebe, gelir-gider tabloları ve personel avansları dahil tüm kasanız kontrolünüz altında.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: ClipboardCheck,
    title: "Akıllı Yoklama Modülü",
    description: "Eğitmenleriniz tablet veya telefondan saniyeler içinde yoklama alabilir, gelmeyen öğrencileri veya izinlileri anında tespit edin.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Building2,
    title: "Çoklu Şube Merkezi",
    description: "Farklı lokasyonlardaki şubelerinizi tek bir arayüzden yönetin. Rol bazlı yetkilendirme ile her şubeye kendi yöneticisini atayın.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: ShoppingBag,
    title: "Mağaza & Ürün Satışı",
    description: "Kulübünüze ait forma, çanta ve antrenman ekipmanlarının stok ve ürün satışını dijital ortama taşıyarak gelirinizi artırın.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Bell,
    title: "Gerçek Zamanlı Bildirimler",
    description: "Gecikmiş aidat hatırlatmaları, ders iptalleri veya önemli duyuruları uygulama içi ve harici (push/sms) bildirimlerle hızlıca velilere ulaştırın.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Calendar,
    title: "Dinamik Antrenman Takvimi",
    description: "Saha veya salon çakışmalarını engelleyen akıllı takvim yapısıyla gruplarınızı profesyonelce planlayın.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    icon: Shield,
    title: "Rol Bazlı Güvenlik",
    description: "Sistemde kimin ne görebileceğini kesin olarak belirleyin. Eğitmenler sadece kendi gruplarını görürken yöneticiler büyük resmi izler.",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    icon: Map,
    title: "Saha & Tesis Kiralama",
    description: "Halı saha, tenis kortu veya kapalı spor salonu gibi tesislerinizin saatlik rezervasyonlarını ve kiralama ücretlerini yönetin.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: BarChart3,
    title: "Gelişmiş Raporlama",
    description: "Gelir-gider analizlerinden, öğrenci devamlılık istatistiklerine kadar işletmenizin performansını detaylı grafiklerle tek ekranda görün.",
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
  },
  {
    icon: Smartphone,
    title: "Mobil Uyumlu Kullanım",
    description: "Tesis dışında bile olun, akıllı telefonlardan tam uyumlu arayüzle işletmenizi cepten kolayca kontrol edin.",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
]

import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Yeni Spor Okulu | Spor Akademisi ve Kulüp Yönetim Yazılımı",
  description: "Öğrenci kaydı, aidat takibi, çoklu şube yönetimi ve antrenman planlama özellikleriyle spor akademinizi tek bir platformdan, profesyonelce yönetin.",
}

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1">
              Yeni: Eğitmen Portalı Yayında
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight text-balance">
              Spor Akademinizi
              <span className="block mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Profesyonelce Yönetin
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto text-pretty">
              Öğrenci kayıtları, aidat takibi, antrenman programları ve daha fazlası. Spor okulları için tasarlanmış tam
              kapsamlı yönetim platformu.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-lg h-12 px-8"
                >
                  14 Gün Ücretsiz Dene
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800 text-lg h-12 px-8 bg-transparent"
              >
                <Play className="mr-2 h-5 w-5" />
                Demo İzle
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">Kredi kartı gerekmez • Kurulum ücreti yok</p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2 shadow-2xl">
              <img src="/modern-dark-dashboard-ui-for-sports-academy-manage.jpg" alt="Dashboard Preview" className="rounded-lg w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Özellikler</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-balance">
              İhtiyacınız olan her şey tek platformda
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Spor okulunuzun tüm yönetim ihtiyaçlarını karşılayan kapsamlı özellikler
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
              >
                <CardContent className="p-6">
                  <div className={`inline-flex rounded-lg p-3 ${feature.bgColor} mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 sm:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="relative text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-balance">
                Spor okulunuzu bir üst seviyeye taşıyın
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                14 gün ücretsiz deneme ile tüm özellikleri keşfedin. Kredi kartı gerekmez.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg h-12 px-8">
                    Hemen Başla
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 text-lg h-12 px-8 bg-transparent"
                  >
                    İletişime Geç
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="font-semibold text-white">256-bit SSL Güvenlik</p>
                <p className="text-sm text-slate-400">Verileriniz güvende</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>KVKK Uyumlu</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>GDPR Uyumlu</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>ISO 27001</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
