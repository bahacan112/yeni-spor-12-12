"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Clock, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Training, Student, Attendance } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AttendanceClientProps {
  trainings: Training[];
  students: Student[];
  initialAttendance: Attendance[];
  tenantId: string;
}

type AttendanceStatus = "present" | "absent" | "late" | "excused" | null;

export function AttendanceClient({
  trainings,
  students,
  initialAttendance,
  tenantId,
}: AttendanceClientProps) {
  const router = useRouter();
  const supabase = createClient();
  // Filter trainings for today or relevant ones
  const today = new Date().toDateString();
  const todaysTrainings = trainings.filter(
    (t) => new Date(t.trainingDate).toDateString() === today
  );

  // If no trainings today, show all or handle gracefully.
  // For demo purposes, if no trainings today, we might show nothing or just the first one from list if any.
  // Let's fallback to all trainings if none today, to show *something*.
  const displayTrainings =
    todaysTrainings.length > 0 ? todaysTrainings : trainings.slice(0, 5);

  const [selectedTraining, setSelectedTraining] = useState<
    Training | undefined
  >(displayTrainings[0]);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, AttendanceStatus>
  >({});
  // Prefill from existing attendance when training changes
  const currentAttendanceMap = (trainingId?: string) => {
    if (!trainingId) return {} as Record<string, AttendanceStatus>;
    const rows = initialAttendance.filter((a) => a.trainingId === trainingId);
    const map: Record<string, AttendanceStatus> = {};
    rows.forEach((a) => {
      map[a.studentId] = (a.status as AttendanceStatus) ?? null;
    });
    return map;
  };
  // Initialize from first selected
  const [initialized, setInitialized] = useState(false);
  if (!initialized && selectedTraining) {
    setAttendanceData(currentAttendanceMap(selectedTraining.id));
    setInitialized(true);
  }

  // Filter students for the selected training's group
  // If training has no group, maybe show all active students?
  const trainingStudents = selectedTraining?.groupId
    ? students.filter((s) => {
        // We need to know if student is in the group.
        // Our student list from API doesn't have group info embedded deeply for all.
        // We might need to fetch student_groups.
        // For now, let's just show all active students if we can't filter easily,
        // OR better, pass students with group info.
        // The `getStudentsData` returns `students` and `groups`.
        // Let's assume for this "Quick Attendance" we just list all active students
        // or simplistic filtering if possible.
        // Since we don't have student-group relation in the simple `students` list,
        // we'll just show all active students for now to replace the mock.
        return s.status === "active";
      })
    : students.filter((s) => s.status === "active");

  const handleAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }));
  };

  // When training tab changes, refresh map from existing rows
  const onTrainingChange = (v: string) => {
    const tr = displayTrainings.find((t) => t.id === v);
    setSelectedTraining(tr);
    setAttendanceData(currentAttendanceMap(tr?.id));
  };

  const getAttendanceCount = (status: AttendanceStatus) => {
    return Object.values(attendanceData).filter((s) => s === status).length;
  };

  const handleSave = async () => {
    if (!selectedTraining) {
      toast.error("Antrenman seçili değil");
      return;
    }
    const rows = Object.entries(attendanceData)
      .filter(([_, status]) => !!status)
      .map(([studentId, status]) => ({
        training_id: selectedTraining.id,
        student_id: studentId,
        status,
        marked_at: new Date().toISOString(),
      }));
    if (rows.length === 0) {
      toast.error("Yoklama seçimi yok");
      return;
    }
    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "training_id,student_id" });
    if (error) {
      toast.error("Yoklama kaydedilemedi");
      return;
    }
    toast.success("Yoklama kaydedildi");
    router.push("/dashboard");
  };

  if (displayTrainings.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Hızlı Yoklama</h1>
        </div>
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Bugün için planlanmış antrenman bulunamadı.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Hızlı Yoklama</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Training Selection */}
      <Tabs
        defaultValue={selectedTraining?.id}
        onValueChange={onTrainingChange}
      >
        <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          {displayTrainings.map((training) => (
            <TabsTrigger
              key={training.id}
              value={training.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4"
            >
              {training.startTime}
            </TabsTrigger>
          ))}
        </TabsList>

        {displayTrainings.map((training) => (
          <TabsContent key={training.id} value={training.id} className="mt-4">
            <Card className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{training.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {training.group?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {training.startTime} - {training.endTime} •{" "}
                      {training.venue?.name}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {training.instructor?.fullName}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Attendance Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-500">
              {getAttendanceCount("present")}
            </p>
            <p className="text-xs text-muted-foreground">Geldi</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-red-500">
              {getAttendanceCount("absent")}
            </p>
            <p className="text-xs text-muted-foreground">Gelmedi</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-amber-500">
              {getAttendanceCount("late")}
            </p>
            <p className="text-xs text-muted-foreground">Geç</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-blue-500">
              {getAttendanceCount("excused")}
            </p>
            <p className="text-xs text-muted-foreground">İzinli</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Öğrenciler ({trainingStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {trainingStudents.map((student) => {
            const status = attendanceData[student.id];
            return (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={student.photoUrl || "/placeholder.svg"} />
                  <AvatarFallback
                    name={student.fullName}
                    className="bg-primary/20 text-xs"
                  />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{student.fullName}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant={status === "present" ? "default" : "outline"}
                    className={`h-9 w-9 ${
                      status === "present"
                        ? "bg-green-500 hover:bg-green-600"
                        : ""
                    }`}
                    onClick={() => handleAttendance(student.id, "present")}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={status === "absent" ? "default" : "outline"}
                    className={`h-9 w-9 ${
                      status === "absent" ? "bg-red-500 hover:bg-red-600" : ""
                    }`}
                    onClick={() => handleAttendance(student.id, "absent")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={status === "late" ? "default" : "outline"}
                    className={`h-9 w-9 ${
                      status === "late" ? "bg-amber-500 hover:bg-amber-600" : ""
                    }`}
                    onClick={() => handleAttendance(student.id, "late")}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button className="w-full" size="lg" onClick={handleSave}>
        Yoklamayı Kaydet
      </Button>
    </div>
  );
}
