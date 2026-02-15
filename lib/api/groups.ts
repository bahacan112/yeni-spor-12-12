import { getSupabaseServer } from "@/lib/supabase/server";
import { Group, Student, Training, Branch } from "@/lib/types";

export async function getGroupsData(branchId?: string) {
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

  let groupsQuery = supabase
    .from("groups")
    .select(
      "*, instructor:instructors!fk_groups_instructor(*), sport:sports!fk_groups_sport(*)"
    )
    .eq("tenant_id", tenantId)
    .order("name");
  if (branchId) {
    groupsQuery = groupsQuery.eq("branch_id", branchId);
  }
  const { data: groups, error } = await groupsQuery;

  if (error) {
    console.error("Error fetching groups:", error);
    throw new Error("Failed to fetch groups");
  }

  // Calculate student counts for each group and map to typed shape
  const groupsWithCounts = await Promise.all(
    groups.map(async (group: any) => {
      const { count } = await supabase
        .from("student_groups")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id)
        .eq("status", "active");

      const mappedInstructor = group.instructor
        ? {
            id: group.instructor.id,
            tenantId: group.instructor.tenant_id,
            userId: group.instructor.user_id,
            fullName: group.instructor.full_name,
            phone: group.instructor.phone,
            email: group.instructor.email,
            specialization: group.instructor.specialization,
            bio: group.instructor.bio,
            photoUrl: group.instructor.photo_url,
            hourlyRate: group.instructor.hourly_rate,
            status: group.instructor.status,
            createdAt: group.instructor.created_at,
            updatedAt: group.instructor.updated_at,
          }
        : undefined;

      return {
        id: group.id,
        tenantId: group.tenant_id,
        branchId: group.branch_id,
        name: group.name,
        description: group.description,
        sportType: group.sport?.name || group.sport_type,
        sportId: group.sport?.id,
        sport: group.sport
          ? {
              id: group.sport.id,
              name: group.sport.name,
              slug: group.sport.slug,
            }
          : undefined,
        birthDateFrom: group.birth_date_from,
        birthDateTo: group.birth_date_to,
        licenseRequirement: group.license_requirement,
        capacity: group.capacity,
        monthlyFee: group.monthly_fee,
        instructorId: group.instructor_id,
        instructor: mappedInstructor as any,
        schedule: group.schedule,
        status: group.status,
        studentCount: count || 0,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
      } as Group;
    })
  );

  // Fetch instructors for dropdown
  const { data: instructors } = await supabase
    .from("instructors")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("full_name");

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
    hourlyRate: i.hourly_rate,
    status: i.status,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
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
  })) as Branch[];

  const { data: sports } = await supabase
    .from("sports")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  const formattedSports = (sports || []).map((s: any) => ({
    id: String(s.id),
    name: String(s.name),
    slug: s.slug ? String(s.slug) : undefined,
  }));

  return {
    groups: groupsWithCounts as Group[],
    instructors: formattedInstructors as any[],
    branches: formattedBranches,
    tenantId,
    sports: formattedSports,
  };
}

export async function getGroupDetails(groupId: string) {
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

  // Fetch group details
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*, instructor:instructors!fk_groups_instructor(*)")
    .eq("id", groupId)
    .eq("tenant_id", tenantId)
    .single();

  if (groupError || !group) {
    console.error("Error fetching group:", groupError);
    return null;
  }

  // Fetch students in group
  const { data: studentGroupRows, error: sgError } = await supabase
    .from("student_groups")
    .select("student_id")
    .eq("group_id", groupId)
    .eq("status", "active");
  if (sgError) {
    console.error("Error fetching group students:", sgError);
  }
  const studentIds = Array.from(
    new Set(
      (studentGroupRows || []).map((r: any) => r.student_id).filter(Boolean)
    )
  );
  let students: Student[] = [];
  if (studentIds.length > 0) {
    const { data: studentRows, error: sErr } = await supabase
      .from("students")
      .select("*")
      .in("id", studentIds);
    if (sErr) {
      console.error("Error fetching students:", sErr);
    } else {
      students = (studentRows || []).map((s: any) => ({
        id: s.id,
        tenantId: s.tenant_id,
        branchId: s.branch_id,
        userId: s.user_id,
        studentNo: s.student_no,
        fullName: s.full_name,
        birthDate: s.birth_date,
        gender: s.gender,
        phone: s.phone,
        email: s.email,
        address: s.address,
        photoUrl: s.photo_url,
        registrationDate: s.registration_date,
        status: s.status,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })) as Student[];
    }
  }

  // Fetch trainings
  const { data: trainings, error: trainingsError } = await supabase
    .from("trainings")
    .select("*, venue:venues(*)")
    .eq("group_id", groupId)
    .order("training_date", { ascending: true });

  if (trainingsError) {
    console.error("Error fetching group trainings:", trainingsError);
  }

  // Get student count
  const { count } = await supabase
    .from("student_groups")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("status", "active");

  const mappedInstructor = group.instructor
    ? {
        id: group.instructor.id,
        tenantId: group.instructor.tenant_id,
        userId: group.instructor.user_id,
        fullName: group.instructor.full_name,
        phone: group.instructor.phone,
        email: group.instructor.email,
        specialization: group.instructor.specialization,
        bio: group.instructor.bio,
        photoUrl: group.instructor.photo_url,
        hourlyRate: group.instructor.hourly_rate,
        status: group.instructor.status,
        createdAt: group.instructor.created_at,
        updatedAt: group.instructor.updated_at,
      }
    : undefined;

  const groupWithCount: Group = {
    id: group.id,
    tenantId: group.tenant_id,
    branchId: group.branch_id,
    name: group.name,
    description: group.description,
    sportType: group.sport?.name || group.sport_type,
    sportId: group.sport?.id,
    sport: group.sport
      ? {
          id: group.sport.id,
          name: group.sport.name,
          slug: group.sport.slug,
        }
      : undefined,
    birthDateFrom: group.birth_date_from,
    birthDateTo: group.birth_date_to,
    licenseRequirement: group.license_requirement,
    capacity: group.capacity,
    monthlyFee: group.monthly_fee,
    instructorId: group.instructor_id,
    instructor: mappedInstructor as any,
    schedule: group.schedule,
    status: group.status,
    studentCount: count || 0,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
  };

  const mappedTrainings = (trainings || []).map((t: any) => ({
    id: t.id,
    tenantId: t.tenant_id,
    branchId: t.branch_id,
    groupId: t.group_id,
    title: t.title,
    description: t.description,
    trainingDate: t.training_date,
    startTime: t.start_time,
    endTime: t.end_time,
    status: t.status,
    venueId: t.venue_id,
    venue: t.venue
      ? {
          id: t.venue.id,
          tenantId: t.venue.tenant_id,
          branchId: t.venue.branch_id,
          name: t.venue.name,
          type: t.venue.type,
          capacity: t.venue.capacity,
          address: t.venue.address,
          description: t.venue.description,
          isActive: t.venue.is_active,
          createdAt: t.venue.created_at,
          updatedAt: t.venue.updated_at,
        }
      : undefined,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  })) as Training[];

  return {
    group: groupWithCount,
    students,
    trainings: mappedTrainings,
  };
}
