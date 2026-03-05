"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = {
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

type Props = {
  tenantId: string;
  initialSteps: Step[];
};

export default function SetupClient({ tenantId, initialSteps }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<
    { id: string; name: string; isMain: boolean }[]
  >([]);
  const currentIndex = useMemo(
    () => steps.findIndex((s) => !s.completed),
    [steps]
  );
  const isComplete = currentIndex === -1;

  const fetchBranches = async () => {
    const { data } = await supabase
      .from("branches")
      .select("id, name, is_main")
      .eq("tenant_id", tenantId);
    setBranches(
      (data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        isMain: !!b.is_main,
      }))
    );
  };

  useEffect(() => {
    fetchBranches();
  }, [tenantId]);

  useEffect(() => {
    if (isComplete) {
      router.replace("/dashboard");
    }
  }, [isComplete, router]);

  const refreshCounts = async () => {
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
    const nextSteps: Step[] = [
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
    setSteps(nextSteps);
  };

  const onAfterSubmit = async () => {
    await Promise.all([refreshCounts(), fetchBranches()]);
  };

  const BranchForm = () => {
    const [name, setName] = useState("");
    const [isMain, setIsMain] = useState(true);
    const submit = async () => {
      setLoading(true);
      await supabase.from("branches").insert({
        tenant_id: tenantId,
        name,
        is_main: isMain,
        is_active: true,
      });
      setLoading(false);
      await onAfterSubmit();
    };
    return (
      <div className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Şube adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isMain}
            onChange={(e) => setIsMain(e.target.checked)}
          />
          Ana şube
        </label>
        <button
          disabled={!name || loading}
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-primary-foreground"
        >
          Kaydet ve Devam Et
        </button>
      </div>
    );
  };

  const InstructorForm = () => {
    const [fullName, setFullName] = useState("");
    const submit = async () => {
      setLoading(true);
      await supabase.from("instructors").insert({
        tenant_id: tenantId,
        full_name: fullName,
        status: "active",
      });
      setLoading(false);
      await onAfterSubmit();
    };
    return (
      <div className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Eğitmen adı"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <button
          disabled={!fullName || loading}
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-primary-foreground"
        >
          Kaydet ve Devam Et
        </button>
      </div>
    );
  };

  const SportForm = () => {
    const [name, setName] = useState("");
    const submit = async () => {
      setLoading(true);
      await supabase.from("sports").insert({
        tenant_id: tenantId,
        name,
        is_active: true,
      });
      setLoading(false);
      await onAfterSubmit();
    };
    return (
      <div className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Branş adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={!name || loading}
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-primary-foreground"
        >
          Kaydet ve Devam Et
        </button>
      </div>
    );
  };

  const GroupForm = () => {
    const [name, setName] = useState("");
    const [branchId, setBranchId] = useState("");
    const [monthlyFee, setMonthlyFee] = useState("");

    // Update branchId when branches load or change
    useEffect(() => {
      if (!branchId && branches.length > 0) {
        setBranchId(branches.find((b) => b.isMain)?.id || branches[0].id);
      }
    }, [branches, branchId]);

    const submit = async () => {
      setLoading(true);
      await supabase.from("groups").insert({
        tenant_id: tenantId,
        branch_id: branchId,
        name,
        status: "active",
        license_requirement: "any",
        monthly_fee: monthlyFee ? Number(monthlyFee) : null,
      });
      setLoading(false);
      await onAfterSubmit();
    };
    return (
      <div className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Grup adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          <option value="">Şube seçin</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Aylık ücret (opsiyonel)"
          value={monthlyFee}
          onChange={(e) => setMonthlyFee(e.target.value)}
        />
        <button
          disabled={!name || !branchId || loading}
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-primary-foreground"
        >
          Kaydet ve Devam Et
        </button>
      </div>
    );
  };

  const VenueForm = () => {
    const [name, setName] = useState("");
    const submit = async () => {
      setLoading(true);
      await supabase.from("venues").insert({
        tenant_id: tenantId,
        name,
        is_active: true,
      });
      setLoading(false);
      await onAfterSubmit();
    };
    return (
      <div className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Saha/Salon adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={!name || loading}
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-primary-foreground"
        >
          Kaydet ve Devam Et
        </button>
      </div>
    );
  };

  const StudentForm = () => {
    const [fullName, setFullName] = useState("");
    const [branchId, setBranchId] = useState("");
    const [groups, setGroups] = useState<any[]>([]);
    const [groupId, setGroupId] = useState("");
    const [monthlyFee, setMonthlyFee] = useState("");

    // Update branchId when branches load or change
    useEffect(() => {
      if (!branchId && branches.length > 0) {
        setBranchId(branches.find((b) => b.isMain)?.id || branches[0].id);
      }
    }, [branches, branchId]);

    useEffect(() => {
      if (branchId) {
        supabase
          .from("groups")
          .select("id, name, monthly_fee")
          .eq("tenant_id", tenantId)
          .eq("branch_id", branchId)
          .eq("status", "active")
          .then(({ data }: { data: any }) => {
            setGroups(data || []);
            setGroupId("");
            setMonthlyFee("");
          });
      }
    }, [branchId, tenantId, supabase]);

    const handleGroupChange = (e: any) => {
      const gid = e.target.value;
      setGroupId(gid);
      const g = groups.find((x) => x.id === gid);
      if (g && g.monthly_fee !== null) setMonthlyFee(g.monthly_fee.toString());
      else setMonthlyFee("");
    };

    const [birthDate, setBirthDate] = useState<string>("");
    const [gender, setGender] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [emergencyName, setEmergencyName] = useState<string>("");
    const [emergencyPhone, setEmergencyPhone] = useState<string>("");
    
    const submit = async () => {
      setLoading(true);
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .insert({
          tenant_id: tenantId,
          branch_id: branchId,
          full_name: fullName,
          birth_date: birthDate || null,
          gender: gender || null,
          phone: phone || null,
          email: email || null,
          emergency_contact_name: emergencyName || null,
          emergency_contact_phone: emergencyPhone || null,
          status: "active",
        })
        .select("id")
        .single();

      if (!studentError && studentData && groupId) {
        await supabase.from("student_groups").insert({
          tenant_id: tenantId,
          student_id: studentData.id,
          group_id: groupId,
          status: "active",
          monthly_fee: monthlyFee ? Number(monthlyFee) : null,
          enrollment_date: new Date().toISOString().split("T")[0],
        });
      }

      setLoading(false);
      await onAfterSubmit();
    };
    return (
      <div className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Öğrenci adı"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">Şube seçin</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={groupId}
            onChange={handleGroupChange}
          >
            <option value="">Grup seçin (Opsiyonel)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        {groupId && (
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Aylık Aidat (Opsiyonel)"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(e.target.value)}
            type="number"
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Doğum tarihi"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Cinsiyet seçin</option>
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
            <option value="other">Diğer</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Acil durum kişi adı"
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
          />
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Acil durum telefonu"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
          />
        </div>
        <button
          disabled={
            !fullName || !branchId || !birthDate || !gender || !phone || loading
          }
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-primary-foreground"
        >
          Kaydet ve Devam Et
        </button>
      </div>
    );
  };

  const TrainingForm = () => {
    const [title, setTitle] = useState("");
    const [branchId, setBranchId] = useState("");

    // Update branchId when branches load or change
    useEffect(() => {
      if (!branchId && branches.length > 0) {
        setBranchId(branches.find((b) => b.isMain)?.id || branches[0].id);
      }
    }, [branches, branchId]);

    const [trainingDate, setTrainingDate] = useState<string>(
      new Date().toISOString().slice(0, 10)
    );
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const submit = async () => {
      setLoading(true);
      await supabase.from("trainings").insert({
        tenant_id: tenantId,
        branch_id: branchId,
        title,
        training_date: trainingDate,
        start_time: startTime,
        end_time: endTime,
        status: "scheduled",
      });
      setLoading(false);
      await onAfterSubmit();
    };
    return (
      <div className="space-y-3">
        <input
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Antrenman başlığı"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          <option value="">Şube seçin</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={trainingDate}
            onChange={(e) => setTrainingDate(e.target.value)}
          />
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <button
          disabled={!title || !branchId || loading}
          onClick={submit}
          className="px-3 py-2 rounded bg-primary text-primary-foreground"
        >
          Kaydet ve Tamamla
        </button>
      </div>
    );
  };

  const renderForm = () => {
    if (isComplete) return null;
    const step = steps[currentIndex];
    if (step.key === "branches") return <BranchForm />;
    if (step.key === "instructors") return <InstructorForm />;
    if (step.key === "sports") return <SportForm />;
    if (step.key === "groups") return <GroupForm />;
    if (step.key === "venues") return <VenueForm />;
    if (step.key === "students") return <StudentForm />;
    if (step.key === "trainings") return <TrainingForm />;
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">
            {isComplete ? "Kurulum Tamamlandı" : steps[currentIndex]?.name}
          </div>
          {!isComplete && (
            <div className="text-sm text-muted-foreground">
              Adımı tamamlayın, otomatik olarak sonraki adıma geçiş yapılır.
            </div>
          )}
        </div>
        <div className="p-4">{renderForm()}</div>
      </div>
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">Adımlar</div>
        </div>
        <ul className="divide-y">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <li
                key={step.key}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full ${
                      step.completed
                        ? "bg-green-500"
                        : isCurrent
                        ? "bg-yellow-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <div>
                    <div className="font-medium">{step.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Mevcut: {step.count}
                    </div>
                  </div>
                </div>
                <Link href={step.link} className="text-sm underline">
                  Görüntüle
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
