import { getSupabaseServer } from "@/lib/supabase/server";

export type SetupStep = {
  key:
    | "branches"
    | "instructors"
    | "sports"
    | "groups"
    | "venues"
    | "students"
    | "trainings";
  name: string;
  completed: boolean;
  count: number;
  link: string;
};

export type SetupStatus = {
  status: "Başlanmadı" | "Devam Ediyor" | "Tamamlandı";
  isComplete: boolean;
  currentStepIndex: number;
  steps: SetupStep[];
  tenantId: string;
};

export async function getSetupStatus(): Promise<SetupStatus> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (userError || !userData?.tenant_id) {
    throw new Error("Tenant not found");
  }
  const tenantId = userData.tenant_id;

  const [
    { count: branchesCount },
    { count: instructorsCount },
    { count: sportsCount },
    { count: groupsCount },
    { count: venuesCount },
    { count: studentsCount },
    { count: trainingsCount },
  ] = await Promise.all([
    supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("instructors")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase
      .from("sports")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true),
    supabase
      .from("groups")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "active"),
    supabase
      .from("venues")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_active", true),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .neq("status", "graduated"),
    supabase
      .from("trainings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["scheduled", "completed"]),
  ]);

  const steps: SetupStep[] = [
    {
      key: "branches",
      name: "Şube Tanımlama",
      completed: (branchesCount || 0) > 0,
      count: branchesCount || 0,
      link: "/dashboard/branches",
    },
    {
      key: "instructors",
      name: "Eğitmen Tanımlama",
      completed: (instructorsCount || 0) > 0,
      count: instructorsCount || 0,
      link: "/dashboard/instructors",
    },
    {
      key: "sports",
      name: "Branş Tanımlama",
      completed: (sportsCount || 0) > 0,
      count: sportsCount || 0,
      link: "/dashboard/sports",
    },
    {
      key: "groups",
      name: "Grup Tanımlama",
      completed: (groupsCount || 0) > 0,
      count: groupsCount || 0,
      link: "/dashboard/groups",
    },
    {
      key: "venues",
      name: "Saha / Salon Tanımlama",
      completed: (venuesCount || 0) > 0,
      count: venuesCount || 0,
      link: "/dashboard/venues",
    },
    {
      key: "students",
      name: "Öğrenci Tanımlama",
      completed: (studentsCount || 0) > 0,
      count: studentsCount || 0,
      link: "/dashboard/students",
    },
    {
      key: "trainings",
      name: "Antrenman Tanımlama",
      completed: (trainingsCount || 0) > 0,
      count: trainingsCount || 0,
      link: "/dashboard/trainings",
    },
  ];

  const currentStepIndex = steps.findIndex((s) => !s.completed);
  const isComplete = currentStepIndex === -1;
  const allIncomplete = steps.every((s) => !s.completed);
  const status: SetupStatus["status"] = isComplete
    ? "Tamamlandı"
    : allIncomplete
    ? "Başlanmadı"
    : "Devam Ediyor";

  return {
    status,
    isComplete,
    currentStepIndex,
    steps,
    tenantId,
  };
}
