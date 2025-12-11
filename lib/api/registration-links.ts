import { getSupabaseServer } from "@/lib/supabase/server"
import { RegistrationLink } from "@/lib/types"

export async function getRegistrationLinksData() {
  const supabase = await getSupabaseServer()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (!userData?.tenant_id) throw new Error("Tenant not found")
  const tenantId = userData.tenant_id

  // Fetch Registration Links
  const { data: links, error } = await supabase
    .from("registration_links")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching registration links:", error)
    throw new Error("Failed to fetch registration links")
  }

  const formattedLinks: RegistrationLink[] = (links || []).map((link: any) => ({
    id: link.id,
    tenantId: link.tenant_id,
    branchId: link.branch_id,
    groupId: link.group_id,
    code: link.code, // Usually the same as slug
    title: link.title,
    description: link.description,
    maxUses: link.max_uses,
    usedCount: link.used_count || 0,
    expiresAt: link.expires_at,
    isActive: link.is_active,
    createdBy: link.created_by,
    createdAt: link.created_at
  }))

  return {
    links: formattedLinks,
    tenantId
  }
}
