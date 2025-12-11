import { getAdminDashboardStats, getAdminReportsData } from "@/lib/api/admin"
import ReportsClient from "./reports-client"

export default async function AdminReportsPage() {
  const stats = await getAdminDashboardStats()
  const monthlyData = await getAdminReportsData()

  return <ReportsClient stats={stats} monthlyData={monthlyData} />
}
