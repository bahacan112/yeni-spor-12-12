"use client"

import { useState } from "react"
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  School,
  AlertTriangle,
  Eye,
  Copy,
  Filter,
  RefreshCw,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tenant, NotificationTemplate, NotificationLog, ScheduledNotification } from "@/lib/types"

interface NotificationsClientProps {
  notifications: {
    logs: NotificationLog[]
    templates: NotificationTemplate[]
    scheduled: ScheduledNotification[]
  }
  tenants: Tenant[]
}

export function NotificationsClient({ notifications, tenants }: NotificationsClientProps) {
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false)
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const [broadcastChannels, setBroadcastChannels] = useState({ sms: true, email: true, push: false })

  const toggleSchoolSelection = (schoolId: string) => {
    setSelectedSchools((prev) => (prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]))
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "push":
        return <Smartphone className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Teslim Edildi
          </Badge>
        )
      case "sent":
        return (
          <Badge className="bg-blue-500/20 text-blue-400">
            <Send className="mr-1 h-3 w-3" />
            Gönderildi
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            Başarısız
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400">
            <Clock className="mr-1 h-3 w-3" />
            Bekliyor
          </Badge>
        )
      default:
        return null
    }
  }

  // Expiring subscriptions for quick actions
  const expiringSchools = tenants.filter((t) => t.subscriptionStatus === "active").slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bildirim Merkezi</h1>
          <p className="text-slate-400">Okullara otomatik ve manuel bildirimler gönderin</p>
        </div>
        <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2 h-4 w-4" />
              Toplu Bildirim Gönder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Okullara Toplu Bildirim</DialogTitle>
              <DialogDescription className="text-slate-400">
                Seçili okullara SMS, e-posta veya push bildirim gönderin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Channel Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Gönderim Kanalları</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={broadcastChannels.sms ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBroadcastChannels((p) => ({ ...p, sms: !p.sms }))}
                    className={
                      broadcastChannels.sms
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "border-slate-700 text-slate-300 bg-transparent"
                    }
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    SMS
                  </Button>
                  <Button
                    variant={broadcastChannels.email ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBroadcastChannels((p) => ({ ...p, email: !p.email }))}
                    className={
                      broadcastChannels.email
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "border-slate-700 text-slate-300 bg-transparent"
                    }
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    E-posta
                  </Button>
                  <Button
                    variant={broadcastChannels.push ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBroadcastChannels((p) => ({ ...p, push: !p.push }))}
                    className={
                      broadcastChannels.push
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "border-slate-700 text-slate-300 bg-transparent"
                    }
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Push
                  </Button>
                </div>
              </div>

              {/* School Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Hedef Okullar</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-400"
                    onClick={() =>
                      setSelectedSchools(
                        selectedSchools.length === tenants.length ? [] : tenants.map((t) => t.id),
                      )
                    }
                  >
                    {selectedSchools.length === tenants.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                  </Button>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-700 p-2">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-2">
                      <Checkbox
                        checked={selectedSchools.includes(tenant.id)}
                        onCheckedChange={() => toggleSchoolSelection(tenant.id)}
                        className="border-slate-600 data-[state=checked]:bg-blue-600"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs text-white" style={{ backgroundColor: tenant.primaryColor }}>
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white">{tenant.name}</p>
                        <p className="truncate text-xs text-slate-400">{tenant.email}</p>
                      </div>
                      <Badge
                        className={
                          tenant.subscriptionStatus === "active"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }
                      >
                        {tenant.subscriptionStatus === "active" ? "Aktif" : "Süresi Dolmuş"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">{selectedSchools.length} okul seçildi</p>
              </div>

              {/* Quick Filters */}
              <div className="space-y-2">
                <Label className="text-slate-300">Hızlı Filtreler</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 bg-transparent"
                    onClick={() =>
                      setSelectedSchools(
                        tenants.filter((t) => t.subscriptionStatus === "active").map((t) => t.id),
                      )
                    }
                  >
                    <CheckCircle className="mr-2 h-3 w-3 text-emerald-400" />
                    Aktif Okullar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 bg-transparent"
                    onClick={() =>
                      setSelectedSchools(
                        tenants.filter((t) => t.subscriptionStatus === "expired").map((t) => t.id),
                      )
                    }
                  >
                    <AlertTriangle className="mr-2 h-3 w-3 text-red-400" />
                    Süresi Dolanlar
                  </Button>
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label className="text-slate-300">Şablon</Label>
                <Select>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                    <SelectValue placeholder="Şablon seçin veya özel mesaj yazın" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="custom" className="text-white">
                      Özel Mesaj
                    </SelectItem>
                    {notifications.templates.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-white">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label className="text-slate-300">Mesaj</Label>
                <Textarea
                  placeholder="Bildirim mesajınızı yazın..."
                  rows={4}
                  className="border-slate-700 bg-slate-800 text-white"
                />
                <p className="text-xs text-slate-500">
                  Değişkenler: {"{okul_adı}"}, {"{bitiş_tarihi}"}, {"{paket_adı}"}
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Alıcı Sayısı</span>
                  <span className="font-medium text-white">{selectedSchools.length} okul</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Gönderim Kanalı</span>
                  <div className="flex gap-1">
                    {broadcastChannels.sms && <Badge className="bg-emerald-500/20 text-emerald-400">SMS</Badge>}
                    {broadcastChannels.email && <Badge className="bg-blue-500/20 text-blue-400">E-posta</Badge>}
                    {broadcastChannels.push && <Badge className="bg-purple-500/20 text-purple-400">Push</Badge>}
                  </div>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={selectedSchools.length === 0}>
                <Send className="mr-2 h-4 w-4" />
                {selectedSchools.length} Okula Gönder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">1,245</p>
                <p className="text-xs text-slate-400">SMS Bu Ay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">892</p>
                <p className="text-xs text-slate-400">E-posta Bu Ay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2">
                <Smartphone className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">456</p>
                <p className="text-xs text-slate-400">Push Bu Ay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">%98.5</p>
                <p className="text-xs text-slate-400">Başarı Oranı</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Hızlı İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4 border-slate-700 text-slate-300 bg-transparent hover:bg-slate-800"
              onClick={() => {
                setSelectedSchools(tenants.filter((t) => t.subscriptionStatus === "expired").map((t) => t.id))
                setIsBroadcastOpen(true)
              }}
            >
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <div className="text-center">
                <p className="font-medium">Süresi Dolanlara Bildir</p>
                <p className="text-xs text-slate-500">3 okul</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4 border-slate-700 text-slate-300 bg-transparent hover:bg-slate-800"
              onClick={() => {
                setSelectedSchools(expiringSchools.map((t) => t.id))
                setIsBroadcastOpen(true)
              }}
            >
              <Clock className="h-6 w-6 text-amber-400" />
              <div className="text-center">
                <p className="font-medium">Yaklaşanlara Hatırlat</p>
                <p className="text-xs text-slate-500">5 okul</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4 border-slate-700 text-slate-300 bg-transparent hover:bg-slate-800"
              onClick={() => {
                setSelectedSchools(tenants.map((t) => t.id))
                setIsBroadcastOpen(true)
              }}
            >
              <School className="h-6 w-6 text-blue-400" />
              <div className="text-center">
                <p className="font-medium">Tüm Okullara Duyuru</p>
                <p className="text-xs text-slate-500">{tenants.length} okul</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scheduled" className="space-y-6">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-slate-700">
            <Clock className="mr-2 h-4 w-4" />
            Otomatik
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-slate-700">
            <Copy className="mr-2 h-4 w-4" />
            Şablonlar
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-slate-700">
            <Eye className="mr-2 h-4 w-4" />
            Geçmiş
          </TabsTrigger>
        </TabsList>

        {/* Scheduled/Automated Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Otomatik bildirim kuralları</p>
            <Dialog open={isNewScheduleOpen} onOpenChange={setIsNewScheduleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Otomasyon
                </Button>
              </DialogTrigger>
              <DialogContent className="border-slate-800 bg-slate-900 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white">Yeni Otomatik Bildirim</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Belirli koşullarda otomatik bildirim gönderilmesini sağlayın
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Otomasyon Adı</Label>
                    <Input
                      placeholder="Örn: Abonelik Hatırlatması"
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tetikleyici</Label>
                    <Select>
                      <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-800">
                        <SelectItem value="subscription_expiring" className="text-white">
                          Abonelik bitiminden X gün önce
                        </SelectItem>
                        <SelectItem value="subscription_expired" className="text-white">
                          Abonelik süresi dolduğunda
                        </SelectItem>
                        <SelectItem value="payment_failed" className="text-white">
                          Ödeme başarısız olduğunda
                        </SelectItem>
                        <SelectItem value="new_signup" className="text-white">
                          Yeni okul kaydında
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Gün Sayısı</Label>
                      <Input type="number" placeholder="7" className="border-slate-700 bg-slate-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Kanal</Label>
                      <Select>
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-800">
                          <SelectItem value="sms" className="text-white">
                            SMS
                          </SelectItem>
                          <SelectItem value="email" className="text-white">
                            E-posta
                          </SelectItem>
                          <SelectItem value="both" className="text-white">
                            Her İkisi
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Şablon</Label>
                    <Select>
                      <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                        <SelectValue placeholder="Şablon seçin" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-800">
                        {notifications.templates.map((t) => (
                          <SelectItem key={t.id} value={t.id} className="text-white">
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Otomasyon Oluştur</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {notifications.scheduled.map((schedule) => (
              <Card key={schedule.id} className="border-slate-800 bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-lg p-3 ${schedule.isActive ? "bg-emerald-500/20" : "bg-slate-700"}`}>
                        <RefreshCw className={`h-5 w-5 ${schedule.isActive ? "text-emerald-400" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{schedule.template?.name}</h3>
                        <p className="text-sm text-slate-400">
                          {schedule.triggerType === "days_before_due" &&
                            `Ödeme tarihinden ${schedule.triggerDays} gün önce`}
                          {schedule.triggerType === "days_after_due" &&
                            `Ödeme tarihinden ${schedule.triggerDays} gün sonra`}
                          {schedule.triggerType === "subscription_expiry" &&
                            `Abonelik bitiminden ${schedule.triggerDays} gün önce`}
                        </p>
                        {schedule.lastRunAt && (
                          <p className="mt-1 text-xs text-slate-500">
                            Son çalışma: {new Date(schedule.lastRunAt).toLocaleString("tr-TR")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          schedule.targetAudience === "all_pending"
                            ? "bg-blue-500/20 text-blue-400"
                            : schedule.targetAudience === "overdue"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                        }
                      >
                        {schedule.targetAudience === "all_pending" && "Ödeme Bekleyenler"}
                        {schedule.targetAudience === "overdue" && "Gecikmiş"}
                        {schedule.targetAudience === "expiring_subscriptions" && "Abonelik Bitiş"}
                      </Badge>
                      <Switch checked={schedule.isActive} />
                      <Button variant="ghost" size="icon" className="text-slate-400">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Bildirim şablonları</p>
            <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Şablon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white">Yeni Bildirim Şablonu</DialogTitle>
                  <DialogDescription className="text-slate-400">Yeni bir bildirim şablonu oluşturun</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Şablon Adı</Label>
                    <Input placeholder="Örn: Ödeme Hatırlatması" className="border-slate-700 bg-slate-800 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Tür</Label>
                      <Select>
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                          <SelectValue placeholder="Tür seçin" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-800">
                          <SelectItem value="subscription_reminder" className="text-white">
                            Abonelik Hatırlatması
                          </SelectItem>
                          <SelectItem value="subscription_expired" className="text-white">
                            Abonelik Süresi Doldu
                          </SelectItem>
                          <SelectItem value="welcome" className="text-white">
                            Hoş Geldiniz
                          </SelectItem>
                          <SelectItem value="announcement" className="text-white">
                            Duyuru
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Kanal</Label>
                      <Select>
                        <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                          <SelectValue placeholder="Kanal seçin" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-800">
                          <SelectItem value="sms" className="text-white">
                            SMS
                          </SelectItem>
                          <SelectItem value="email" className="text-white">
                            E-posta
                          </SelectItem>
                          <SelectItem value="push" className="text-white">
                            Push Bildirim
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Konu (E-posta için)</Label>
                    <Input placeholder="E-posta konusu" className="border-slate-700 bg-slate-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">İçerik</Label>
                    <Textarea
                      placeholder="Bildirim içeriği..."
                      rows={5}
                      className="border-slate-700 bg-slate-800 text-white"
                    />
                  </div>
                  <div className="rounded-lg bg-slate-800 p-3">
                    <p className="text-xs font-medium text-slate-400">Kullanılabilir Değişkenler:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["{okul_adı}", "{yetkili_adı}", "{paket_adı}", "{bitiş_tarihi}", "{tutar}"].map((v) => (
                        <Badge key={v} className="bg-slate-700 text-slate-300">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Şablon Oluştur</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {notifications.templates.map((template) => (
              <Card key={template.id} className="border-slate-800 bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          template.channel === "sms"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : template.channel === "email"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {getChannelIcon(template.channel)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{template.name}</h3>
                        <p className="text-sm text-slate-400">{template.channel.toUpperCase()}</p>
                        {template.isSystem && (
                          <Badge className="mt-2 bg-slate-700 text-slate-300">Sistem Şablonu</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={template.isActive} />
                      <Button variant="ghost" size="icon" className="text-slate-400">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-slate-800 p-3">
                    <p className="line-clamp-3 text-sm text-slate-300">{template.content.replace(/<[^>]*>/g, "")}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Gönderim geçmişi</p>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
          </div>
          <div className="space-y-4">
            {notifications.logs.map((log) => (
              <Card key={log.id} className="border-slate-800 bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          log.channel === "sms"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : log.channel === "email"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {getChannelIcon(log.channel)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{log.template?.name}</h3>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="text-sm text-slate-400">{log.recipientContact}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {log.content.replace(/<[^>]*>/g, "")}
                        </p>
                        {log.errorMessage && <p className="mt-1 text-sm text-red-400">{log.errorMessage}</p>}
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
