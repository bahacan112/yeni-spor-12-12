"use client"

import { Users, Calendar, Wallet, FileText, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardStats } from "@/lib/types"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statItems = [
    {
      label: "Aktif Öğrenci",
      value: stats.activeStudents,
      total: stats.totalStudents,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/20",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Bugünkü Antrenman",
      value: stats.todayTrainings,
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-500/20",
    },
    {
      label: "Bekleyen Ödeme",
      value: stats.pendingPayments,
      icon: Wallet,
      color: "text-amber-500",
      bg: "bg-amber-500/20",
      trend: "-5%",
      trendUp: false,
    },
    {
      label: "Yeni Başvuru",
      value: stats.pendingApplications,
      icon: FileText,
      color: "text-green-500",
      bg: "bg-green-500/20",
      trend: "+3",
      trendUp: true,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Main Revenue Card */}
      <Card className="border-border bg-gradient-to-br from-primary/20 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aylık Gelir</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              <span>+8.2%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  {item.trend && (
                    <div
                      className={`flex items-center gap-0.5 text-xs ${item.trendUp ? "text-green-500" : "text-red-500"}`}
                    >
                      {item.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{item.trend}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.label}
                    {item.total && <span className="ml-1">/ {item.total}</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
