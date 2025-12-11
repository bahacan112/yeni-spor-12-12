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
  Star,
  Check,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const features = [
  {
    icon: Users,
    title: "Öğrenci Yönetimi",
    description: "Tüm öğrencilerinizi tek platformda yönetin. Kayıt, devam takibi ve performans analizi.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: CreditCard,
    title: "Aidat Takibi",
    description: "Aylık aidat ödemelerini kolayca takip edin. Otomatik hatırlatmalar gönderin.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Calendar,
    title: "Antrenman Programı",
    description: "Antrenman programlarını planlayın ve grupları yönetin. Yoklama alın.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: BarChart3,
    title: "Raporlar & Analiz",
    description: "Detaylı raporlar ve analizlerle işletmenizi daha iyi anlayın.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Smartphone,
    title: "Mobil Uyumlu",
    description: "Her cihazdan erişim. Mobil-first tasarım ile her yerde yönetim.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Globe,
    title: "Web Sitesi",
    description: "Akademiniz için otomatik web sitesi. Online kayıt ve ürün satışı.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
]

const stats = [
  { value: "500+", label: "Spor Okulu" },
  { value: "50.000+", label: "Öğrenci" },
  { value: "₺10M+", label: "Yönetilen Ödeme" },
  { value: "%99.9", label: "Uptime" },
]

const testimonials = [
  {
    name: "Ahmet Yılmaz",
    role: "Altınşehir Spor Akademisi",
    content: "SporYonetim sayesinde 300 öğrencimizi çok daha kolay yönetiyoruz. Aidat takibi artık baş ağrısı değil.",
    avatar: "/male-coach-portrait.jpg",
    rating: 5,
  },
  {
    name: "Fatma Demir",
    role: "Yüzme Akademisi",
    content: "Eğitmenlerimiz kendi panellerinden yoklama alabiliyor. Veli memnuniyeti çok arttı.",
    avatar: "/female-swimming-coach.jpg",
    rating: 5,
  },
  {
    name: "Mehmet Kaya",
    role: "Basketbol Kulübü",
    content: "Çoklu şube desteği mükemmel. 5 şubemizi tek panelden yönetiyoruz.",
    avatar: "/basketball-coach.png",
    rating: 5,
  },
]

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

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
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

      {/* Testimonials Section */}
      <section className="py-20 sm:py-32 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">Kullanıcı Yorumları</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-balance">500+ spor okulu bize güveniyor</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-6">&quot;{testimonial.content}&quot;</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-slate-700 text-white">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-400">{testimonial.role}</p>
                    </div>
                  </div>
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
