"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  ImageIcon,
  Type,
  Settings,
  Eye,
  Save,
  ExternalLink,
  Upload,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUploader from "@/components/media/image-uploader";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tenant, WebsitePage } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface WebsiteClientProps {
  tenant: Tenant;
  homePage: WebsitePage | null;
  aboutPage: WebsitePage | null;
  contactPage: WebsitePage | null;
  branchesPage: WebsitePage | null;
}

export default function WebsiteClient({
  tenant: initialTenant,
  homePage,
  aboutPage,
  contactPage,
  branchesPage,
}: WebsiteClientProps) {
  const [tenant, setTenant] = useState(initialTenant);
  const [galleryImages, setGalleryImages] = useState<string[]>(
    Array.isArray(initialTenant.galleryImages)
      ? (initialTenant.galleryImages || []).slice(0, 8)
      : []
  );
  const [saved, setSaved] = useState(false);
  const supabase = createClient();
  const [savingTenant, setSavingTenant] = useState(false);
  const [heroTitle, setHeroTitle] = useState(
    homePage?.title || initialTenant.name
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    homePage?.metaDescription || "Profesyonel spor eğitimi."
  );
  const [aboutTitle, setAboutTitle] = useState(
    aboutPage?.title || "Hakkımızda"
  );
  const [aboutContent, setAboutContent] = useState(
    aboutPage?.content || "Akademimiz hakkında bilgi."
  );
  const [branchesTitle, setBranchesTitle] = useState(
    branchesPage?.title || "Branşlarımız"
  );
  const [branchesContent, setBranchesContent] = useState(() => {
    try {
      const obj = branchesPage?.content ? JSON.parse(branchesPage.content) : {};
      const desc = (obj as any)?.description;
      return typeof desc === "string" && desc.trim().length > 0
        ? desc
        : "Branş açıklaması";
    } catch {
      return "Branş açıklaması";
    }
  });
  const branchesDefaults = (() => {
    try {
      const obj = branchesPage?.content ? JSON.parse(branchesPage.content) : {};
      const list = Array.isArray((obj as any)?.cards) ? (obj as any).cards : [];
      return (list as any[]).slice(0, 4).map((c) => ({
        title: typeof c?.title === "string" ? c.title : "",
        description: typeof c?.description === "string" ? c.description : "",
        image: typeof c?.image === "string" ? c.image : "",
      }));
    } catch {
      return [] as { title: string; description: string; image: string }[];
    }
  })();
  const [branchCards, setBranchCards] =
    useState<{ title: string; description: string; image: string }[]>(
      branchesDefaults
    );
  const [contactTitle, setContactTitle] = useState(
    contactPage?.title || "İletişim"
  );
  const contactInitialContent = (() => {
    try {
      const obj = contactPage?.content ? JSON.parse(contactPage.content) : null;
      const d =
        obj && typeof (obj as any).description === "string"
          ? (obj as any).description
          : null;
      return d ?? (contactPage?.content || "Bize ulaşın");
    } catch {
      return contactPage?.content || "Bize ulaşın";
    }
  })();
  const [contactContent, setContactContent] = useState(contactInitialContent);
  const contactDefaults = (() => {
    try {
      const obj = contactPage?.content ? JSON.parse(contactPage.content) : {};
      const social = (obj as any)?.social || {};
      const coords = (obj as any)?.coordinates || {};
      const info = (obj as any)?.contactInfo || {};
      return {
        mapLocation:
          typeof (obj as any)?.mapLocation === "string"
            ? (obj as any).mapLocation
            : initialTenant.address || "",
        instagramUrl:
          typeof social?.instagram?.url === "string"
            ? social.instagram.url
            : "",
        instagramActive: !!social?.instagram?.active,
        facebookUrl:
          typeof social?.facebook?.url === "string" ? social.facebook.url : "",
        facebookActive: !!social?.facebook?.active,
        twitterUrl:
          typeof social?.twitter?.url === "string" ? social.twitter.url : "",
        twitterActive: !!social?.twitter?.active,
        lat: typeof coords?.lat === "number" ? coords.lat : undefined,
        lng: typeof coords?.lng === "number" ? coords.lng : undefined,
        zoom: typeof coords?.zoom === "number" ? coords.zoom : 16,
        phone:
          typeof info?.phone === "string" && info.phone.trim().length > 0
            ? info.phone
            : initialTenant.phone || "",
        email:
          typeof info?.email === "string" && info.email.trim().length > 0
            ? info.email
            : initialTenant.email || "",
        address:
          typeof info?.address === "string" && info.address.trim().length > 0
            ? info.address
            : initialTenant.address || "",
      };
    } catch {
      return {
        mapLocation: initialTenant.address || "",
        instagramUrl: "",
        instagramActive: false,
        facebookUrl: "",
        facebookActive: false,
        twitterUrl: "",
        twitterActive: false,
        lat: undefined,
        lng: undefined,
        zoom: 16,
        phone: initialTenant.phone || "",
        email: initialTenant.email || "",
        address: initialTenant.address || "",
      };
    }
  })();
  const [contactMapLocation, setContactMapLocation] = useState<string>(
    contactDefaults.mapLocation
  );
  const [instagramUrl, setInstagramUrl] = useState<string>(
    contactDefaults.instagramUrl
  );
  const [instagramActive, setInstagramActive] = useState<boolean>(
    contactDefaults.instagramActive
  );
  const [facebookUrl, setFacebookUrl] = useState<string>(
    contactDefaults.facebookUrl
  );
  const [facebookActive, setFacebookActive] = useState<boolean>(
    contactDefaults.facebookActive
  );
  const [twitterUrl, setTwitterUrl] = useState<string>(
    contactDefaults.twitterUrl
  );
  const [twitterActive, setTwitterActive] = useState<boolean>(
    contactDefaults.twitterActive
  );
  const [contactPhone, setContactPhone] = useState<string>(
    contactDefaults.phone
  );
  const [contactEmail, setContactEmail] = useState<string>(
    contactDefaults.email
  );
  const [contactAddress, setContactAddress] = useState<string>(
    contactDefaults.address
  );
  const [contactLat, setContactLat] = useState<number | null>(
    contactDefaults.lat ?? null
  );
  const [contactLng, setContactLng] = useState<number | null>(
    contactDefaults.lng ?? null
  );
  const [contactLatStr, setContactLatStr] = useState<string>(
    contactDefaults.lat != null ? String(contactDefaults.lat) : ""
  );
  const [contactLngStr, setContactLngStr] = useState<string>(
    contactDefaults.lng != null ? String(contactDefaults.lng) : ""
  );
  const [contactZoom, setContactZoom] = useState<number>(
    contactDefaults.zoom ?? 16
  );
  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState<any[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  const [savingBranches, setSavingBranches] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [hasWebsiteFeature, setHasWebsiteFeature] = useState(true);
  const [hasCustomDomainFeature, setHasCustomDomainFeature] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tenant_subscriptions")
        .select("status, plan:platform_plans(features)")
        .eq("tenant_id", tenant.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      const features = (data as any)?.plan?.features || [];
      const arr = Array.isArray(features) ? features : [];
      setHasWebsiteFeature(arr.length ? arr.includes("website") : true);
      setHasCustomDomainFeature(
        arr.length ? arr.includes("custom_domain") : true
      );
    })();
  }, [tenant.id]);

  const heroDefaults = (() => {
    try {
      const obj = homePage?.content ? JSON.parse(homePage.content) : {};
      const s = obj?.heroStats || {};
      return {
        students: typeof s?.students === "number" ? s.students : 500,
        instructors: typeof s?.instructors === "number" ? s.instructors : 25,
        experienceYears:
          typeof s?.experienceYears === "number" ? s.experienceYears : 15,
        championships:
          typeof s?.championships === "number" ? s.championships : 50,
      };
    } catch {
      return {
        students: 500,
        instructors: 25,
        experienceYears: 15,
        championships: 50,
      };
    }
  })();

  const [heroStudents, setHeroStudents] = useState<number>(
    heroDefaults.students
  );
  const [heroInstructors, setHeroInstructors] = useState<number>(
    heroDefaults.instructors
  );
  const [heroExperienceYears, setHeroExperienceYears] = useState<number>(
    heroDefaults.experienceYears
  );
  const [heroChampionships, setHeroChampionships] = useState<number>(
    heroDefaults.championships
  );

  const handleSave = async () => {
    setSavingTenant(true);
    const payload: Record<string, any> = {
      slug: tenant.slug,
      name: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      logo_url: tenant.logoUrl || null,
      primary_color: tenant.primaryColor,
      secondary_color: tenant.secondaryColor,
      website_enabled: tenant.websiteEnabled,
      website_domain: tenant.websiteDomain,
    };
    payload.address = tenant.address || null;
    const { error } = await supabase
      .from("tenants")
      .update(payload)
      .eq("id", tenant.id);
    if (error) {
      const msg = String((error as any)?.message || "").toLowerCase();
      const code = (error as any)?.code || "";
      if (
        code === "PGRST204" ||
        msg.includes("address") ||
        msg.includes("column")
      ) {
        const { error: err2 } = await supabase
          .from("tenants")
          .update({
            slug: tenant.slug,
            name: tenant.name,
            phone: tenant.phone,
            email: tenant.email,
            logo_url: tenant.logoUrl || null,
            primary_color: tenant.primaryColor,
            secondary_color: tenant.secondaryColor,
            website_enabled: tenant.websiteEnabled,
            website_domain: tenant.websiteDomain,
          })
          .eq("id", tenant.id);
        if (!err2) {
          toast.info("Adres sütunu eksik; diğer ayarlar kaydedildi");
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          setSavingTenant(false);
          return;
        }
      }
      toast.error("Ayarlar kaydedilemedi");
      setSavingTenant(false);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSavingTenant(false);
  };

  const savePage = async (
    slug: string,
    fields: {
      title?: string;
      content?: string | null;
      meta_title?: string | null;
      meta_description?: string | null;
      is_published?: boolean;
    }
  ) => {
    const payload = {
      tenant_id: tenant.id,
      slug,
      title: fields.title ?? slug,
      content: fields.content ?? null,
      meta_title: fields.meta_title ?? null,
      meta_description: fields.meta_description ?? null,
      is_published: fields.is_published ?? true,
    };
    const { error } = await supabase
      .from("website_pages")
      .upsert(payload, { onConflict: "tenant_id,slug" });
    if (error) {
      toast.error("İçerik kaydedilemedi");
      return false;
    }
    toast.success("İçerik kaydedildi");
    return true;
  };

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Web Sitesi Ayarları
          </h1>
          <p className="text-sm text-muted-foreground">
            Akademinizin web sitesini özelleştirin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent"
            onClick={() => {
              try {
                const siteUrl =
                  tenant.websiteDomain && tenant.websiteDomain.trim().length > 0
                    ? tenant.websiteDomain
                    : `/site/${tenant.slug}`;
                const openUrl = siteUrl.startsWith("http")
                  ? siteUrl
                  : siteUrl.startsWith("/site/")
                  ? `${window.location.origin}${siteUrl}`
                  : `http://${siteUrl}`;
                window.open(openUrl, "_blank");
              } catch {}
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Önizle</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasWebsiteFeature || savingTenant}
          >
            {savingTenant ? (
              <Spinner className="mr-2" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {savingTenant ? "Kaydediliyor" : saved ? "Kaydedildi" : "Kaydet"}
          </Button>
        </div>
      </div>

      {!hasWebsiteFeature && (
        <Card className="bg-amber-900/20 border-amber-700">
          <CardContent className="p-4 text-amber-200">
            Paketiniz bu özelliği desteklemiyor. Web sitesi yönetimi için üst
            pakete geçin.
          </CardContent>
        </Card>
      )}

      {/* Web Sitesi Kartı (Ayarlar sayfasından) */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Web Sitesi
          </CardTitle>
          <CardDescription>Web sitesi ve alan adı ayarları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Web Sitesi Aktif</Label>
              <p className="text-xs text-muted-foreground">
                Herkese açık web sitenizi yayınlayın
              </p>
            </div>
            <Switch
              checked={tenant.websiteEnabled}
              onCheckedChange={(checked) =>
                setTenant((prev) => ({ ...prev, websiteEnabled: checked }))
              }
              disabled={!hasWebsiteFeature}
            />
          </div>
          <div
            className="border-border/50"
            style={{ height: 1, backgroundColor: "var(--border)" }}
          />
          <div className="space-y-2">
            <Label>Site Adresi</Label>
            <div className="flex items-center gap-2">
              {(() => {
                const siteUrl =
                  tenant.websiteDomain && tenant.websiteDomain.trim().length > 0
                    ? tenant.websiteDomain
                    : `/site/${tenant.slug}`;
                return (
                  <>
                    <Input
                      value={siteUrl}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                      onClick={() => {
                        try {
                          const openUrl = (() => {
                            if (siteUrl.startsWith("http")) return siteUrl;
                            if (siteUrl.startsWith("/site/")) {
                              return `${window.location.origin}${siteUrl}`;
                            }
                            return `http://${siteUrl}`;
                          })();
                          window.open(openUrl, "_blank");
                        } catch {}
                      }}
                    >
                      Aç
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Site Slug</Label>
            <Input
              value={tenant.slug}
              onChange={(e) => {
                const v = e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "")
                  .replace(/-+/g, "-")
                  .replace(/^-+|-+$/g, "")
                  .slice(0, 64);
                setTenant((prev) => ({ ...prev, slug: v }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Özel Domain</Label>
            <Input
              placeholder="www.ornek.com"
              value={tenant.websiteDomain || ""}
              onChange={(e) =>
                setTenant((prev) => ({
                  ...prev,
                  websiteDomain: e.target.value,
                }))
              }
              disabled={!hasCustomDomainFeature}
            />
            <p className="text-xs text-muted-foreground">
              Özel domain sadece ilgili pakette sunulur
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-card/50">
          <TabsTrigger value="general" className="text-xs py-2">
            <Settings className="h-4 w-4 mr-1 hidden sm:block" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs py-2">
            <Type className="h-4 w-4 mr-1 hidden sm:block" />
            İçerik
          </TabsTrigger>
          <TabsTrigger value="media" className="text-xs py-2">
            <ImageIcon className="h-4 w-4 mr-1 hidden sm:block" />
            Medya
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Akademi Adı</Label>
                <Input
                  value={tenant.name}
                  onChange={(e) =>
                    setTenant((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Slogan</Label>
                <Input defaultValue="Geleceğin Şampiyonlarını Yetiştiriyoruz" />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  defaultValue="Spor okulumuzda profesyonel eğitmenler eşliğinde geleceğin sporcularını yetiştiriyoruz."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hero Bölümü</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Alt Başlık</Label>
                <Textarea
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Öğrenci Sayısı</Label>
                  <Input
                    type="number"
                    value={heroStudents}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setHeroStudents(Number.isFinite(n) ? Math.max(0, n) : 0);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eğitmen Sayısı</Label>
                  <Input
                    type="number"
                    value={heroInstructors}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setHeroInstructors(
                        Number.isFinite(n) ? Math.max(0, n) : 0
                      );
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yıllık Deneyim</Label>
                  <Input
                    type="number"
                    value={heroExperienceYears}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setHeroExperienceYears(
                        Number.isFinite(n) ? Math.max(0, n) : 0
                      );
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Şampiyonluk</Label>
                  <Input
                    type="number"
                    value={heroChampionships}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setHeroChampionships(
                        Number.isFinite(n) ? Math.max(0, n) : 0
                      );
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  disabled={savingHero}
                  onClick={async () => {
                    setSavingHero(true);
                    const content = JSON.stringify({
                      heroStats: {
                        students: heroStudents,
                        instructors: heroInstructors,
                        experienceYears: heroExperienceYears,
                        championships: heroChampionships,
                      },
                    });
                    await savePage("home", {
                      title: heroTitle,
                      meta_description: heroSubtitle,
                      content,
                      is_published: true,
                    });
                    setSavingHero(false);
                  }}
                >
                  {savingHero ? <Spinner className="mr-2" /> : null}
                  {savingHero ? "Kaydediliyor" : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hakkımızda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>İçerik</Label>
                <Textarea
                  value={aboutContent}
                  onChange={(e) => setAboutContent(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  disabled={savingAbout}
                  onClick={async () => {
                    setSavingAbout(true);
                    await savePage("hakkimizda", {
                      title: aboutTitle,
                      content: aboutContent,
                      is_published: true,
                    });
                    setSavingAbout(false);
                  }}
                >
                  {savingAbout ? <Spinner className="mr-2" /> : null}
                  {savingAbout ? "Kaydediliyor" : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Branşlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={branchesTitle}
                  onChange={(e) => setBranchesTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={branchesContent}
                  onChange={(e) => setBranchesContent(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Branş Kartları (max 4)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={branchCards.length >= 4}
                    onClick={() => {
                      if (branchCards.length >= 4) return;
                      setBranchCards((prev) => [
                        ...prev,
                        { title: "", description: "", image: "" },
                      ]);
                    }}
                  >
                    Yeni Kart Ekle
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branchCards.map((card, idx) => (
                    <Card key={idx} className="bg-card/40 border-border/50">
                      <CardContent className="pt-4 space-y-3">
                        <div className="space-y-2">
                          <Label>Görsel</Label>
                          <ImageUploader
                            value={card.image}
                            tenantId={tenant.id}
                            folder="branch-cards"
                            onChange={(url) => {
                              setBranchCards((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], image: url };
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Başlık</Label>
                          <Input
                            value={card.title}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBranchCards((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], title: v };
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Açıklama</Label>
                          <Textarea
                            rows={3}
                            value={card.description}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBranchCards((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], description: v };
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setBranchCards((prev) =>
                                prev.filter((_, i) => i !== idx)
                              );
                            }}
                          >
                            Sil
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  disabled={savingBranches}
                  onClick={async () => {
                    setSavingBranches(true);
                    const content = JSON.stringify({
                      description: branchesContent,
                      cards: branchCards,
                    });
                    await savePage("branslar", {
                      title: branchesTitle,
                      content,
                      is_published: true,
                    });
                    setSavingBranches(false);
                  }}
                >
                  {savingBranches ? <Spinner className="mr-2" /> : null}
                  {savingBranches ? "Kaydediliyor" : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">İletişim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={contactContent}
                  onChange={(e) => setContactContent(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Harita Konumu</Label>
                <Input
                  placeholder="Adres veya konum"
                  value={contactMapLocation}
                  onChange={(e) => setContactMapLocation(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>İletişim Bilgileri</Label>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    placeholder="Telefon"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input
                    type="email"
                    placeholder="E-posta"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Textarea
                    placeholder="Adres"
                    rows={2}
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Koordinatlar (Lat/Lng) ve Yakınlık</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Enlem (lat)"
                    inputMode="decimal"
                    pattern="[0-9.,-]*"
                    value={contactLatStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setContactLatStr(v);
                      const n = parseFloat(v.replace(",", "."));
                      setContactLat(Number.isFinite(n) ? n : null);
                    }}
                  />
                  <Input
                    placeholder="Boylam (lng)"
                    inputMode="decimal"
                    pattern="[0-9.,-]*"
                    value={contactLngStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setContactLngStr(v);
                      const n = parseFloat(v.replace(",", "."));
                      setContactLng(Number.isFinite(n) ? n : null);
                    }}
                  />
                  <Input
                    placeholder="Yakınlık (zoom)"
                    value={String(contactZoom)}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setContactZoom(
                        Number.isFinite(n) ? Math.max(1, Math.min(20, n)) : 16
                      );
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Haritada Ara ve Seç</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Örn: Şişli, İstanbul veya spor salonu adı"
                    value={geoQuery}
                    onChange={(e) => setGeoQuery(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!geoQuery.trim()) return;
                      setGeoLoading(true);
                      setGeoResults([]);
                      try {
                        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                          geoQuery.trim()
                        )}&format=json&limit=5`;
                        const res = await fetch(url);
                        const json = await res.json();
                        setGeoResults(Array.isArray(json) ? json : []);
                      } catch {
                        setGeoResults([]);
                      }
                      setGeoLoading(false);
                    }}
                  >
                    {geoLoading ? <Spinner className="mr-2" /> : null}
                    {geoLoading ? "Aranıyor" : "Ara"}
                  </Button>
                </div>
                {geoResults.length > 0 ? (
                  <div className="border rounded-md p-2 space-y-2">
                    {geoResults.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left p-2 rounded-md hover:bg-muted"
                        onClick={() => {
                          const lat = Number(r.lat);
                          const lng = Number(r.lon);
                          if (Number.isFinite(lat) && Number.isFinite(lng)) {
                            setContactLat(lat);
                            setContactLng(lng);
                            setContactZoom(16);
                            setContactMapLocation(
                              r.display_name || contactMapLocation
                            );
                            toast.success("Konum seçildi");
                          }
                        }}
                      >
                        <div className="text-sm font-medium">
                          {r.display_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          lat: {r.lat}, lng: {r.lon}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Harita Önizleme</Label>
                <div className="rounded-md overflow-hidden h-[240px] bg-muted">
                  {contactLat != null && contactLng != null ? (
                    <iframe
                      title="Harita"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        `${contactLat},${contactLng}`
                      )}&z=${encodeURIComponent(
                        String(contactZoom)
                      )}&output=embed`}
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
              </div>
              <div className="space-y-3">
                <Label>Sosyal Medya</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Instagram</span>
                      <Switch
                        checked={instagramActive}
                        onCheckedChange={setInstagramActive}
                      />
                    </div>
                    <Input
                      placeholder="https://instagram.com/hesap"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Facebook</span>
                      <Switch
                        checked={facebookActive}
                        onCheckedChange={setFacebookActive}
                      />
                    </div>
                    <Input
                      placeholder="https://facebook.com/sayfa"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Twitter/X</span>
                      <Switch
                        checked={twitterActive}
                        onCheckedChange={setTwitterActive}
                      />
                    </div>
                    <Input
                      placeholder="https://x.com/hesap"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  disabled={savingContact}
                  onClick={async () => {
                    setSavingContact(true);
                    const content = JSON.stringify({
                      description: contactContent,
                      mapLocation: contactMapLocation,
                      coordinates:
                        contactLat != null && contactLng != null
                          ? {
                              lat: contactLat,
                              lng: contactLng,
                              zoom: contactZoom,
                            }
                          : undefined,
                      contactInfo: {
                        phone: contactPhone,
                        email: contactEmail,
                        address: contactAddress,
                      },
                      social: {
                        instagram: {
                          url: instagramUrl,
                          active: instagramActive,
                        },
                        facebook: { url: facebookUrl, active: facebookActive },
                        twitter: { url: twitterUrl, active: twitterActive },
                      },
                    });
                    await savePage("iletisim", {
                      title: contactTitle,
                      content,
                      is_published: true,
                    });
                    setSavingContact(false);
                  }}
                >
                  {savingContact ? <Spinner className="mr-2" /> : null}
                  {savingContact ? "Kaydediliyor" : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Settings */}
        <TabsContent value="media" className="space-y-4 mt-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <img
                    src={tenant.logoUrl || "/placeholder.svg"}
                    alt="Logo"
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                </div>
                <div>
                  <ImageUploader
                    value={tenant.logoUrl || ""}
                    tenantId={tenant.id}
                    folder="logos"
                    onChange={(url) =>
                      setTenant((prev) => ({ ...prev, logoUrl: url }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Galeri (max 8)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="space-y-2">
                    <ImageUploader
                      value={galleryImages[idx] || ""}
                      tenantId={tenant.id}
                      folder="website/gallery"
                      onChange={(url) => {
                        setGalleryImages((prev) => {
                          const next = [...prev];
                          next[idx] = url;
                          return next.slice(0, 8);
                        });
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGalleryImages((prev) => {
                            const next = [...prev];
                            next[idx] = "";
                            return next.slice(0, 8);
                          });
                        }}
                      >
                        Kaldır
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const imgs = (galleryImages || [])
                      .filter(
                        (u) => typeof u === "string" && u.trim().length > 0
                      )
                      .slice(0, 8);
                    const { error } = await supabase
                      .from("tenants")
                      .update({ gallery_images: imgs })
                      .eq("id", tenant.id);
                    if (error) {
                      toast.error("Galeri kaydedilemedi");
                      return;
                    }
                    setTenant((prev) => ({ ...prev, galleryImages: imgs }));
                    toast.success("Galeri kaydedildi");
                  }}
                >
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
