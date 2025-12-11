"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useParams, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const sports = [
  { id: "basketball", name: "Basketbol", groups: ["U10", "U12", "U14", "U16"] },
  { id: "swimming", name: "Yüzme", groups: ["Başlangıç", "Orta", "İleri"] },
  { id: "football", name: "Futbol", groups: ["U10", "U12", "U14", "U16"] },
  { id: "tennis", name: "Tenis", groups: ["Bireysel", "Grup"] },
]

export default function RegistrationPage() {
  const { slug } = useParams() as { slug: string }
  const searchParams = useSearchParams()
  const code = searchParams.get("code") || ""
  const supabase = createClient()
  const [tenant, setTenant] = useState<any | null>(null)
  const [link, setLink] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [selectedSport, setSelectedSport] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    fullName: "",
    birthDate: "",
    gender: "",
    phone: "",
    email: "",
    guardianName: "",
    guardianPhone: "",
    address: "",
    message: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      const { data: t } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .single()
      setTenant(t)
      if (code) {
        const { data: rl, error: rlErr } = await supabase
          .from("registration_links")
          .select("*")
          .eq("code", code)
          .single()
        if (rlErr || !rl) {
          setError("Kayıt linki bulunamadı")
        } else {
          const isExpired = rl.expires_at ? new Date(rl.expires_at) < new Date() : false
          if (!rl.is_active) setError("Bu kayıt linki pasif durumda")
          else if (isExpired) setError("Bu kayıt linkinin süresi dolmuş")
          setLink(rl)
        }
      }
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, code])

  const handleSubmit = async () => {
    try {
      setError(null)
      const res = await fetch("/api/public/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          code,
          fullName: form.fullName,
          birthDate: form.birthDate,
          gender: form.gender,
          phone: form.phone,
          email: form.email,
          guardianName: form.guardianName,
          guardianPhone: form.guardianPhone,
          address: form.address,
          message: form.message,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || "Başvuru kaydedilemedi")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Başvuru sırasında bir hata oluştu")
    }
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
              Başvurunuz incelemeye alınmıştır. En kısa sürede sizinle iletişime geçeceğiz.
            </p>
            <Button asChild>
              <Link href={`/site/${slug}`}>Ana Sayfaya Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/site/${slug}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-bold">Kayıt Formu{tenant?.name ? ` - ${tenant.name}` : ""}</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`h-2 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
            </div>
          ))}
        </div>

        {/* Step 1: Sport Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Branş Seçimi</h2>
              <p className="text-muted-foreground text-sm">Kayıt olmak istediğiniz branşı seçin</p>
            </div>

            <div className="space-y-3">
              {sports.map((sport) => (
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
                      <p className="text-sm text-muted-foreground">Gruplar: {sport.groups.join(", ")}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedSport === sport.id ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    >
                      {selectedSport === sport.id && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button className="w-full" size="lg" disabled={!selectedSport} onClick={() => setStep(2)}>
              Devam Et
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Student Info */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Öğrenci Bilgileri</h2>
              <p className="text-muted-foreground text-sm">Öğrenci bilgilerini doldurun</p>
            </div>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Ad</Label>
                    <Input placeholder="Öğrenci adı" value={form.fullName.split(" ")[0] || ""} onChange={(e) => setForm({ ...form, fullName: `${e.target.value} ${form.fullName.split(" ")[1] || ""}`.trim() })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Soyad</Label>
                    <Input placeholder="Öğrenci soyadı" value={form.fullName.split(" ")[1] || ""} onChange={(e) => setForm({ ...form, fullName: `${form.fullName.split(" ")[0] || ""} ${e.target.value}`.trim() })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Doğum Tarihi</Label>
                  <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Cinsiyet</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Erkek</SelectItem>
                      <SelectItem value="female">Kız</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Grup</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Grup seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports
                        .find((s) => s.id === selectedSport)
                        ?.groups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notlar (Opsiyonel)</Label>
                  <Textarea placeholder="Sağlık durumu, önceki deneyim vb." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
                Geri
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Devam Et
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Parent Info */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Veli Bilgileri</h2>
              <p className="text-muted-foreground text-sm">İletişim bilgilerini doldurun</p>
            </div>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Veli Adı Soyadı</Label>
                  <Input placeholder="Ad Soyad" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input type="tel" placeholder="0532 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input type="email" placeholder="ornek@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Textarea placeholder="Tam adres" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox id="terms" className="mt-1" />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    Kişisel verilerin işlenmesine ilişkin{" "}
                    <a href="#" className="text-primary underline">
                      aydınlatma metnini
                    </a>{" "}
                    okudum ve kabul ediyorum.
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(2)}>
                Geri
              </Button>
                  <Button className="flex-1" onClick={handleSubmit}>
                    <Check className="h-4 w-4 mr-1" />
                    Başvuruyu Gönder
                  </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
