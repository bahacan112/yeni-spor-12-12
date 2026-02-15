import { getAdminDashboardStats, getAdminReportsData } from "@/lib/api/admin"
import ReportsClient from "./reports-client"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminReportsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || userData.role !== "super_admin") redirect("/dashboard")

  const [stats, monthlyData] = await Promise.all([
    getAdminDashboardStats(),
    getAdminReportsData(),
  ])

  return <ReportsClient stats={stats} monthlyData={monthlyData} />
}
