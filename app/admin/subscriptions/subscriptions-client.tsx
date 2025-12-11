"use client"

import { useState } from "react"
import { Search, CheckCircle, AlertTriangle, Clock, RefreshCw, MoreVertical, Mail, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TenantSubscription } from "@/lib/types"

interface SubscriptionsClientProps {
  initialSubscriptions: TenantSubscription[]
}

export default function SubscriptionsClient({ initialSubscriptions }: SubscriptionsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")

  const filteredSubs = initialSubscriptions.filter((sub) => {
    const matchesSearch = sub.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter
    const matchesPeriod = periodFilter === "all" || sub.billingPeriod === periodFilter
    return matchesSearch && matchesStatus && matchesPeriod
  })

  // Stats
  const activeCount = initialSubscriptions.filter((s) => s.status === "active").length
  const expiredCount = initialSubscriptions.filter((s) => s.status === "expired").length
  const monthlyCount = initialSubscriptions.filter((s) => s.billingPeriod === "monthly").length
  const yearlyCount = initialSubscriptions.filter((s) => s.billingPeriod === "yearly").length

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
      case "canceled":
        return <Badge className="bg-slate-500/20 text-slate-400">İptal Edildi</Badge>
      default:
        return null
    }
  }

  const getDaysLeft = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Abonelik Yönetimi</h1>
        <p className="text-slate-400">Tüm okul aboneliklerini yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Aktif Abonelik</p>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-3">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Süresi Dolmuş</p>
                <p className="text-2xl font-bold text-white">{expiredCount}</p>
              </div>
              <div className="rounded-lg bg-red-500/20 p-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Aylık Abonelik</p>
                <p className="text-2xl font-bold text-white">{monthlyCount}</p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-3">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Yıllık Abonelik</p>
                <p className="text-2xl font-bold text-white">{yearlyCount}</p>
              </div>
              <div className="rounded-lg bg-purple-500/20 p-3">
                <RefreshCw className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Okul adı ile ara..."
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
                  Tümü
                </SelectItem>
                <SelectItem value="active" className="text-white">
                  Aktif
                </SelectItem>
                <SelectItem value="expired" className="text-white">
                  Süresi Dolmuş
                </SelectItem>
                <SelectItem value="canceled" className="text-white">
                  İptal
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full border-slate-700 bg-slate-800 text-white sm:w-40">
                <SelectValue placeholder="Periyot" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="all" className="text-white">
                  Tümü
                </SelectItem>
                <SelectItem value="monthly" className="text-white">
                  Aylık
                </SelectItem>
                <SelectItem value="yearly" className="text-white">
                  Yıllık
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {filteredSubs.map((sub) => {
          const daysLeft = getDaysLeft(sub.currentPeriodEnd)
          const isExpiringSoon = daysLeft <= 30 && daysLeft > 0

          return (
            <Card key={sub.id} className="border-slate-800 bg-slate-900">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-white" style={{ backgroundColor: sub.tenant?.primaryColor || '#64748b' }}>
                        {sub.tenant?.name?.substring(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{sub.tenant?.name || 'Bilinmeyen Okul'}</h3>
                        {getStatusBadge(sub.status)}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span>{sub.plan?.name || 'Bilinmeyen Paket'}</span>
                        <span className="text-slate-600">|</span>
                        <span>{sub.billingPeriod === "monthly" ? "Aylık" : "Yıllık"}</span>
                        <span className="text-slate-600">|</span>
                        <span>
                          {sub.amount.toLocaleString("tr-TR")} TL/{sub.billingPeriod === "monthly" ? "ay" : "yıl"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Bitiş Tarihi</p>
                      <p className="font-medium text-white">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString("tr-TR")}
                      </p>
                      {isExpiringSoon && (
                        <Badge className="mt-1 bg-amber-500/20 text-amber-400">{daysLeft} gün kaldı</Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-slate-700 bg-slate-800 text-white">
                        <DropdownMenuItem className="focus:bg-slate-700">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Süreyi Uzat
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-slate-700">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Paket Değiştir
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-slate-700">
                          <Mail className="mr-2 h-4 w-4" />
                          Hatırlatma Gönder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem className="text-red-400 focus:bg-slate-700 focus:text-red-400">
                          İptal Et
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
