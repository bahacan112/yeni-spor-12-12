import { getTenantDetails, getAllPlans } from "@/lib/api/admin"
import SchoolDetailClient from "./school-detail-client"
import { notFound, redirect } from "next/navigation"
import { getSupabaseServer } from "@/lib/supabase/server"

export default async function AdminSchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (!userData || userData.role !== "super_admin") redirect("/dashboard")

  const { id } = await params;
  const [tenant, plans] = await Promise.all([
    getTenantDetails(id),
    getAllPlans(),
  ])
  
  if (!tenant) {
    notFound();
  }

  return <SchoolDetailClient tenant={tenant} plans={plans} />;
}
