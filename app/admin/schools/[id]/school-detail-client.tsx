"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Globe,
  Calendar,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Ban,
  Clock,
  Send,
  Edit,
  Trash2,
  RefreshCw,
  TrendingUp,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { PlatformPlan } from "@/lib/types"

// We can define the props type based on what getTenantDetails returns
interface SchoolDetailClientProps {
  tenant: any // Using any for simplicity as it's a composite object
  plans: PlatformPlan[]
}

export default function SchoolDetailClient({ tenant, plans }: SchoolDetailClientProps) {
  const [isLimited, setIsLimited] = useState(tenant.isLimited)
  const [maxStudents, setMaxStudents] = useState(tenant.maxStudents)
  const [maxGroups, setMaxGroups] = useState(tenant.maxGroups)
  const [showExtendDialog, setShowExtendDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  
  // Derived data
  const subscription = tenant.subscription
  const payments = tenant.payments || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Aktif
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-red-500/20 text-red-400">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Süresi Dolmuş
          </Badge>
        )
      case "inactive":
        return (
          <Badge className="bg-slate-500/20 text-slate-400">
            <Ban className="mr-1 h-3 w-3" />
            Pasif
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-slate-400">
          <Link href="/admin/schools">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback
                className="text-white"
                style={{ backgroundColor: tenant.primaryColor || '#64748b' }}
              >
                {tenant.name?.substring(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
                {getStatusBadge(tenant.subscriptionStatus)}
              </div>
              <p className="text-sm text-slate-400">ID: {tenant.id}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 bg-transparent"
              >
                <Send className="mr-2 h-4 w-4" />
                Mesaj Gönder
              </Button>
            </DialogTrigger>
            <DialogContent className="border-slate-800 bg-slate-900 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Okula Mesaj Gönder
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  E-posta, SMS veya bildirim gönderin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Gönderim Tipi</Label>
                  <Select defaultValue="email">
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      <SelectItem value="email" className="text-white">
                        E-posta
                      </SelectItem>
                      <SelectItem value="sms" className="text-white">
                        SMS
                      </SelectItem>
                      <SelectItem value="push" className="text-white">
                        Bildirim
                      </SelectItem>
                      <SelectItem value="all" className="text-white">
                        Tümü
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Konu</Label>
                  <Input
                    placeholder="Mesaj konusu"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Mesaj</Label>
                  <Textarea
                    placeholder="Mesajınızı yazın..."
                    className="min-h-[120px] border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Gönder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-slate-700"
          >
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="data-[state=active]:bg-slate-700"
          >
            Abonelik
          </TabsTrigger>
          <TabsTrigger
            value="limits"
            className="data-[state=active]:bg-slate-700"
          >
            Kısıtlamalar
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-slate-700"
          >
            Ödemeler
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-slate-700"
          >
            Ayarlar
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/20 p-2">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Öğrenciler</p>
                    <p className="text-xl font-bold text-white">
                      {tenant.currentStudentCount || 0}
                      {tenant.isLimited && (
                        <span className="text-sm text-slate-500">
                          /{tenant.maxStudents}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/20 p-2">
                    <Building className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Şubeler</p>
                    <p className="text-xl font-bold text-white">
                      {tenant.branchCount || 1}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/20 p-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Gruplar</p>
                    <p className="text-xl font-bold text-white">
                      {tenant.currentGroupCount || 0}
                      {tenant.isLimited && (
                        <span className="text-sm text-slate-500">
                          /{tenant.maxGroups}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/20 p-2">
                    <Calendar className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Kayıt Tarihi</p>
                    <p className="text-xl font-bold text-white">
                      {new Date(tenant.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                İletişim Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400">E-posta</p>
                    <p className="text-white">{tenant.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
                  <Phone className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-400">Telefon</p>
                    <p className="text-white">{tenant.phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
                  <Globe className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-slate-400">Web Sitesi</p>
                    <p className="text-white">
                      {tenant.websiteEnabled ? "Aktif" : "Pasif"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
                  <MapPin className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-xs text-slate-400">Adres</p>
                    <p className="text-white">{tenant.address || "-"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {subscription ? (
            <>
              <Card className="border-slate-800 bg-slate-900">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg text-white">
                    Mevcut Abonelik
                  </CardTitle>
                  <Dialog
                    open={showExtendDialog}
                    onOpenChange={setShowExtendDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300 bg-transparent"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Süre Uzat
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-slate-800 bg-slate-900">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          Abonelik Süresini Uzat
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                          Abonelik süresini manuel olarak uzatın
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-slate-300">
                            Uzatma Süresi
                          </Label>
                          <Select defaultValue="1month">
                            <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-700 bg-slate-800">
                              <SelectItem value="1month" className="text-white">
                                1 Ay
                              </SelectItem>
                              <SelectItem
                                value="3months"
                                className="text-white"
                              >
                                3 Ay
                              </SelectItem>
                              <SelectItem
                                value="6months"
                                className="text-white"
                              >
                                6 Ay
                              </SelectItem>
                              <SelectItem value="1year" className="text-white">
                                1 Yıl
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300">Not</Label>
                          <Textarea
                            placeholder="Opsiyonel not..."
                            className="border-slate-700 bg-slate-800 text-white"
                          />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Süreyi Uzat
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-slate-800/50 p-4">
                      <p className="text-sm text-slate-400">Paket</p>
                      <p className="text-lg font-semibold text-white">
                        {subscription.plan?.name || "Bilinmiyor"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-4">
                      <p className="text-sm text-slate-400">Periyot</p>
                      <p className="text-lg font-semibold text-white">
                        {subscription.billingPeriod === "monthly"
                          ? "Aylık"
                          : "Yıllık"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-4">
                      <p className="text-sm text-slate-400">Başlangıç</p>
                      <p className="text-lg font-semibold text-white">
                        {new Date(
                          subscription.currentPeriodStart
                        ).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-4">
                      <p className="text-sm text-slate-400">Bitiş</p>
                      <p className="text-lg font-semibold text-white">
                        {new Date(
                          subscription.currentPeriodEnd
                        ).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>

                  {/* Days remaining indicator */}
                  {(() => {
                    const daysLeft = Math.ceil(
                      (new Date(subscription.currentPeriodEnd).getTime() -
                        Date.now()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const isExpired = daysLeft <= 0;
                    const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;
                    return (
                      <div
                        className={`rounded-lg p-4 ${
                          isExpired
                            ? "bg-red-500/10 border border-red-500/20"
                            : isExpiringSoon
                            ? "bg-amber-500/10 border border-amber-500/20"
                            : "bg-emerald-500/10 border border-emerald-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isExpired ? (
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                          ) : isExpiringSoon ? (
                            <Clock className="h-5 w-5 text-amber-400" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          )}
                          <div>
                            <p
                              className={`font-medium ${
                                isExpired
                                  ? "text-red-400"
                                  : isExpiringSoon
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {isExpired
                                ? "Abonelik süresi dolmuş"
                                : isExpiringSoon
                                ? `${daysLeft} gün kaldı`
                                : `${daysLeft} gün kaldı`}
                            </p>
                            <p className="text-sm text-slate-400">
                              {isExpired
                                ? "Okul kısıtlı modda çalışıyor"
                                : isExpiringSoon
                                ? "Yenileme hatırlatması gönderildi"
                                : "Abonelik aktif durumda"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Change Plan */}
              <Card className="border-slate-800 bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    Paket Değiştir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {plans
                      .filter((p) => p.isActive)
                      .map((plan) => (
                        <div
                          key={plan.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            subscription.planId === plan.id
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-semibold text-white">
                              {plan.name}
                            </h3>
                            {subscription.planId === plan.id && (
                              <Badge className="bg-blue-500/20 text-blue-400">
                                Mevcut
                              </Badge>
                            )}
                          </div>
                          <p className="mb-3 text-2xl font-bold text-white">
                            {plan.monthlyPrice.toLocaleString("tr-TR")} TL
                            <span className="text-sm font-normal text-slate-400">
                              /ay
                            </span>
                          </p>
                          <ul className="space-y-2 text-sm text-slate-400">
                            <li>Max {plan.maxStudents} öğrenci</li>
                            <li>Max {plan.maxBranches || 1} şube</li>
                            <li>Max {plan.maxInstructors || 5} eğitmen</li>
                          </ul>
                          {subscription.planId !== plan.id && (
                            <Button className="mt-4 w-full bg-slate-700 hover:bg-slate-600">
                              Geçiş Yap
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-slate-800 bg-slate-900">
                <CardContent className="p-8 text-center">
                    <p className="text-slate-400">Bu okulun aktif aboneliği bulunmamaktadır.</p>
                </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Limits Tab */}
        <TabsContent value="limits" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Kullanım Kısıtlamaları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">Kısıtlı Mod</p>
                  <p className="text-sm text-slate-400">
                    Aktif edildiğinde okul sınırlı özelliklerle çalışır
                  </p>
                </div>
                <Switch checked={isLimited} onCheckedChange={setIsLimited} />
              </div>

              {isLimited && (
                <div className="space-y-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-medium">Kısıtlı Mod Aktif</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Maksimum Öğrenci</Label>
                      <Input
                        type="number"
                        value={maxStudents || 0}
                        onChange={(e) => setMaxStudents(Number(e.target.value))}
                        className="border-slate-700 bg-slate-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Maksimum Grup</Label>
                      <Input
                        type="number"
                        value={maxGroups || 0}
                        onChange={(e) => setMaxGroups(Number(e.target.value))}
                        className="border-slate-700 bg-slate-800 text-white"
                      />
                    </div>
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    Limitleri Kaydet
                  </Button>
                </div>
              )}

              <div className="rounded-lg bg-slate-800/50 p-4">
                <h4 className="mb-3 font-medium text-white">
                  Varsayılan Kısıtlamalar (Süresi Dolan Abonelikler)
                </h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Maksimum 30 öğrenci
                  </li>
                  <li className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Maksimum 2 grup
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Web sitesi devre dışı
                  </li>
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    E-ticaret devre dışı
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">
                Ödeme Geçmişi
              </CardTitle>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <CreditCard className="mr-2 h-4 w-4" />
                Manuel Ödeme Ekle
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <p className="py-8 text-center text-slate-400">
                    Henüz ödeme kaydı bulunmuyor
                  </p>
                ) : (
                  payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            payment.status === "completed"
                              ? "bg-emerald-500/20"
                              : payment.status === "failed"
                              ? "bg-red-500/20"
                              : "bg-amber-500/20"
                          }`}
                        >
                          <CreditCard
                            className={`h-5 w-5 ${
                              payment.status === "completed"
                                ? "text-emerald-400"
                                : payment.status === "failed"
                                ? "text-red-400"
                                : "text-amber-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {payment.description || "Ödeme"}
                          </p>
                          <p className="text-sm text-slate-400">
                            {new Date(payment.paidAt).toLocaleDateString(
                              "tr-TR"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-400">
                          {payment.amount.toLocaleString("tr-TR")} TL
                        </p>
                        <Badge
                          className={
                            payment.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : payment.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                          }
                        >
                          {payment.status === "completed"
                            ? "Ödendi"
                            : payment.status === "failed"
                            ? "Başarısız"
                            : "Bekliyor"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Okul Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">Web Sitesi</p>
                  <p className="text-sm text-slate-400">
                    Okul web sitesini aktif/pasif yap
                  </p>
                </div>
                <Switch defaultChecked={tenant.websiteEnabled} />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">E-ticaret</p>
                  <p className="text-sm text-slate-400">
                    Online mağaza özelliğini aktif/pasif yap
                  </p>
                </div>
                <Switch defaultChecked={tenant.ecommerceEnabled} />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">Otomatik Yenileme</p>
                  <p className="text-sm text-slate-400">
                    Abonelik otomatik yenilensin
                  </p>
                </div>
                <Switch defaultChecked={subscription?.autoRenew} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-red-400">
                Tehlikeli Bölge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-red-500/5 p-4">
                <div>
                  <p className="font-medium text-white">Okulu Askıya Al</p>
                  <p className="text-sm text-slate-400">
                    Okul sisteme erişemez
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-500 hover:bg-amber-500/10 bg-transparent"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Askıya Al
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-red-500/5 p-4">
                <div>
                  <p className="font-medium text-white">Okulu Sil</p>
                  <p className="text-sm text-slate-400">
                    Bu işlem geri alınamaz
                  </p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
