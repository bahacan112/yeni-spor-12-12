import { getSupabaseServer } from "@/lib/supabase/server"
import { Branch } from "@/lib/types"

export interface BranchWithCounts extends Branch {
  students: number
  instructors: number
}

export async function getBranchesData() {
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

  // Fetch branches
  const { data: branches, error } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_main", { ascending: false })
    .order("name")

  if (error) {
    console.error("Error fetching branches:", error)
    throw new Error("Failed to fetch branches")
  }

  // Map database fields to TS interface
  const formattedBranches: BranchWithCounts[] = (branches || []).map((branch: any) => ({
    id: branch.id,
    tenantId: branch.tenant_id,
    name: branch.name,
    address: branch.address,
    city: branch.city,
    district: branch.district,
    phone: branch.phone,
    email: branch.email,
    isMain: branch.is_main,
    isActive: branch.is_active,
    createdAt: branch.created_at,
    updatedAt: branch.updated_at,
    students: 0, // TODO: Implement count fetching
    instructors: 0 // TODO: Implement count fetching
  }))

  return {
    branches: formattedBranches,
    tenantId
  }
}
