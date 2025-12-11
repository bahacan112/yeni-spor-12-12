import { getSupabaseServer } from "@/lib/supabase/server";
import { Application } from "@/lib/types";

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export async function getApplicationsData() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!userData?.tenant_id) throw new Error("Tenant not found");
  const tenantId = userData.tenant_id;

  // Fetch Applications
  const { data: applications, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      preferredGroup:groups(name)
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    throw new Error("Failed to fetch applications");
  }

  // Calculate Stats
  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter((a) => a.status === "pending").length || 0,
    approved: applications?.filter((a) => a.status === "approved").length || 0,
    rejected: applications?.filter((a) => a.status === "rejected").length || 0,
  };

  const formattedApplications: Application[] = (applications || []).map(
    (app: any) => ({
      id: app.id,
      tenantId: app.tenant_id,
      branchId: app.branch_id,
      registrationLinkId: app.registration_link_id,
      fullName: app.full_name,
      birthDate: app.birth_date,
      gender: app.gender,
      phone: app.phone,
      email: app.email,
      guardianName: app.guardian_name,
      guardianPhone: app.guardian_phone,
      address: app.address,
      preferredGroupId: app.preferred_group_id,
      preferredGroup: app.preferredGroup, // Joined data
      message: app.message,
      status: app.status,
      notes: app.notes,
      processedBy: app.processed_by,
      processedAt: app.processed_at,
      createdAt: app.created_at,
    })
  );

  return {
    applications: formattedApplications,
    stats,
  };
}
