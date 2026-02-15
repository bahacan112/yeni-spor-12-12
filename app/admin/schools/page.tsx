import { getAllTenants, getAllSubscriptions, getAllPlans } from "@/lib/api/admin"
import { SchoolsClient } from "./schools-client"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminSchoolsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || userData.role !== "super_admin") redirect("/dashboard")

  const [tenants, subscriptions, plans] = await Promise.all([
    getAllTenants(),
    getAllSubscriptions(),
    getAllPlans(),
  ])

  return <SchoolsClient tenants={tenants} subscriptions={subscriptions} plans={plans} />
}
