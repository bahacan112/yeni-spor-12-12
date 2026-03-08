import {
  Users,
  Calendar,
  BarChart3,
  Smartphone,
  Bell,
  Shield,
  Building2,
  QrCode,
  FileText,
  Zap,
  Check,
  ArrowRight,
  Wallet,
  ClipboardCheck,
  Link as LinkIcon,
  ShoppingBag,
  Map,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const mainFeatures = [
  {
    icon: Users,
    title: "Öğrenci Yönetimi",
    description: "Tüm öğrencilerinizi tek platformda yönetin. Kapsamlı öğrenci profilleri, iletişim bilgileri ve gelişim raporları.",
    image: "/features/ogrenci-yonetimi.jpg",
    features: [
      "Detaylı öğrenci profili oluşturma",
      "Veli bilgileri ve eşleştirme",
      "Grup ve branş atamaları",
      "Yoklama geçmişi takibi",
      "Aidat ve ödeme takibi",
      "Aktif/Pasif durum yönetimi",
    ],
  },
  {
    icon: LinkIcon,
    title: "Online Kayıt Linkleri",
    description: "Web siteniz olmasa bile size özel kayıt linkleri oluşturun, yeni öğrencileri paylaştığınız link üzerinden kolayca toplayın.",
    image: "/features/online-kayit-linkleri.jpg",
    features: [
      "Şubeye özel link oluşturma",
      "Kayıt olanları Başvurular'da görme",
      "Başvuruyu tek tıkla öğrenciye dönüştürme",
      "Linkin aktif/pasif durumunu kontrol",
      "Branş bazlı kategori seçimi",
      "Form üzerinden kolay veri toplama",
    ],
  },
  {
    icon: Wallet,
    title: "Kapsamlı Finans Yönetimi",
    description: "Sadece aidat takibi değil; genel muhasebe ve öğrenci aidatları dahil tüm kasanız kontrolünüz altında.",
    image: "/features/kapsamli-finans-yonetimi.jpg",
    features: [
      "Toplu veya bireysel aidat oluşturma",
      "Gelir ve gider kalemi ekleme",
      "Nakit, Kredi Kartı veya Havale seçimi",
      "Geçmiş ödemeler ve dekont görüntüleme",
      "Kasa ve anlık durum takibi",
      "Geciken aidatların listelenmesi",
    ],
  },
  {
    icon: ClipboardCheck,
    title: "Akıllı Yoklama Modülü",
    description: "Eğitmenleriniz tablet veya telefondan saniyeler içinde yoklama alabilir, devamlılık analizlerini anında görüntüleyin.",
    image: "/features/akilli-yoklama-modulu.jpg",
    features: [
      "Grup ve tarih bazlı hızlı filtreleme",
      "Saniyeler içinde mobil uyumlu yoklama",
      "Katıldı / Katılmadı olarak işaretleme",
      "Öğrenci bazlı devamlılık yüzdesi",
      "Geçmiş yoklama kayıtlarına kolay erişim",
      "Eğitmene özel yetkilendirilmiş ekran",
    ],
  },
  {
    icon: Building2,
    title: "Çoklu Şube Merkezi",
    description: "Farklı lokasyonlardaki şubelerinizi tek bir arayüzden yönetin. Rol bazlı yetkilendirme ile her şubeye kendi yöneticisini atayın.",
    image: "/features/coklu-sube-merkezi.png",
    features: [
      "Birden fazla şube tanımlama",
      "Şubeler arası anında hızlı geçiş",
      "Merkez vs Alt Şube hiyerarşisi (Ana Şube)",
      "Şube bazlı izole öğrenci listesi",
      "Şubeye özel eğitmen ve personel",
      "Her şubenin ayrı ayrı yönetimi",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Mağaza & Ürün Satışı",
    description: "Kulübünüze ait forma, çanta ve antrenman ekipmanlarının stok ve ürün satışını dijital ortama taşıyarak gelirinizi artırın.",
    image: "/features/magaza-urun-satisi.jpg",
    features: [
      "Kategori bazlı ürün ekleme",
      "Stok miktarı belirleme",
      "Öğrenciye ürün siparişi girme",
      "Ödeme durumunu takip etme",
      "Sipariş ve satış geçmişini izleme",
      "Forma, top, çanta vb. demirbaş yönetimi",
    ],
  },
  {
    icon: Bell,
    title: "Gerçek Zamanlı Bildirimler",
    description: "Onaylanan başvurular, yeni ödemeler veya önemli sistem duyurularını okunmazsa bile kaçırmayacağınız akıllı gelen kutusu.",
    image: "/features/gecek-zamanli-bildirimler.jpg",
    features: [
      "Uygulama içi (In-App) bildirimler",
      "Anlık (Real-time) güncellemeler",
      "Okunmayan bildirim sayısı gösterimi",
      "Kullanıcıya özel gelen kutusu (Novu)",
      "Geçmiş bildirimleri arşivleme",
      "Bildirimleri tek tıkla okundu işaretleme",
    ],
  },
  {
    icon: Calendar,
    title: "Dinamik Antrenman Takvimi",
    description: "Antrenman programlarınızı sistemde planlayın, tüm eğitmenleriniz ne zaman nerede ders vereceğini takvimi üzerinden görsün.",
    image: "/features/dinamik-antreman-takvimi.jpg",
    features: [
      "Aylık ve haftalık takvim tablosu",
      "Antrenman saati ve günü planlama",
      "İlgili grup ve eğitmen eşleştirmesi",
      "Antrenmanın yapılacağı tesisin/sahanın seçimi",
      "Günlük ve haftalık özeti alma",
      "İptal, güncelleme ve kolay yönetim",
    ],
  },
  {
    icon: BarChart3,
    title: "Gelişmiş Raporlama & Dashboard",
    description: "Gelir-gider analizlerinden, aktif öğrenci sayılarına kadar işletmenizin tam fotoğrafını gösteren özet grafikler.",
    image: "/features/gelismis-raporlama.jpg",
    features: [
      "Ana sayfa (Dashboard) vizyon kartları",
      "Gelir ve gider çubuk grafikleri",
      "Aktif vs Pasif öğrenci sayıları",
      "Takımdaki toplam grup sayısı",
      "Güncel bekleyen kayıt başvuruları",
      "Tek ekranda tam şirket özeti",
    ],
  },
]

const additionalFeatures = [
  { icon: Shield, title: "Web Sitesi Modülü", description: "Kendinize ait mini bir web sitesi veya portal oluşturarak velilere sunun." },
  { icon: Map, title: "Saha & Tesis Yönetimi", description: "Halı saha veya salonlarınız için saatlik rezervasyonlar alın ve takip edin." },
  { icon: Smartphone, title: "Mobil Uyumlu Arayüz", description: "Tablet ve telefonlardan sıfır sıkıntıyla uygulamayı tam ekran kullanın." },
  { icon: FileText, title: "Abonelik ve Paketler", description: "Özel ders veya grup seansları için farklı abonelik paketleri tanımlayın." },
  { icon: Zap, title: "Spor Branşları", description: "Basketbol, Yüzme, Jimnastik vb. sistemde istediğiniz branşı yönetin." },
  { icon: Check, title: "Eğitmen Yönetimi", description: "Tüm antrenörlerin görevlerini ve bağlı oldukları grupları sisteme girin." },
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
                      src={feature.image}
                      alt={feature.title}
                      className="rounded-lg w-full shadow-lg border border-slate-700 hover:border-slate-600 transition-colors"
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
