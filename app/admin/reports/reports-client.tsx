"use client"

import { useState } from "react"
import { TrendingUp, Download, Calendar, Users, CreditCard, School } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminDashboardStats } from "@/lib/types"

interface ReportsClientProps {
  stats: AdminDashboardStats
  monthlyData: {
    month: string
    revenue: number
    newSchools: number
    activeSchools: number
  }[]
}

const reportTypes = [
  {
    id: "revenue",
    title: "Gelir Raporu",
    description: "Aylık/yıllık platform gelirleri",
    icon: CreditCard,
    color: "text-green-500",
  },
  {
    id: "schools",
    title: "Okul Raporu",
    description: "Okul kayıt ve aktivite istatistikleri",
    icon: School,
    color: "text-blue-500",
  },
  {
    id: "users",
    title: "Kullanıcı Raporu",
    description: "Toplam kullanıcı ve öğrenci sayıları",
    icon: Users,
    color: "text-purple-500",
  },
  {
    id: "subscriptions",
    title: "Abonelik Raporu",
    description: "Abonelik durumları ve dönüşüm oranları",
    icon: TrendingUp,
    color: "text-orange-500",
  },
]

export default function ReportsClient({ stats, monthlyData }: ReportsClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Raporlar</h1>
          <p className="text-sm text-slate-400">Platform analiz ve raporları</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-800 text-white">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="week">Bu Hafta</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
              <SelectItem value="quarter">Bu Çeyrek</SelectItem>
              <SelectItem value="year">Bu Yıl</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Toplam Gelir</p>
                <p className="text-2xl font-bold text-white">₺{stats.totalRevenue.toLocaleString("tr-TR")}</p>
                <p className="text-xs text-green-500">+{stats.monthlyRevenue.toLocaleString("tr-TR")} bu ay</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <CreditCard className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Aktif Okullar</p>
                <p className="text-2xl font-bold text-white">{stats.activeTenants}</p>
                <p className="text-xs text-green-500">+{stats.recentSignups} bu ay</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <School className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-white">{stats.totalStudents.toLocaleString("tr-TR")}</p>
                <p className="text-xs text-green-500">Aktif Kayıtlar</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Dönüşüm Oranı</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalTenants > 0 
                    ? `%${Math.round((stats.activeTenants / stats.totalTenants) * 100)}` 
                    : "%0"}
                </p>
                <p className="text-xs text-green-500">Aktif / Toplam</p>
              </div>
              <div className="rounded-full bg-orange-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Rapor Tipleri</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reportTypes.map((report) => (
            <Card
              key={report.id}
              className={`bg-slate-900 border-slate-800 cursor-pointer transition-colors hover:border-slate-700 ${
                selectedReport === report.id ? "border-blue-500" : ""
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg bg-slate-800 p-2 ${report.color}`}>
                    <report.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base">{report.title}</CardTitle>
                    <CardDescription className="text-slate-400">{report.description}</CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Monthly Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Aylık Trend</CardTitle>
              <CardDescription className="text-slate-400">Son 6 aylık gelir ve okul sayıları</CardDescription>
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-300 bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Excel İndir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple Bar Chart representation */}
            <div className="flex items-end justify-between gap-2 h-48">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all"
                    style={{ 
                        height: `${Math.max(5, (data.revenue / (Math.max(...monthlyData.map(d => d.revenue)) || 1)) * 100)}%` 
                    }}
                  />
                  <span className="text-xs text-slate-400">{data.month}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-500" />
                <span className="text-sm text-slate-400">Gelir</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span className="text-sm text-slate-400">Yeni Okullar</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Detaylı Veriler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-3 text-left text-sm font-medium text-slate-400">Ay</th>
                  <th className="pb-3 text-right text-sm font-medium text-slate-400">Gelir</th>
                  <th className="pb-3 text-right text-sm font-medium text-slate-400">Yeni Okul</th>
                  <th className="pb-3 text-right text-sm font-medium text-slate-400">Aktif Okul</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data) => (
                  <tr key={data.month} className="border-b border-slate-800/50">
                    <td className="py-3 text-white">{data.month}</td>
                    <td className="py-3 text-right text-white">₺{data.revenue.toLocaleString("tr-TR")}</td>
                    <td className="py-3 text-right text-green-500">+{data.newSchools}</td>
                    <td className="py-3 text-right text-slate-300">{data.activeSchools || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
