import { getSupabaseServer } from "@/lib/supabase/server";
import { Training } from "@/lib/types";

export async function getTrainingsData(branchId?: string) {
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

  // Fetch trainings with relations
  let trainingsQuery = supabase
    .from("trainings")
    .select(
      `
      *,
      instructor:instructors(*),
      group:groups(*),
      venue:venues(*)
    `,
    )
    .eq("tenant_id", tenantId)
    .order("training_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (branchId) {
    trainingsQuery = trainingsQuery.eq("branch_id", branchId);
  }
  const { data: trainings, error } = await trainingsQuery;

  if (error) {
    console.error("Error fetching trainings:", error);
    throw new Error("Failed to fetch trainings");
  }

  // Compute student counts per group for trainings
  const groupIds = Array.from(
    new Set(
      (trainings || []).map((t: any) => t.group_id).filter((id: any) => !!id),
    ),
  );
  let groupCounts: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: sgRows } = await supabase
      .from("student_groups")
      .select("group_id")
      .in("group_id", groupIds as any)
      .eq("status", "active");
    groupCounts = (sgRows || []).reduce(
      (acc: Record<string, number>, row: any) => {
        const gid = String(row.group_id);
        acc[gid] = (acc[gid] || 0) + 1;
        return acc;
      },
      {},
    );
  }

  const formattedTrainings = (trainings || []).map((t: any) => ({
    id: t.id,
    tenantId: t.tenant_id,
    branchId: t.branch_id,
    groupId: t.group_id ?? undefined,
    instructorId: t.instructor_id ?? undefined,
    venueId: t.venue_id ?? undefined,
    title: t.title,
    description: t.description ?? undefined,
    trainingDate: t.training_date,
    startTime: t.start_time,
    endTime: t.end_time,
    status: t.status,
    notes: t.notes ?? undefined,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    instructor: t.instructor
      ? {
          id: t.instructor.id,
          tenantId: t.instructor.tenant_id,
          userId: t.instructor.user_id ?? undefined,
          fullName: t.instructor.full_name,
          phone: t.instructor.phone ?? undefined,
          email: t.instructor.email ?? undefined,
          specialization: t.instructor.specialization ?? undefined,
          bio: t.instructor.bio ?? undefined,
          photoUrl: t.instructor.photo_url ?? undefined,
          hourlyRate: t.instructor.hourly_rate ?? undefined,
          status: t.instructor.status,
          createdAt: t.instructor.created_at,
          updatedAt: t.instructor.updated_at,
        }
      : undefined,
    group: t.group
      ? {
          id: t.group.id,
          tenantId: t.group.tenant_id,
          branchId: t.group.branch_id,
          name: t.group.name,
          description: t.group.description ?? undefined,
          sportType: t.group.sport_type ?? undefined,
          ageGroup: t.group.age_group ?? undefined,
          capacity: t.group.capacity,
          monthlyFee: t.group.monthly_fee ?? undefined,
          instructorId: t.group.instructor_id ?? undefined,
          schedule: t.group.schedule ?? undefined,
          status: t.group.status,
          studentCount:
            typeof groupCounts[String(t.group_id)] === "number"
              ? groupCounts[String(t.group_id)]
              : undefined,
          createdAt: t.group.created_at,
          updatedAt: t.group.updated_at,
        }
      : undefined,
    venue: t.venue
      ? {
          id: t.venue.id,
          tenantId: t.venue.tenant_id,
          branchId: t.venue.branch_id,
          name: t.venue.name,
          type: t.venue.type ?? undefined,
          capacity: t.venue.capacity ?? undefined,
          hourlyRate: t.venue.hourly_rate ?? undefined,
          address: t.venue.address ?? undefined,
          description: t.venue.description ?? undefined,
          amenities: t.venue.amenities ?? [],
          isActive: t.venue.is_active,
          createdAt: t.venue.created_at,
          updatedAt: t.venue.updated_at,
        }
      : undefined,
  }));

  // Fetch dropdown data
  const { data: instructors } = await supabase
    .from("instructors")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("full_name");

  let groupsQuery = supabase
    .from("groups")
    .select("*, sport:sports(*)")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("name");
  if (branchId) {
    groupsQuery = groupsQuery.eq("branch_id", branchId);
  }
  const { data: groups } = await groupsQuery;

  let venuesQuery = supabase
    .from("venues")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");
  // Venues are tenant-level, so we don't filter by branch
  // if (branchId) {
  //   venuesQuery = venuesQuery.eq("branch_id", branchId);
  // }
  const { data: venues } = await venuesQuery;

  const formattedInstructors = (instructors || []).map((i: any) => ({
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
  }));

  const formattedGroups = (groups || []).map((g: any) => ({
    id: g.id,
    tenantId: g.tenant_id,
    branchId: g.branch_id,
    name: g.name,
    description: g.description,
    sportType: g.sport?.name || g.sport_type,
    sportId: g.sport?.id,
    sport: g.sport
      ? { id: g.sport.id, name: g.sport.name, slug: g.sport.slug }
      : undefined,
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

  const formattedVenues = (venues || []).map((v: any) => ({
    id: v.id,
    tenantId: v.tenant_id,
    branchId: v.branch_id,
    name: v.name,
    type: v.type,
    capacity: v.capacity ?? undefined,
    hourlyRate: v.hourly_rate ?? undefined,
    address: v.address,
    description: v.description,
    amenities: v.amenities ?? [],
    isActive: v.is_active,
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  }));

  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("is_main", { ascending: false })
    .order("name");
  const formattedBranches = (branches || []).map((b: any) => ({
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
    trainings: formattedTrainings as Training[],
    instructors: formattedInstructors,
    groups: formattedGroups,
    venues: formattedVenues,
    branches: formattedBranches,
    tenantId,
  };
}
