import { getAllNotifications, getAllTenants } from "@/lib/api/admin"
import { NotificationsClient } from "./notifications-client"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminNotificationsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || userData.role !== "super_admin") redirect("/dashboard")

  const [notifications, tenants] = await Promise.all([
    getAllNotifications(),
    getAllTenants(),
  ])

  return <NotificationsClient notifications={notifications} tenants={tenants} />
}
