"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Clock, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trainingId = String(params?.id || "");
  const [students, setStudents] = useState<
    { id: string; name: string; status: string | null }[]
  >([]);
  const [meta, setMeta] = useState<{
    group: string;
    date: string;
    time: string;
    venue: string;
    branch?: string;
  }>({
    group: "",
    date: "",
    time: "",
    venue: "",
    branch: "",
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      const { data: instructor } = await supabase
        .from("instructors")
        .select("*")
        .eq("user_id", uid)
        .eq("status", "active")
        .maybeSingle();
      const { data: training } = await supabase
        .from("trainings")
        .select(`*, group:groups(*), venue:venues(*), branch:branches(name)`)
        .eq("id", trainingId)
        .maybeSingle();
      if (!training) {
        setLoading(false);
        return;
      }
      if (!instructor || training.instructor_id !== instructor.id) {
        setLoading(false);
        setStudents([]);
        return;
      }
      setMeta({
        group: training.group?.name || training.title || "",
        date: training.training_date,
        time: `${training.start_time} - ${training.end_time}`,
        venue: training.venue?.name || "",
        branch: training.branch?.name || "",
      });
      let studentsList: { id: string; name: string; status: string | null }[] =
        [];
      if (training.group?.id) {
        const { data } = await supabase
          .from("student_groups")
          .select(`student_id, students(*)`)
          .eq("group_id", training.group.id)
          .eq("status", "active");
        const uniq = new Map<
          string,
          { id: string; name: string; status: string | null }
        >();
        for (const row of data || []) {
          const sid = row.students?.id;
          const name = row.students?.full_name || "";
          if (sid && !uniq.has(sid)) {
            uniq.set(sid, { id: sid, name, status: null });
          }
        }
        studentsList = Array.from(uniq.values());
      }
      const { data: attendanceRows } = await supabase
        .from("attendance")
        .select("*")
        .eq("training_id", trainingId);
      if (attendanceRows?.length) {
        const map = new Map<string, string>();
        for (const a of attendanceRows) {
          map.set(a.student_id, a.status);
        }
        studentsList = studentsList.map((s) => ({
          ...s,
          status: map.get(s.id) || null,
        }));
      }
      setStudents(studentsList);
      setLoading(false);
    };
    if (trainingId) run();
  }, [trainingId]);

  const updateStatus = (studentId: string, status: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "present" })));
  };

  const presentCount = useMemo(
    () => students.filter((s) => s.status === "present").length,
    [students]
  );
  const absentCount = useMemo(
    () => students.filter((s) => s.status === "absent").length,
    [students]
  );
  const lateCount = useMemo(
    () => students.filter((s) => s.status === "late").length,
    [students]
  );

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = getSupabaseClient();
    await supabase.from("attendance").delete().eq("training_id", trainingId);
    const payload = students
      .filter((s) => s.status)
      .map((s) => ({
        training_id: trainingId,
        student_id: s.id,
        status: s.status,
        notes: notes || null,
        marked_at: new Date().toISOString(),
      }));
    if (payload.length > 0) {
      const { error } = await supabase.from("attendance").insert(payload);
      if (error) {
        setIsSaving(false);
        return;
      }
    }
    await supabase
      .from("trainings")
      .update({ status: "completed" })
      .eq("id", trainingId);
    setIsSaving(false);
    router.push("/instructor/attendance");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/instructor/attendance">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{meta.group}</h1>
          <p className="text-slate-400">
            {meta.date ? new Date(meta.date).toLocaleDateString("tr-TR") : ""} •{" "}
            {meta.time} • {meta.venue}
            {meta.branch ? ` • ${meta.branch}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">
              {presentCount}
            </p>
            <p className="text-xs text-emerald-400">Geldi</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-red-400">Gelmedi</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{lateCount}</p>
            <p className="text-xs text-amber-400">Geç Kaldı</p>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={markAllPresent}
        variant="outline"
        className="w-full border-slate-700 text-slate-300 bg-transparent"
      >
        <Users className="mr-2 h-4 w-4" />
        Tümünü Geldi İşaretle
      </Button>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Öğrenciler</CardTitle>
          <CardDescription className="text-slate-400">
            Her öğrenci için durum seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="p-4 text-slate-400">Yükleniyor...</div>
          ) : (
            students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={`/.jpg?height=40&width=40&query=${student.name}`}
                    />
                    <AvatarFallback className="bg-slate-700 text-white text-sm">
                      {student.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-white">{student.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={
                      student.status === "present" ? "default" : "outline"
                    }
                    className={
                      student.status === "present"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "border-slate-700 text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                    }
                    onClick={() => updateStatus(student.id, "present")}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      student.status === "absent" ? "default" : "outline"
                    }
                    className={
                      student.status === "absent"
                        ? "bg-red-600 hover:bg-red-700"
                        : "border-slate-700 text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-600"
                    }
                    onClick={() => updateStatus(student.id, "absent")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={student.status === "late" ? "default" : "outline"}
                    className={
                      student.status === "late"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "border-slate-700 text-slate-400 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                    }
                    onClick={() => updateStatus(student.id, "late")}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Antrenman Notları</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Antrenman hakkında notlarınızı yazın..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white min-h-24"
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
      </Button>
    </div>
  );
}
