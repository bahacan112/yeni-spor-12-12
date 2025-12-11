import { getSupabaseServer } from "@/lib/supabase/server"
import { Tenant, Branch } from "@/lib/types"

export async function getTenantData() {
  const supabase = await getSupabaseServer()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Get user's tenant_id
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (!userData?.tenant_id) {
    throw new Error("Tenant not found")
  }

  const tenantId = userData.tenant_id

  // Fetch tenant details
  const { data: tenantData, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single()

  if (tenantError) {
    console.error("Error fetching tenant:", tenantError)
    throw new Error("Failed to fetch tenant")
  }

  // Map snake_case to camelCase
  const tenant: Tenant = {
    id: tenantData.id,
    name: tenantData.name,
    slug: tenantData.slug,
    logoUrl: tenantData.logo_url,
    primaryColor: tenantData.primary_color,
    secondaryColor: tenantData.secondary_color,
    email: tenantData.email,
    phone: tenantData.phone,
    websiteEnabled: tenantData.website_enabled,
    websiteDomain: tenantData.website_domain,
    subscriptionPlan: tenantData.subscription_plan,
    subscriptionStatus: tenantData.subscription_status,
    subscriptionExpiresAt: tenantData.subscription_expires_at,
    isLimited: tenantData.is_limited,
    maxStudents: tenantData.max_students,
    maxGroups: tenantData.max_groups,
    createdAt: tenantData.created_at,
    updatedAt: tenantData.updated_at
  }

  // Fetch branches
  const { data: branchesData, error: branchesError } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)

  if (branchesError) {
    console.error("Error fetching branches:", branchesError)
  }

  const branches: Branch[] = (branchesData || []).map((b: any) => ({
    id: b.id,
    tenantId: b.tenant_id,
    name: b.name,
    address: b.address,
    city: b.city,
    district: b.district,
    phone: b.phone,
    email: b.email,
    isMain: b.is_main,
    isActive: b.is_active,
    createdAt: b.created_at,
    updatedAt: b.updated_at
  }))

  // Get usage stats
  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .neq("status", "graduated") // Active or passive students

  const { count: groupCount } = await supabase
    .from("groups")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)

  return {
    tenant,
    branches,
    stats: {
      studentCount: studentCount || 0,
      groupCount: groupCount || 0,
      branchCount: branches?.length || 0
    }
  }
}
