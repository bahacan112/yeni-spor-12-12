import { getSupabaseServer } from "@/lib/supabase/server";
import { Venue, Branch } from "@/lib/types";

export async function getVenuesData() {
  const supabase = await getSupabaseServer();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get user's tenant_id
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!userData?.tenant_id) {
    throw new Error("Tenant not found");
  }

  const tenantId = userData.tenant_id;

  // Fetch venues
  const { data: venues, error } = await supabase
    .from("venues")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) {
    console.error("Error fetching venues:", error);
    throw new Error("Failed to fetch venues");
  }

  const mapped: Venue[] = (venues || []).map((v: any) => ({
    id: v.id,
    tenantId: v.tenant_id,
    branchId: v.branch_id,
    name: v.name,
    type: v.type,
    capacity: v.capacity,
    hourlyRate: v.hourly_rate,
    address: v.address,
    description: v.description,
    amenities: v.amenities || [],
    isActive: v.is_active,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  }));

  const { data: branchesData, error: branchesError } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_main", { ascending: false });

  if (branchesError) {
    console.error("Error fetching branches:", branchesError);
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
    updatedAt: b.updated_at,
  }));

  return {
    tenantId,
    venues: mapped,
    branches,
  };
}
