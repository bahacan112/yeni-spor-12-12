"use client"

import { useState } from "react"
import { Search, Download, CreditCard, CheckCircle, Clock, XCircle, RefreshCw, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TenantPayment } from "@/lib/types"

interface PaymentsClientProps {
  payments: TenantPayment[]
}

export function PaymentsClient({ payments }: PaymentsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.invoiceNo && payment.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.description && payment.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0)
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyRevenue = payments
    .filter((p) => {
        const date = new Date(p.paidAt)
        return p.status === "completed" && date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Tamamlandı
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400">
            <Clock className="mr-1 h-3 w-3" />
            Bekliyor
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400">
            <XCircle className="mr-1 h-3 w-3" />
            Başarısız
          </Badge>
        )
      case "refunded":
        return (
          <Badge className="bg-blue-500/20 text-blue-400">
            <RefreshCw className="mr-1 h-3 w-3" />
            İade Edildi
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ödemeler</h1>
          <p className="text-slate-400">Okul abonelik ödemelerini takip edin</p>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 bg-transparent">
          <Download className="mr-2 h-4 w-4" />
          Rapor İndir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Toplam Gelir</p>
                <p className="text-2xl font-bold text-white">{totalRevenue.toLocaleString("tr-TR")} TL</p>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-3">
                <CreditCard className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Bu Ay</p>
                <p className="text-2xl font-bold text-white">{monthlyRevenue.toLocaleString("tr-TR")} TL</p>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-3">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Bekleyen</p>
                <p className="text-2xl font-bold text-white">{pendingAmount.toLocaleString("tr-TR")} TL</p>
              </div>
              <div className="rounded-lg bg-amber-500/20 p-3">
                <Clock className="h-6 w-6 text-amber-400" />
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
                placeholder="Okul adı veya fatura no ile ara..."
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
                <SelectItem value="completed" className="text-white">
                  Tamamlandı
                </SelectItem>
                <SelectItem value="pending" className="text-white">
                  Bekliyor
                </SelectItem>
                <SelectItem value="failed" className="text-white">
                  Başarısız
                </SelectItem>
                <SelectItem value="refunded" className="text-white">
                  İade
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
             <div className="text-center text-sm text-slate-500 py-4">Ödeme bulunamadı</div>
        ) : (
            filteredPayments.map((payment) => (
            <Card key={payment.id} className="border-slate-800 bg-slate-900">
                <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-white" style={{ backgroundColor: payment.tenant?.primaryColor }}>
                        {payment.tenant?.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{payment.tenant?.name}</h3>
                        {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-sm text-slate-400">{payment.description}</p>
                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                        {payment.invoiceNo && <span>Fatura: {payment.invoiceNo}</span>}
                        <span>{new Date(payment.paidAt).toLocaleString("tr-TR")}</span>
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400">+{payment.amount.toLocaleString("tr-TR")} TL</p>
                        <p className="text-xs text-slate-500">
                        {payment.paymentMethod === "credit_card"
                            ? "Kredi Kartı"
                            : payment.paymentMethod === "bank_transfer"
                            ? "Havale/EFT"
                            : "Nakit"}
                        </p>
                    </div>
                    </div>
                </div>
                </CardContent>
            </Card>
            ))
        )}
      </div>
    </div>
  )
}
