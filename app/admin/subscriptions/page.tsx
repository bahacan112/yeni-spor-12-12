import { getAllSubscriptions } from "@/lib/api/admin"
import SubscriptionsClient from "./subscriptions-client"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminSubscriptionsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || userData.role !== "super_admin") redirect("/dashboard")

  const initialSubscriptions = await getAllSubscriptions()

  return <SubscriptionsClient initialSubscriptions={initialSubscriptions} />
}
