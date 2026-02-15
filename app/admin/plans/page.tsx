import { getAllPlans } from "@/lib/api/admin"
import { PlansClient } from "./plans-client"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminPlansPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || userData.role !== "super_admin") redirect("/dashboard")

  const plans = await getAllPlans()

  return <PlansClient plans={plans} />
}
