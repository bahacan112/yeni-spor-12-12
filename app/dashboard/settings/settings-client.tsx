"use client";

import { useState } from "react";
import {
  Save,
  Building2,
  Palette,
  Bell,
  Globe,
  Shield,
  AlertTriangle,
  Crown,
  Calendar,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tenant, Branch } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SettingsClientProps {
  tenant: Tenant;
  branches: Branch[];
  stats: {
    studentCount: number;
    groupCount: number;
    branchCount: number;
  };
}

export function SettingsClient({
  tenant: initialTenant,
  stats,
}: SettingsClientProps) {
  const [tenant, setTenant] = useState(initialTenant);
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const updates = {
        name: tenant.name,
        phone: tenant.phone,
        primary_color: tenant.primaryColor,
        secondary_color: tenant.secondaryColor,
        website_enabled: tenant.websiteEnabled,
        website_domain: tenant.websiteDomain,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", tenant.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTenant((prev) => ({
          ...prev,
          name: data.name,
          phone: data.phone,
          email: data.email,
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          websiteEnabled: data.website_enabled,
          websiteDomain: data.website_domain,
        }));
      }
      toast.success("Ayarlar başarıyla kaydedildi");
    } catch (error) {
      console.error("Error saving tenant settings:", error);
      toast.error("Ayarlar kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Şifre en az 8 karakter olmalı");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    setChangingPw(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Şifre başarıyla güncellendi");
      setPwOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Şifre güncellenirken hata oluştu");
    } finally {
      setChangingPw(false);
    }
  };

  // Subscription info
  const isExpired = tenant.subscriptionStatus === "expired";
  const expiryDate = tenant.subscriptionExpiresAt
    ? new Date(tenant.subscriptionExpiresAt).toLocaleDateString("tr-TR")
    : "Belirtilmemiş";

  // Usage stats (for limitation display)
  const studentCount = stats.studentCount;
  const groupCount = stats.groupCount;

  // These limits should ideally come from the subscription plan details
  const maxStudents = tenant.maxStudents || 500;
  const maxGroups = tenant.maxGroups || 20;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Ayarlar</h1>
          <p className="text-sm text-slate-400">
            Okul ve sistem ayarlarını yönetin
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>

      {/* Subscription Status Card */}
      <Card
        className={`border-slate-800 ${
          isExpired ? "bg-red-950/30" : "bg-slate-900"
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Crown
                className={`h-5 w-5 ${
                  isExpired ? "text-red-400" : "text-amber-400"
                }`}
              />
              Abonelik Durumu
            </CardTitle>
            <Badge
              className={
                isExpired
                  ? "bg-red-500/20 text-red-400"
                  : tenant.subscriptionStatus === "active"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-400"
              }
            >
              {isExpired
                ? "Süresi Dolmuş"
                : tenant.subscriptionStatus === "active"
                ? "Aktif"
                : "Pasif"}
            </Badge>
          </div>
          <CardDescription className="text-slate-400">
            {tenant.subscriptionPlan === "pro"
              ? "Profesyonel"
              : tenant.subscriptionPlan === "enterprise"
              ? "Kurumsal"
              : "Başlangıç"}{" "}
            Paket
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExpired && (
            <div className="rounded-lg bg-red-500/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium text-red-300">
                    Aboneliğinizin süresi dolmuştur!
                  </p>
                  <p className="mt-1 text-sm text-red-400">
                    Sistemi kısıtlı olarak kullanabilirsiniz. Maksimum{" "}
                    {tenant.maxStudents || 30} öğrenci ve{" "}
                    {tenant.maxGroups || 2} grup ile sınırlısınız.
                  </p>
                  <Button className="mt-3 bg-red-600 hover:bg-red-700">
                    Aboneliği Yenile
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Öğrenci Kullanımı</span>
                <span className="text-white">
                  {studentCount} / {maxStudents}
                </span>
              </div>
              <Progress
                value={(studentCount / maxStudents) * 100}
                className="h-2 bg-slate-700"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Grup Kullanımı</span>
                <span className="text-white">
                  {groupCount} / {maxGroups}
                </span>
              </div>
              <Progress
                value={(groupCount / maxGroups) * 100}
                className="h-2 bg-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-800 p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Bitiş Tarihi</span>
            </div>
            <span className="font-medium text-white">{expiryDate}</span>
          </div>

          {!isExpired && (
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 bg-transparent"
            >
              Paketi Yükselt
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* School Info */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5 text-blue-400" />
              Okul Bilgileri
            </CardTitle>
            <CardDescription className="text-slate-400">
              Temel okul bilgilerini düzenleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Okul Adı</Label>
              <Input
                value={tenant.name}
                onChange={(e) =>
                  setTenant((prev) => ({ ...prev, name: e.target.value }))
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">E-posta</Label>
              <Input
                type="email"
                value={tenant.email || ""}
                disabled
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Telefon</Label>
              <Input
                value={tenant.phone || ""}
                onChange={(e) =>
                  setTenant((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Palette className="h-5 w-5 text-purple-400" />
              Tema Ayarları
            </CardTitle>
            <CardDescription className="text-slate-400">
              Renk ve görünüm ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Ana Renk</Label>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg border border-slate-700"
                  style={{ backgroundColor: tenant.primaryColor }}
                />
                <Input
                  value={tenant.primaryColor}
                  onChange={(e) =>
                    setTenant((prev) => ({
                      ...prev,
                      primaryColor: e.target.value,
                    }))
                  }
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">İkincil Renk</Label>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg border border-slate-700"
                  style={{ backgroundColor: tenant.secondaryColor }}
                />
                <Input
                  value={tenant.secondaryColor}
                  onChange={(e) =>
                    setTenant((prev) => ({
                      ...prev,
                      secondaryColor: e.target.value,
                    }))
                  }
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-amber-400" />
              Bildirim Ayarları
            </CardTitle>
            <CardDescription className="text-slate-400">
              Otomatik bildirim tercihleri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">SMS Bildirimleri</Label>
                <p className="text-xs text-slate-500">
                  Ödeme hatırlatmaları için SMS gönder
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">E-posta Bildirimleri</Label>
                <p className="text-xs text-slate-500">
                  Günlük özet ve hatırlatmalar
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-slate-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Otomatik Hatırlatma</Label>
                <p className="text-xs text-slate-500">
                  Ödeme tarihinden 3 gün önce
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Website Settings */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-cyan-400" />
              Web Sitesi
            </CardTitle>
            <CardDescription className="text-slate-400">
              Web sitesi ve domain ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300">Web Sitesi Aktif</Label>
                <p className="text-xs text-slate-500">
                  Herkese açık web sitenizi yayınlayın
                </p>
              </div>
              <Switch
                checked={tenant.websiteEnabled}
                onCheckedChange={(checked) =>
                  setTenant((prev) => ({ ...prev, websiteEnabled: checked }))
                }
              />
            </div>
            <Separator className="bg-slate-700" />
            <div className="space-y-2">
              <Label className="text-slate-300">Site Adresi</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={`/site/${tenant.slug}`}
                  disabled
                  className="border-slate-700 bg-slate-800 text-slate-400"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 bg-transparent"
                >
                  Aç
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Özel Domain</Label>
              <Input
                placeholder="www.ornek.com"
                value={tenant.websiteDomain || ""}
                onChange={(e) =>
                  setTenant((prev) => ({
                    ...prev,
                    websiteDomain: e.target.value,
                  }))
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
              <p className="text-xs text-slate-500">
                Pro ve üzeri paketlerde kullanılabilir
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-red-400" />
            Güvenlik
          </CardTitle>
          <CardDescription className="text-slate-400">
            Hesap güvenliği ayarları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-300">İki Faktörlü Doğrulama</Label>
              <p className="text-xs text-slate-500">
                Hesabınızı ekstra güvenlik katmanı ile koruyun
              </p>
            </div>
            <Switch />
          </div>
          <Separator className="bg-slate-700" />
          <Button
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
            onClick={() => setPwOpen(true)}
          >
            Şifre Değiştir
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="sm:max-w-[420px]" showCloseButton>
          <DialogHeader>
            <DialogTitle>Şifre Değiştir</DialogTitle>
            <DialogDescription>Yeni şifrenizi belirleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Yeni Şifre</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Şifre Tekrar</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 bg-transparent"
              onClick={() => setPwOpen(false)}
            >
              İptal
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleChangePassword}
              disabled={changingPw}
            >
              {changingPw ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
