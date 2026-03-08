"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

export default function PublicRegistrationPage() {
  const { code } = useParams() as { code: string };
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<any | null>(null);
  const [tenant, setTenant] = useState<any | null>(null);

  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sportsData, setSportsData] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [form, setForm] = useState({
    fullName: "",
    birthDate: "",
    phone: "",
    email: "",
    guardianName: "",
    guardianPhone: "",
    message: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { data: rl, error: rlErr } = await supabase
        .from("registration_links")
        .select("*")
        .eq("code", code)
        .single();
      
      let linkData = rl;

      if (rlErr || !rl) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", code)
          .single();

        if (tenantData) {
          linkData = {
            id: `generic-${tenantData.id}`,
            tenant_id: tenantData.id,
            is_active: true,
            title: "Genel Kayıt Formu",
            expires_at: null,
            branch_id: null,
            group_id: null,
          };
        } else {
          setError("Kayıt linki bulunamadı");
          setLoading(false);
          return;
        }
      }

      const isExpired = linkData.expires_at
        ? new Date(linkData.expires_at) < new Date()
        : false;
      if (!linkData.is_active) {
        setError("Bu kayıt linki pasif durumda");
        setLink(linkData);
        setLoading(false);
        return;
      }
      if (isExpired) {
        setError("Bu kayıt linkinin süresi dolmuş");
        setLink(linkData);
        setLoading(false);
        return;
      }
      
      setLink(linkData);
      
      const { data: t } = await supabase
        .from("tenants")
        .select("id,name,slug,logo_url,primary_color,secondary_color")
        .eq("id", linkData.tenant_id)
        .single();
      setTenant(t);
      
      try {
        const { data: sports } = await supabase
          .from("sports")
          .select("id,name")
          .eq("tenant_id", linkData.tenant_id)
          .eq("is_active", true)
          .order("sort_order")
          .order("name");
        setSportsData(
          (sports || []).map((s: any) => ({
            id: String(s.id),
            name: String(s.name),
          })),
        );
      } catch {}
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleSubmit = async () => {
    if (!link) return;
    const { error: insErr } = await supabase.from("applications").insert({
      tenant_id: link.tenant_id,
      branch_id: link.branch_id || null,
      registration_link_id: String(link.id).startsWith("generic-") ? null : link.id,
      sport_id: selectedSport || null,
      full_name: form.fullName,
      birth_date: form.birthDate || null,
      phone: form.phone || null,
      email: form.email || null,
      guardian_name: form.guardianName || null,
      guardian_phone: form.guardianPhone || null,
      preferred_group_id: link.group_id || null,
      message: form.message || null,
      status: "pending",
    });
    if (insErr) {
      setError("Başvuru kaydedilemedi");
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/50">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card/50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Başvurunuz Alındı!</h2>
            <p className="text-muted-foreground mb-6">
              Başvurunuz incelemeye alınmıştır. En kısa sürede sizinle iletişime
              geçeceğiz.
            </p>
            {tenant?.slug ? (
              <Button asChild>
                <Link href={`/site/${tenant.slug}`}>Okul Sitesine Dön</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={tenant?.slug ? `/site/${tenant.slug}` : "/"}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-bold">
            Kayıt Formu{tenant?.name ? ` - ${tenant.name}` : ""}
          </h1>
          {link?.title ? (
            <Badge variant="secondary" className="ml-2">
              {link.title}
            </Badge>
          ) : null}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {error && (
          <Card className="bg-destructive/5 border-destructive/30 mb-4">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold">Kayıt yapılamıyor</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!error && (
          <>
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div
                    className={`h-2 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
                  />
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Branş Seçimi</h2>
                  <p className="text-muted-foreground text-sm">
                    Kayıt olmak istediğiniz branşı seçin
                  </p>
                </div>

                <div className="space-y-3">
                  {sportsData.map((sport) => (
                    <Card
                      key={sport.id}
                      className={`cursor-pointer transition-colors ${
                        selectedSport === sport.id
                          ? "border-primary bg-primary/5"
                          : "bg-card/50 border-border/50 hover:bg-card/80"
                      }`}
                      onClick={() => setSelectedSport(sport.id)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{sport.name}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedSport === sport.id
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedSport === sport.id && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={sportsData.length > 0 && !selectedSport}
                  onClick={() => setStep(2)}
                >
                  Devam Et
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Öğrenci Bilgileri</h2>
                  <p className="text-muted-foreground text-sm">
                    Öğrenci bilgilerini doldurun
                  </p>
                </div>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Ad</Label>
                        <Input
                          placeholder="Öğrenci adı"
                          value={form.fullName.split(" ")[0] || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              fullName:
                                `${e.target.value} ${form.fullName.split(" ")[1] || ""}`.trim(),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Soyad</Label>
                        <Input
                          placeholder="Öğrenci soyadı"
                          value={form.fullName.split(" ")[1] || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              fullName:
                                `${form.fullName.split(" ")[0] || ""} ${e.target.value}`.trim(),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Doğum Tarihi</Label>
                      <Input
                        type="date"
                        value={form.birthDate}
                        onChange={(e) =>
                          setForm({ ...form, birthDate: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cinsiyet</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Erkek</SelectItem>
                          <SelectItem value="female">Kız</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notlar (Opsiyonel)</Label>
                      <Textarea
                        placeholder="Sağlık durumu, önceki deneyim vb."
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setStep(1)}
                  >
                    Geri
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>
                    Devam Et
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Veli Bilgileri</h2>
                  <p className="text-muted-foreground text-sm">
                    İletişim bilgilerini doldurun
                  </p>
                </div>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Veli Adı Soyadı</Label>
                      <Input
                        placeholder="Ad Soyad"
                        value={form.guardianName}
                        onChange={(e) =>
                          setForm({ ...form, guardianName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <Input
                        type="tel"
                        placeholder="0532 123 4567"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>E-posta</Label>
                      <Input
                        type="email"
                        placeholder="ornek@email.com"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Veli Telefonu</Label>
                      <Input
                        type="tel"
                        placeholder="0532 123 4567"
                        value={form.guardianPhone}
                        onChange={(e) =>
                          setForm({ ...form, guardianPhone: e.target.value })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox id="terms" className="mt-1" />
                      <label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Kişisel verilerin işlenmesine ilişkin {""}
                        <a href="#" className="text-primary underline">
                          aydınlatma metnini
                        </a>{" "}
                        okudum ve kabul ediyorum.
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setStep(2)}
                  >
                    Geri
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={!form.fullName}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Başvuruyu Gönder
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
