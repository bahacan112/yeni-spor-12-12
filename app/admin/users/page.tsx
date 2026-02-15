import { getAdminUsers } from "@/lib/api/admin"
import UsersClient from "./users-client"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminUsersPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || userData.role !== "super_admin") redirect("/dashboard")

  const initialUsers = await getAdminUsers()

  return <UsersClient initialUsers={initialUsers} />
}
