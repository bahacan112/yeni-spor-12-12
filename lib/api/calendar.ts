import { getSupabaseServer } from "@/lib/supabase/server";
import { Training } from "@/lib/types";

export async function getCalendarData(branchId?: string, month?: string) {
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

  const now = new Date();
  const base = month ? new Date(month) : now;
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);

  let trainingsQuery = supabase
    .from("trainings")
    .select(
      `
      *,
      instructor:instructors(*),
      group:groups(*),
      venue:venues(*)
    `
    )
    .eq("tenant_id", tenantId)
    .gte("training_date", start.toISOString())
    .lt("training_date", end.toISOString())
    .order("training_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (branchId) {
    trainingsQuery = trainingsQuery.eq("branch_id", branchId);
  }
  const { data: trainings } = await trainingsQuery;

  const mapped: Training[] = (trainings || []).map((t: any) => ({
    id: t.id,
    tenantId: t.tenant_id,
    branchId: t.branch_id,
    groupId: t.group_id ?? undefined,
    group: t.group
      ? {
          id: t.group.id,
          tenantId: t.group.tenant_id,
          branchId: t.group.branch_id,
          name: t.group.name,
          description: t.group.description ?? undefined,
          sportType: t.group.sport_type ?? undefined,
          capacity: t.group.capacity,
          monthlyFee: t.group.monthly_fee ?? undefined,
          instructorId: t.group.instructor_id ?? undefined,
          schedule: t.group.schedule ?? undefined,
          status: t.group.status,
          createdAt: t.group.created_at,
          updatedAt: t.group.updated_at,
        }
      : undefined,
    instructorId: t.instructor_id ?? undefined,
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
    venueId: t.venue_id ?? undefined,
    venue: t.venue
      ? {
          id: t.venue.id,
          tenantId: t.venue.tenant_id,
          branchId: t.venue.branch_id ?? undefined,
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
    title: t.title,
    description: t.description ?? undefined,
    trainingDate: t.training_date,
    startTime: t.start_time,
    endTime: t.end_time,
    status: t.status,
    notes: t.notes ?? undefined,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return { trainings: mapped, tenantId };
}

