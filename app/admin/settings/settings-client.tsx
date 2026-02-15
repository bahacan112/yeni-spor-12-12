"use client"

import { useState } from "react"
import { Save, Mail, Clock, Shield, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { PlatformSetting } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface SettingsClientProps {
  initialSettings: PlatformSetting[]
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState<PlatformSetting[]>(initialSettings)
  const [loading, setLoading] = useState(false)

  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || ""

  const updateLocalSetting = (key: string, value: string) => {
    setSettings((prev) => 
      prev.map((s) => (s.key === key ? { ...s, value, updatedAt: new Date().toISOString() } : s))
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Update each changed setting
      // Ideally we should track which ones changed, but for now we'll update all or just iterate
      // Since we don't have dirty state tracking, let's just update all of them for now
      // A better approach would be to only update changed ones.
      
      const updates = settings.map(setting => ({
        id: setting.id,
        key: setting.key,
        value: setting.value,
        type: setting.type,
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('platform_settings')
        .upsert(updates)

      if (error) throw error

      toast.success("Ayarlar başarıyla kaydedildi")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Ayarlar kaydedilirken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Ayarları</h1>
          <p className="text-slate-400">Genel platform ayarlarını yönetin</p>
        </div>
        <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-blue-400" />
              Genel Ayarlar
            </CardTitle>
            <CardDescription className="text-slate-400">Platform adı ve iletişim bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Platform Adı</Label>
              <Input
                value={getSetting("platform_name")}
                onChange={(e) => updateLocalSetting("platform_name", e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Destek E-postası</Label>
              <Input
                type="email"
                value={getSetting("support_email")}
                onChange={(e) => updateLocalSetting("support_email", e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-emerald-400" />
              Bildirim Ayarları
            </CardTitle>
            <CardDescription className="text-slate-400">SMS ve e-posta bildirimleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">SMS Bildirimleri</Label>
                <p className="text-sm text-slate-500">SMS gönderimini aktif/pasif yap</p>
              </div>
              <Switch
                checked={getSetting("sms_enabled") === "true"}
                onCheckedChange={(checked) => updateLocalSetting("sms_enabled", checked.toString())}
              />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">E-posta Bildirimleri</Label>
                <p className="text-sm text-slate-500">E-posta gönderimini aktif/pasif yap</p>
              </div>
              <Switch
                checked={getSetting("email_enabled") === "true"}
                onCheckedChange={(checked) => updateLocalSetting("email_enabled", checked.toString())}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Settings */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-blue-400" />
              Faturalama ve Cron Ayarları
            </CardTitle>
            <CardDescription className="text-slate-400">Otomatik tahsilat ve dunning hatırlatmaları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Otomatik Tahsilat</Label>
                <p className="text-sm text-slate-500">Abonelikleri dönem sonunda otomatik yenile</p>
              </div>
              <Switch
                checked={getSetting("billing_auto_charge_enabled") === "true"}
                onCheckedChange={(checked) => updateLocalSetting("billing_auto_charge_enabled", checked.toString())}
              />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Dunning (Hatırlatma)</Label>
                <p className="text-sm text-slate-500">Başarısız ödeme veya beklemede ödemeler için hatırlatma yap</p>
              </div>
              <Switch
                checked={getSetting("dunning_enabled") === "true"}
                onCheckedChange={(checked) => updateLocalSetting("dunning_enabled", checked.toString())}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Hatırlatma (Gün)</Label>
                <Input
                  type="number"
                  value={getSetting("dunning_reminder_days") || "3"}
                  onChange={(e) => updateLocalSetting("dunning_reminder_days", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Başarısız Say (Gün)</Label>
                <Input
                  type="number"
                  value={getSetting("dunning_fail_days") || "7"}
                  onChange={(e) => updateLocalSetting("dunning_fail_days", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Settings */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-amber-400" />
              Deneme Süresi Ayarları
            </CardTitle>
            <CardDescription className="text-slate-400">Yeni okullar için deneme süresi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Deneme Süresi (Gün)</Label>
              <Input
                type="number"
                value={getSetting("trial_days")}
                onChange={(e) => updateLocalSetting("trial_days", e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
              <p className="text-xs text-slate-500">Yeni kayıt olan okullar için ücretsiz deneme süresi</p>
            </div>
          </CardContent>
        </Card>

        {/* Expired Account Limits */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-red-400" />
              Süresi Dolan Hesap Kısıtlamaları
            </CardTitle>
            <CardDescription className="text-slate-400">Aboneliği biten okulların limitleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Maksimum Öğrenci Sayısı</Label>
              <Input
                type="number"
                value={getSetting("expired_tenant_max_students")}
                onChange={(e) => updateLocalSetting("expired_tenant_max_students", e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Maksimum Grup Sayısı</Label>
              <Input
                type="number"
                value={getSetting("expired_tenant_max_groups")}
                onChange={(e) => updateLocalSetting("expired_tenant_max_groups", e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <p className="text-xs text-slate-500">Aboneliği sona eren okullar sistemi kısıtlı olarak kullanabilir</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
