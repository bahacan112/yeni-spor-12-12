import { getSupabaseServer } from "@/lib/supabase/server";
import { Instructor, Group } from "@/lib/types";

export async function getInstructorsData() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!userData?.tenant_id) {
    throw new Error("Tenant not found");
  }

  const tenantId = userData.tenant_id;

  // Fetch instructors
  const { data: instructors, error: instructorsError } = await supabase
    .from("instructors")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("full_name", { ascending: true });

  if (instructorsError) {
    console.error("Error fetching instructors:", instructorsError);
    throw new Error("Failed to fetch instructors");
  }

  // Fetch groups to show which instructor has which groups
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("*")
    .eq("tenant_id", tenantId);

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
    throw new Error("Failed to fetch groups");
  }

  const formattedInstructors: Instructor[] = (instructors || []).map(
    (i: any) => ({
      id: i.id,
      tenantId: i.tenant_id,
      userId: i.user_id,
      fullName: i.full_name,
      phone: i.phone,
      email: i.email,
      specialization: i.specialization,
      bio: i.bio,
      photoUrl: i.photo_url,
      hourlyRate: i.hourly_rate ?? undefined,
      status: i.status,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    })
  );

  const formattedGroups: Group[] = (groups || []).map((g: any) => ({
    id: g.id,
    tenantId: g.tenant_id,
    branchId: g.branch_id,
    name: g.name,
    description: g.description,
    sportType: g.sport_type,
    ageGroup: g.age_group,
    capacity: g.capacity,
    monthlyFee: g.monthly_fee ?? undefined,
    instructorId: g.instructor_id ?? undefined,
    schedule: g.schedule ?? undefined,
    status: g.status,
    studentCount: g.student_count ?? undefined,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }));

  return {
    instructors: formattedInstructors,
    groups: formattedGroups,
    tenantId,
  };
}
