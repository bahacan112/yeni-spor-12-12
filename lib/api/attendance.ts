import { getSupabaseServer } from "@/lib/supabase/server";
import { Training, Student, Attendance } from "@/lib/types";

export async function getAttendanceData(branchId?: string) {
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

  // Fetch trainings (filtering for recent/upcoming could be better, but let's fetch all active)
  // Or fetch for today/this week.
  // Let's fetch for today +/- 7 days to be safe and efficient.
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

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
    .gte("training_date", lastWeek.toISOString())
    .lte("training_date", nextWeek.toISOString())
    .order("training_date", { ascending: true });
  if (branchId) {
    trainingsQuery = trainingsQuery.eq("branch_id", branchId);
  }
  const { data: trainings, error: trainingsError } = await trainingsQuery;

  if (trainingsError) {
    console.error("Error fetching trainings:", trainingsError);
  }

  // Fetch active students
  let studentsQuery = supabase
    .from("students")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("full_name");
  if (branchId) {
    studentsQuery = studentsQuery.eq("branch_id", branchId);
  }
  const { data: students, error: studentsError } = await studentsQuery;

  if (studentsError) {
    console.error("Error fetching students:", studentsError);
  }

  // Fetch existing attendance for fetched trainings
  const trainingIds = (trainings || []).map((t: any) => t.id);
  let attendance: Attendance[] = [];
  if (trainingIds.length > 0) {
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .in("training_id", trainingIds);
    if (attendanceError) {
      console.error("Error fetching attendance:", attendanceError);
    } else {
      attendance = (attendanceRows || []).map((a: any) => ({
        id: a.id,
        trainingId: a.training_id,
        studentId: a.student_id,
        status: a.status,
        notes: a.notes,
        markedBy: a.marked_by,
        markedAt: a.marked_at,
        createdAt: a.created_at,
      })) as Attendance[];
    }
  }

  return {
    trainings: (trainings || []) as Training[],
    students: (students || []).map((s: any) => ({
      id: s.id,
      tenantId: s.tenant_id,
      branchId: s.branch_id,
      userId: s.user_id,
      studentNo: s.student_no,
      fullName: s.full_name || "",
      birthDate: s.birth_date,
      isLicensed: s.is_licensed,
      licenseNo: s.license_no,
      licenseIssuedAt: s.license_issued_at,
      licenseExpiresAt: s.license_expires_at,
      licenseFederation: s.license_federation,
      gender: s.gender,
      phone: s.phone,
      email: s.email,
      address: s.address,
      emergencyContactName: s.emergency_contact_name,
      emergencyContactPhone: s.emergency_contact_phone,
      photoUrl: s.photo_url,
      registrationDate: s.registration_date,
      status: s.status,
      notes: s.notes,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    })) as Student[],
    attendance,
    tenantId,
  };
}
