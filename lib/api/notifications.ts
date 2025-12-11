import { getSupabaseServer } from "@/lib/supabase/server"
import { MonthlyDue, Student, NotificationTemplate } from "@/lib/types"

export async function getNotificationsData() {
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

  // Fetch monthly dues for "upcoming payments" logic
  // We need dues that are pending and due soon (e.g. within 7 days)
  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)
  
  const { data: dues, error: duesError } = await supabase
    .from("monthly_dues")
    .select("*, student:students(*)")
    .eq("tenant_id", tenantId)
    // We fetch all pending/overdue to filter in client or we can filter here
    // Let's fetch all active ones to be flexible
    .in("status", ["pending", "overdue"]) 

  if (duesError) {
    console.error("Error fetching dues for notifications:", duesError)
  }

  // Fetch all active students for "send to all" logic
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")

  if (studentsError) {
    console.error("Error fetching students:", studentsError)
  }

  // Fetch notification templates
  const { data: templates, error: templatesError } = await supabase
    .from("notification_templates")
    .select("*")
    // .eq("tenant_id", tenantId) // System templates might not have tenant_id or we need to handle that
    // Assuming templates are tenant specific or system wide. 
    // Let's assume tenant_id is used or null for system.
    .or(`tenant_id.eq.${tenantId},is_system.eq.true`)
    .eq("is_active", true)

  if (templatesError) {
    console.error("Error fetching templates:", templatesError)
  }

  return {
    dues: (dues || []) as MonthlyDue[],
    students: (students || []) as Student[],
    templates: (templates || []) as NotificationTemplate[],
    tenantId
  }
}
