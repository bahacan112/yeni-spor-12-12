"use client"

import { Users, Calendar, Wallet, FileText, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardStats } from "@/lib/types"
import Link from "next/link"

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
      href: "/dashboard/students",
    },
    {
      label: "Bugünkü Antrenman",
      value: stats.todayTrainings,
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-500/20",
      href: "/dashboard/trainings",
    },
    {
      label: "Bekleyen Ödeme",
      value: stats.pendingPayments,
      icon: Wallet,
      color: "text-amber-500",
      bg: "bg-amber-500/20",
      trend: "-5%",
      trendUp: false,
      href: "/dashboard/dues",
    },
    {
      label: "Yeni Başvuru",
      value: stats.pendingApplications,
      icon: FileText,
      color: "text-green-500",
      bg: "bg-green-500/20",
      trend: "+3",
      trendUp: true,
      href: "/dashboard/applications",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Main Revenue Card */}
      <Link href="/dashboard/accounting" className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl">
        <Card className="border-border bg-gradient-to-br from-primary/20 to-primary/5 transition-all hover:border-primary/50 active:scale-[0.99] cursor-pointer">
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
      </Link>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href || "#"} className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
              <Card className="border-border bg-card transition-all hover:border-primary/50 hover:bg-secondary/50 active:scale-[0.98] cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between mb-2">
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
                  <div className="mt-auto pt-2">
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-between mt-1">
                      <span>
                        {item.label}
                        {item.total && <span className="ml-1">/ {item.total}</span>}
                      </span>
                      <ArrowUpRight className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
