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

  // Fetch branch stats: Students
  const { data: studentsData } = await supabase
    .from("students")
    .select("branch_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    
  const branchStudentsCount: Record<string, number> = {}
  if (studentsData) {
    studentsData.forEach(s => {
      branchStudentsCount[s.branch_id] = (branchStudentsCount[s.branch_id] || 0) + 1
    })
  }
  
  // Fetch branch stats: Instructors (mapped through groups)
  const { data: groupsData } = await supabase
    .from("groups")
    .select("branch_id, instructor_id")
    .eq("tenant_id", tenantId)
    .not("instructor_id", "is", null)
    
  const branchInstructorsSet: Record<string, Set<string>> = {}
  if (groupsData) {
    groupsData.forEach(g => {
      if (g.instructor_id) {
        if (!branchInstructorsSet[g.branch_id]) {
          branchInstructorsSet[g.branch_id] = new Set()
        }
        branchInstructorsSet[g.branch_id].add(g.instructor_id)
      }
    })
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
    students: branchStudentsCount[branch.id] || 0,
    instructors: branchInstructorsSet[branch.id]?.size || 0
  }))

  return {
    branches: formattedBranches,
    tenantId
  }
}
