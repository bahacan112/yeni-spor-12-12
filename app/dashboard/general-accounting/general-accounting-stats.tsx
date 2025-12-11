"use client"

import { TrendingUp, TrendingDown, PiggyBank, Wallet, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function GeneralAccountingStats({
  stats,
  expenses,
}: {
  stats: { totalIncome: number; totalExpense: number; netProfit: number; pendingPayments: number }
  expenses: Array<{ category?: string; amount: number }>
}) {
  const statCards = [
    {
      label: "Toplam Gelir",
      value: `₺${stats.totalIncome.toLocaleString("tr-TR")}`,
      change: "Bu ay",
      icon: TrendingUp,
      color: "text-emerald-400",
      trend: "up",
    },
    {
      label: "Toplam Gider",
      value: `₺${stats.totalExpense.toLocaleString("tr-TR")}`,
      change: "Bu ay",
      icon: TrendingDown,
      color: "text-red-400",
      trend: "up",
    },
    {
      label: "Net Kar",
      value: `₺${stats.netProfit.toLocaleString("tr-TR")}`,
      change: `${(((stats.netProfit) / (stats.totalIncome || 1)) * 100).toFixed(1)}% Marj`,
      icon: PiggyBank,
      color: "text-blue-400",
      trend: stats.netProfit >= 0 ? "up" : "down",
    },
    {
      label: "Bekleyen Ödeme",
      value: `₺${stats.pendingPayments.toLocaleString("tr-TR")}`,
      change: "Tahsil edilecek",
      icon: Wallet,
      color: "text-amber-400",
      trend: "neutral",
    },
  ]

  const expenseCategoriesMap = (expenses || []).reduce((acc, e) => {
    const cat = e.category || "Diğer"
    acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0)
    return acc
  }, {} as Record<string, number>)
  const totalExpenses = stats.totalExpense || 1
  const expenseCategories = Object.entries(expenseCategoriesMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: Math.round((amount / totalExpenses) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg bg-background/50`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-xs rounded bg-background/50 px-2 py-1">
                  {stat.change}
                </span>
              </div>
              <div className="mt-2">
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Gider Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz gider kaydı bulunmuyor.</p>
          ) : (
            expenseCategories.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{cat.name}</span>
                  <span className="font-medium">₺{cat.amount.toLocaleString("tr-TR")}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
