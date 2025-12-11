import { Target, Eye, Heart, Users, Award, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const values = [
  {
    icon: Target,
    title: "Müşteri Odaklılık",
    description: "Kullanıcılarımızın ihtiyaçlarını her zaman ön planda tutuyoruz.",
  },
  {
    icon: Heart,
    title: "Tutku",
    description: "Spor ve teknolojiye olan tutkumuzla çalışıyoruz.",
  },
  {
    icon: TrendingUp,
    title: "Sürekli Gelişim",
    description: "Platformumuzu sürekli geliştirerek en iyi deneyimi sunuyoruz.",
  },
]

const team = [
  {
    name: "Ahmet Yılmaz",
    role: "Kurucu & CEO",
    image: "/ceo-portrait.png",
  },
  {
    name: "Elif Kaya",
    role: "CTO",
    image: "/professional-woman-cto.png",
  },
  {
    name: "Mehmet Demir",
    role: "Ürün Müdürü",
    image: "/professional-man-product-manager-portrait.jpg",
  },
  {
    name: "Zeynep Aksoy",
    role: "Müşteri Başarısı",
    image: "/professional-woman-customer-success.png",
  },
]

const milestones = [
  { year: "2020", title: "Kuruluş", description: "SporYonetim fikri doğdu" },
  { year: "2021", title: "İlk Versiyon", description: "Platform yayına alındı" },
  { year: "2022", title: "100. Müşteri", description: "100 spor okulu bize güvendi" },
  { year: "2023", title: "Yatırım", description: "Seri A yatırım aldık" },
  { year: "2024", title: "500+ Müşteri", description: "500 spor okuluna ulaştık" },
]

export default function AboutPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6 bg-amber-500/10 text-amber-400 border-amber-500/20">Hakkımızda</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Spor eğitiminin geleceğini
              <span className="block mt-2 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                birlikte şekillendiriyoruz
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-400">
              2020'den bu yana spor okullarının dijital dönüşümüne öncülük ediyoruz. Misyonumuz, her spor akademisinin
              profesyonel yönetim araçlarına erişebilmesini sağlamak.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm text-slate-400">Spor Okulu</p>
            </div>
            <div className="text-center">
              <Award className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">50.000+</p>
              <p className="text-sm text-slate-400">Öğrenci</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">81</p>
              <p className="text-sm text-slate-400">İl</p>
            </div>
            <div className="text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">%98</p>
              <p className="text-sm text-slate-400">Müşteri Memnuniyeti</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8">
                <div className="inline-flex rounded-lg bg-blue-500/10 p-3 mb-4">
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Misyonumuz</h2>
                <p className="text-slate-400">
                  Spor okullarının ve akademilerin yönetim süreçlerini dijitalleştirerek, eğitimcilerin asıl işlerine -
                  sporculara - odaklanmalarını sağlamak. Kullanımı kolay, erişilebilir ve güvenilir bir platform
                  sunuyoruz.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8">
                <div className="inline-flex rounded-lg bg-emerald-500/10 p-3 mb-4">
                  <Eye className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Vizyonumuz</h2>
                <p className="text-slate-400">
                  Türkiye'nin ve bölgenin lider spor yönetim platformu olmak. Her büyüklükteki spor okulunun profesyonel
                  yönetim araçlarına erişebildiği bir ekosistem oluşturmak.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Değerlerimiz</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <Card key={value.title} className="bg-slate-900/50 border-slate-800 text-center">
                <CardContent className="p-8">
                  <div className="inline-flex rounded-lg bg-slate-800 p-3 mb-4">
                    <value.icon className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-slate-400">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Yolculuğumuz</h2>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2 hidden md:block" />
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`flex flex-col md:flex-row items-center gap-4 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <Card className="bg-slate-900/50 border-slate-800 inline-block">
                      <CardContent className="p-4">
                        <p className="text-sm text-emerald-500 font-semibold">{milestone.year}</p>
                        <h3 className="font-bold text-white">{milestone.title}</h3>
                        <p className="text-sm text-slate-400">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative z-10 hidden md:flex h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-slate-950" />
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Ekibimiz</h2>
            <p className="text-slate-400 mt-2">Tutkulu ve deneyimli bir ekip</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Card key={member.name} className="bg-slate-900/50 border-slate-800 text-center">
                <CardContent className="p-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={member.image || "/placeholder.svg"} />
                    <AvatarFallback className="bg-slate-700 text-white text-xl">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-slate-400">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
