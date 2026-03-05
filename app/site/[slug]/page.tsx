import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Star,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicWebsiteData } from "@/lib/api/public-website";
import DirectionsButton from "@/components/site/directions-button";
import parse from "html-react-parser";

export default async function TenantWebsite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant, homePage, aboutPage, contactPage, branchesPage } =
    await getPublicWebsiteData(slug);
  const contactCfg = (() => {
    try {
      return contactPage?.content ? JSON.parse(contactPage.content) : {};
    } catch {
      return {};
    }
  })();
  const contactMapLocation =
    (contactCfg as any)?.mapLocation || tenant.address || "";
  const coords = (contactCfg as any)?.coordinates || {};
  const hasCoords =
    typeof coords?.lat === "number" && typeof coords?.lng === "number";
  const coordZoom = typeof coords?.zoom === "number" ? coords.zoom : 16;
  const social = (contactCfg as any)?.social || {};
  const instagram = social?.instagram || {};
  const facebook = social?.facebook || {};
  const twitter = social?.twitter || {};
  const contactInfo = (contactCfg as any)?.contactInfo || {};
  const phone =
    typeof contactInfo?.phone === "string" &&
    contactInfo.phone.trim().length > 0
      ? contactInfo.phone
      : tenant.phone || "";
  const email =
    typeof contactInfo?.email === "string" &&
    contactInfo.email.trim().length > 0
      ? contactInfo.email
      : tenant.email || "";
  const address =
    typeof contactInfo?.address === "string" &&
    contactInfo.address.trim().length > 0
      ? contactInfo.address
      : tenant.address || "";
  const contactDescription =
    typeof (contactCfg as any)?.description === "string" &&
    (contactCfg as any).description.trim().length > 0
      ? (contactCfg as any).description
      : null;
  if (!tenant.websiteEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-card/50">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Site yayında değil</h2>
            <p className="text-muted-foreground mb-6">
              Bu kurum için web sitesi şu an devre dışı.
            </p>
            <Button asChild>
              <Link href="/">Ana sayfaya dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        ...(tenant.primaryColor
          ? ({ ["--primary" as any]: tenant.primaryColor } as any)
          : {}),
        ...(tenant.secondaryColor
          ? ({ ["--secondary" as any]: tenant.secondaryColor } as any)
          : {}),
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={tenant.logoUrl || "/placeholder.svg"}
              alt={tenant.name}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
            <span className="font-bold text-lg truncate hidden sm:block">
              {tenant.name}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#hakkimizda"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {aboutPage?.title || "Hakkımızda"}
            </Link>
            <Link
              href="#branslar"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {branchesPage?.title || "Branşlar"}
            </Link>
            <Link
              href="#galeri"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {"Galeri"}
            </Link>
            <Link
              href="#magaza"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {"Mağaza"}
            </Link>
            <Link
              href="#iletisim"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {contactPage?.title || "İletişim"}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/site/${slug}/login`}>Öğrenci Girişi</Link>
            </Button>
            <Button asChild>
              <Link href={`/site/${slug}/kayit`}>Kayıt Ol</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(/modern-sports-academy-hero.jpg)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl">
            <Badge className="mb-4 bg-primary/10 text-primary border-0">
              15 Yıllık Tecrübe
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {homePage?.title || tenant.name}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {homePage?.metaDescription ||
                "Spor branşlarında profesyonel eğitim ve güçlü altyapı"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={`/site/${slug}/kayit`}>
                  Hemen Kayıt Ol
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#branslar">Branşları İncele</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(() => {
              let stats: Array<{ label: string; value: string }>;
              try {
                const obj = homePage?.content
                  ? JSON.parse(homePage.content)
                  : {};
                const s = obj?.heroStats || {};
                const st = {
                  students: s?.students as number | undefined,
                  instructors: s?.instructors as number | undefined,
                  experienceYears: s?.experienceYears as number | undefined,
                  championships: s?.championships as number | undefined,
                };
                stats = [
                  {
                    label: "Öğrenci",
                    value: st.students != null ? String(st.students) : "500+",
                  },
                  {
                    label: "Eğitmen",
                    value:
                      st.instructors != null ? String(st.instructors) : "25",
                  },
                  {
                    label: "Yıllık Deneyim",
                    value:
                      st.experienceYears != null
                        ? String(st.experienceYears)
                        : "15",
                  },
                  {
                    label: "Şampiyonluk",
                    value:
                      st.championships != null
                        ? String(st.championships)
                        : "50+",
                  },
                ];
              } catch {
                stats = [
                  { label: "Öğrenci", value: "500+" },
                  { label: "Eğitmen", value: "25" },
                  { label: "Yıllık Deneyim", value: "15" },
                  { label: "Şampiyonluk", value: "50+" },
                ];
              }
              return stats;
            })().map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="hakkimizda" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-3">
              {aboutPage?.title || "Hakkımızda"}
            </h2>
            {aboutPage?.content ? (
              <div className="text-muted-foreground">
                {parse(aboutPage.content)}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {"Akademimiz hakkında bilgiler burada yer alır."}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Sports/Branches Section */}
      <section id="branslar" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              {branchesPage?.title || "Branşlarımız"}
            </h2>
            {(() => {
              try {
                const obj = branchesPage?.content
                  ? JSON.parse(branchesPage.content)
                  : {};
                let desc = (obj as any)?.description;
                if (
                  typeof desc === "string" &&
                  desc.trim().startsWith("{") &&
                  desc.includes("cards")
                ) {
                  try {
                    const inner = JSON.parse(desc);
                    if (inner && typeof inner?.description === "string") {
                      desc = inner.description;
                    }
                  } catch {}
                }
                const text =
                  typeof desc === "string" && desc.trim().length > 0
                    ? desc
                    : "Profesyonel eğitmenlerimiz eşliğinde farklı branşlarda eğitim alabilirsiniz";
                return (
                  <div className="text-muted-foreground max-w-2xl mx-auto">
                    {parse(text)}
                  </div>
                );
              } catch {
                return (
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    {
                      "Profesyonel eğitmenlerimiz eşliğinde farklı branşlarda eğitim alabilirsiniz"
                    }
                  </p>
                );
              }
            })()}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              try {
                const obj = branchesPage?.content
                  ? JSON.parse(branchesPage.content)
                  : {};
                const cards = Array.isArray((obj as any)?.cards)
                  ? (obj as any).cards
                  : [];
                const list = (cards as any[]).slice(0, 4).map((c) => ({
                  title: typeof c?.title === "string" ? c.title : "",
                  image:
                    typeof c?.image === "string" ? c.image : "/placeholder.svg",
                  description:
                    typeof c?.description === "string" ? c.description : "",
                }));
                const fallback = [
                  {
                    title: "Basketbol",
                    image: "/basketball-action.jpg",
                    description: "U10, U12, U14, U16 yaş grupları",
                  },
                  {
                    title: "Yüzme",
                    image: "/swimming-action.jpg",
                    description: "Başlangıç ve ileri seviye",
                  },
                  {
                    title: "Futbol",
                    image: "/soccer-action.jpg",
                    description: "Tüm yaş grupları",
                  },
                  {
                    title: "Tenis",
                    image: "/tennis-action.jpg",
                    description: "Bireysel ve grup dersleri",
                  },
                ];
                return (list.length > 0 ? list : fallback).map((sport, i) => (
                  <Card
                    key={`${sport.title}-${i}`}
                    className="overflow-hidden group cursor-pointer bg-card/50 border-border/50"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={sport.image || "/placeholder.svg"}
                        alt={sport.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <h3 className="font-bold text-lg">{sport.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sport.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ));
              } catch {
                const fallback = [
                  {
                    title: "Basketbol",
                    image: "/basketball-action.jpg",
                    description: "U10, U12, U14, U16 yaş grupları",
                  },
                  {
                    title: "Yüzme",
                    image: "/swimming-action.jpg",
                    description: "Başlangıç ve ileri seviye",
                  },
                  {
                    title: "Futbol",
                    image: "/soccer-action.jpg",
                    description: "Tüm yaş grupları",
                  },
                  {
                    title: "Tenis",
                    image: "/tennis-action.jpg",
                    description: "Bireysel ve grup dersleri",
                  },
                ];
                return fallback.map((sport, i) => (
                  <Card
                    key={`${sport.title}-${i}`}
                    className="overflow-hidden group cursor-pointer bg-card/50 border-border/50"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={sport.image || "/placeholder.svg"}
                        alt={sport.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <h3 className="font-bold text-lg">{sport.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {sport.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ));
              }
            })()}
          </div>
        </div>
      </section>

      {Array.isArray(tenant.galleryImages) &&
      tenant.galleryImages.length > 0 ? (
        <section id="galeri" className="py-16 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Galeri</h2>
              <p className="text-muted-foreground">Akademimizden kareler</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tenant.galleryImages
                .slice(0, 8)
                .map((src: string, i: number) => (
                  <Card
                    key={`${src}-${i}`}
                    className="overflow-hidden bg-card/50 border-border/50"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={src || "/placeholder.svg"}
                        alt={`Galeri ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Shop Preview Section */}
      <section id="magaza" className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Mağaza</h2>
              <p className="text-muted-foreground">
                Spor malzemeleri ve akademi ürünleri
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/site/${slug}/magaza`}>
                Tümünü Gör
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                name: "Akademi Forma",
                price: 450,
                image: "/sports-team-jersey-blue.jpg",
              },
              {
                name: "Basketbol Topu",
                price: 350,
                image: "/orange-basketball-ball.jpg",
              },
              {
                name: "Yüzme Gözlüğü",
                price: 180,
                image: "/swimming-goggles-blue.jpg",
              },
              {
                name: "Spor Çanta",
                price: 280,
                image: "/sports-gym-bag-black.jpg",
              },
            ].map((product) => (
              <Card
                key={product.name}
                className="overflow-hidden bg-card/50 border-border/50"
              >
                <div className="aspect-square relative">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <p className="text-primary font-bold">₺{product.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Velilerimiz Ne Diyor?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Ayşe Yılmaz",
                text: "Çocuğum burada basketbol öğrendi ve şimdi il takımında oynuyor.",
                rating: 5,
              },
              {
                name: "Mehmet Kaya",
                text: "Profesyonel eğitmenler ve harika tesisler. Kesinlikle tavsiye ederim.",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "{testimonial.text}"
                  </p>
                  <p className="font-medium">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="iletisim" className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                {contactPage?.title || "İletişim"}
              </h2>
              {contactDescription ? (
                <div className="text-muted-foreground mb-4">
                  {parse(contactDescription)}
                </div>
              ) : null}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Adres</p>
                    <p className="text-muted-foreground">{address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Telefon</p>
                    <p className="text-muted-foreground">{phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">E-posta</p>
                    <p className="text-muted-foreground">{email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Çalışma Saatleri</p>
                    <p className="text-muted-foreground">
                      Hafta içi: 09:00 - 21:00, Hafta sonu: 10:00 - 18:00
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                {instagram?.active && instagram?.url ? (
                  <Button variant="outline" size="icon" asChild>
                    <a href={instagram.url} target="_blank" rel="noreferrer">
                      <Instagram className="h-5 w-5" />
                    </a>
                  </Button>
                ) : null}
                {facebook?.active && facebook?.url ? (
                  <Button variant="outline" size="icon" asChild>
                    <a href={facebook.url} target="_blank" rel="noreferrer">
                      <Facebook className="h-5 w-5" />
                    </a>
                  </Button>
                ) : null}
                {twitter?.active && twitter?.url ? (
                  <Button variant="outline" size="icon" asChild>
                    <a href={twitter.url} target="_blank" rel="noreferrer">
                      <Twitter className="h-5 w-5" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden h-[300px] bg-muted">
                {hasCoords ? (
                  <iframe
                    title="Harita"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      `${coords.lat},${coords.lng}`
                    )}&z=${encodeURIComponent(String(coordZoom))}&output=embed`}
                    className="w-full h-full"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : contactMapLocation ? (
                  <iframe
                    title="Harita"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      contactMapLocation
                    )}&output=embed`}
                    className="w-full h-full"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <DirectionsButton
                destination={
                  hasCoords ? `${coords.lat},${coords.lng}` : contactMapLocation
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 {tenant.name}. Tüm hakları saklıdır.</p>
          <p className="mt-1">
            <a href="https://sporakademi.com" className="hover:text-primary">
              Spor Akademi Yönetim Sistemi
            </a>{" "}
            tarafından desteklenmektedir.
          </p>
        </div>
      </footer>
    </div>
  );
}
