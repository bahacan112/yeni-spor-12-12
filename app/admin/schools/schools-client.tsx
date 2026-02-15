"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Globe,
  AlertTriangle,
  CheckCircle,
  Ban,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { Tenant, TenantSubscription, PlatformPlan } from "@/lib/types"
import { toast } from "sonner"

interface SchoolsClientProps {
  tenants: Tenant[]
  subscriptions: TenantSubscription[]
  plans: PlatformPlan[]
}

export function SchoolsClient({ tenants, subscriptions, plans }: SchoolsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [isNewSchoolOpen, setIsNewSchoolOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [targetTenant, setTargetTenant] = useState<Tenant | null>(null)
  const [confirmName, setConfirmName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleting, setDeleting] = useState(false)

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || tenant.subscriptionStatus === statusFilter
    const matchesPlan = planFilter === "all" || tenant.subscriptionPlan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

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

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return <Badge className="bg-purple-500/20 text-purple-400">Kurumsal</Badge>
      case "pro":
        return <Badge className="bg-blue-500/20 text-blue-400">Profesyonel</Badge>
      case "basic":
        return <Badge className="bg-slate-500/20 text-slate-400">Başlangıç</Badge>
      default:
        return <Badge className="bg-amber-500/20 text-amber-400">Deneme</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Okullar</h1>
          <p className="text-slate-400">Tüm spor okullarını yönetin</p>
        </div>
        <Sheet open={isNewSchoolOpen} onOpenChange={setIsNewSchoolOpen}>
          <SheetTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Okul Ekle
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full border-slate-800 bg-slate-900 sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="text-white">Yeni Okul Ekle</SheetTitle>
              <SheetDescription className="text-slate-400">Platforma yeni bir spor okulu ekleyin</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Okul Adı</Label>
                <Input placeholder="Örn: Spor Akademi" className="border-slate-700 bg-slate-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">E-posta</Label>
                <Input type="email" placeholder="info@okul.com" className="border-slate-700 bg-slate-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Telefon</Label>
                <Input placeholder="+90 555 123 4567" className="border-slate-700 bg-slate-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Paket</Label>
                <Select>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                    <SelectValue placeholder="Paket seçin" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.slug} className="text-white">
                        {plan.name} - {plan.monthlyPrice.toLocaleString("tr-TR")} TL/ay
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Ödeme Periyodu</Label>
                <Select>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                    <SelectValue placeholder="Periyot seçin" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="monthly" className="text-white">
                      Aylık
                    </SelectItem>
                    <SelectItem value="yearly" className="text-white">
                      Yıllık (%15 indirim)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Okul Oluştur</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Okul adı veya e-posta ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white sm:w-40">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="all" className="text-white">
                  Tüm Durumlar
                </SelectItem>
                <SelectItem value="active" className="text-white">
                  Aktif
                </SelectItem>
                <SelectItem value="expired" className="text-white">
                  Süresi Dolmuş
                </SelectItem>
                <SelectItem value="inactive" className="text-white">
                  Pasif
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white sm:w-40">
                <SelectValue placeholder="Paket" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="all" className="text-white">
                  Tüm Paketler
                </SelectItem>
                <SelectItem value="enterprise" className="text-white">
                  Kurumsal
                </SelectItem>
                <SelectItem value="pro" className="text-white">
                  Profesyonel
                </SelectItem>
                <SelectItem value="basic" className="text-white">
                  Başlangıç
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schools List */}
      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
             <div className="text-center text-sm text-slate-500 py-4">Sonuç bulunamadı</div>
        ) : (
            filteredTenants.map((tenant) => {
            const subscription = subscriptions.find((s) => s.tenantId === tenant.id)
            return (
                <Card key={tenant.id} className="border-slate-800 bg-slate-900">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-white" style={{ backgroundColor: tenant.primaryColor }}>
                            {tenant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                        </Avatar>
                        <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{tenant.name}</h3>
                            {getStatusBadge(tenant.subscriptionStatus)}
                            {getPlanBadge(tenant.subscriptionPlan)}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                            {tenant.email && (
                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {tenant.email}
                            </span>
                            )}
                            {tenant.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {tenant.phone}
                            </span>
                            )}
                            {tenant.websiteEnabled && (
                            <span className="flex items-center gap-1 text-emerald-400">
                                <Globe className="h-3 w-3" />
                                Web sitesi aktif
                            </span>
                            )}
                        </div>
                        {tenant.isLimited && (
                            <p className="mt-1 text-xs text-amber-400">
                            Kısıtlı mod: Max {tenant.maxStudents} öğrenci, {tenant.maxGroups} grup
                            </p>
                        )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {subscription && (
                        <div className="mr-4 text-right text-sm">
                            <p className="text-slate-400">Bitiş Tarihi</p>
                            <p className="font-medium text-white">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString("tr-TR")}
                            </p>
                        </div>
                        )}
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400">
                            <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-slate-700 bg-slate-800 text-white">
                            <DropdownMenuItem className="focus:bg-slate-700" asChild>
                            <Link href={`/admin/schools/${tenant.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detayları Gör
                            </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-slate-700">
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-slate-700">
                            <Mail className="mr-2 h-4 w-4" />
                            E-posta Gönder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                              className="text-red-400 focus:bg-slate-700 focus:text-red-400"
                              onClick={() => {
                                setTargetTenant(tenant)
                                setConfirmName("")
                                setConfirmPassword("")
                                setDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                    </div>
                    </div>
                </CardContent>
                </Card>
            )
            })
        )}
      </div>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Okulu Sil</DialogTitle>
            <DialogDescription className="text-slate-400">
              Onay için okul adını ve şifrenizi girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Okul Adı</Label>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={targetTenant?.name || ""}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Admin Şifre</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="border-slate-700 text-slate-300 bg-transparent"
              disabled={deleting}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              disabled={deleting || !targetTenant || !confirmName.trim() || !confirmPassword.trim()}
              onClick={async () => {
                if (!targetTenant) return
                setDeleting(true)
                const res = await fetch("/api/admin/tenants/delete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tenantId: targetTenant.id,
                    schoolName: confirmName,
                    password: confirmPassword,
                  }),
                })
                setDeleting(false)
                if (res.ok) {
                  setDeleteOpen(false)
                  location.reload()
                } else {
                  let msg = "Silme işlemi başarısız"
                  try {
                    const data = await res.json()
                    msg = String(data?.error || msg)
                  } catch {}
                  toast.error(msg)
                }
              }}
            >
              {deleting ? "Siliniyor..." : "Onayla ve Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
