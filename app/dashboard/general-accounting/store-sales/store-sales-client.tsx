"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StoreSalesClient({
  summary,
}: {
  summary: {
    totalSalesAmount: number
    totalOrders: number
    recentOrders: Array<{ id: string; orderNo: string; total: number; status: string; createdAt: string }>
  }
}) {
  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mağaza Satışları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-sm">Toplam Satış: ₺{summary.totalSalesAmount.toLocaleString("tr-TR")}</div>
          <div className="text-sm">Toplam Sipariş: {summary.totalOrders}</div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Son Siparişler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {summary.recentOrders.length === 0 ? (
            <div className="text-sm text-muted-foreground">Kayıt yok</div>
          ) : (
            summary.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50">
                <div className="min-w-0">
                  <div className="text-sm font-medium">#{o.orderNo}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("tr-TR")} • {o.status}
                  </div>
                </div>
                <div className="text-sm font-semibold text-emerald-400">₺{o.total.toLocaleString("tr-TR")}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
