"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Training, Instructor, Group, Venue } from "@/lib/types";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

interface TrainingsClientProps {
  initialTrainings: Training[];
  instructors: Instructor[];
  groups: Group[];
  venues: Venue[];
  tenantId: string;
}

export function TrainingsClient({
  initialTrainings,
  instructors,
  groups,
  venues,
  tenantId,
}: TrainingsClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const toLocalISODate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const [isNewTrainingOpen, setIsNewTrainingOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [groupId, setGroupId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [notes, setNotes] = useState("");
  const [trainingDate, setTrainingDate] = useState<string>(
    toLocalISODate(selectedDate)
  );
  const { currentBranch } = useAuthStore();
  const [selectedTrainingForAttendance, setSelectedTrainingForAttendance] =
    useState<Training | null>(null);
  const [selectedTrainingForEdit, setSelectedTrainingForEdit] =
    useState<Training | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTrainingDate, setEditTrainingDate] = useState<string>(
    toLocalISODate(selectedDate)
  );
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("10:30");
  const [editGroupId, setEditGroupId] = useState("");
  const [editInstructorId, setEditInstructorId] = useState("");
  const [editVenueId, setEditVenueId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<
    "scheduled" | "completed" | "cancelled"
  >("scheduled");
  const [trainingStudents, setTrainingStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, "present" | "absent" | "late" | "excused" | null>
  >({});
  const attendanceCounts = useMemo(() => {
    const vals = Object.values(attendanceData);
    return {
      present: vals.filter((v) => v === "present").length,
      absent: vals.filter((v) => v === "absent").length,
      late: vals.filter((v) => v === "late").length,
      excused: vals.filter((v) => v === "excused").length,
    };
  }, [attendanceData]);

  const trainings = initialTrainings;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
            Planlandı
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
            Tamamlandı
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
            İptal
          </Badge>
        );
      default:
        return null;
    }
  };

  // Generate week days
  const weekDays = [];
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(day.getDate() + i);
    weekDays.push(day);
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Filter trainings for selected date (compare YYYY-MM-DD to avoid TZ issues)
  const selectedDateStr = toLocalISODate(selectedDate);
  const filteredTrainings = trainings.filter(
    (t) => t.trainingDate === selectedDateStr
  );

  const openAttendance = async (training: Training) => {
    setSelectedTrainingForAttendance(training);
    setAttendanceData({});
    setIsAttendanceOpen(true);
    if (training.groupId) {
      const { data, error } = await supabase
        .from("student_groups")
        .select("student:students(*)")
        .eq("group_id", training.groupId)
        .eq("status", "active");
      if (error) {
        toast.error("Öğrenciler alınamadı");
        setTrainingStudents([]);
        return;
      }
      const mapped = (data || [])
        .map((sg: any) => sg.student)
        .filter((s: any) => s)
        .map((s: any) => ({
          id: s.id,
          fullName: s.full_name,
          photoUrl: s.photo_url,
          status: s.status,
        }))
        .filter((s: any) => s.status === "active");
      setTrainingStudents(mapped);
    } else {
      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, photo_url, status")
        .eq("tenant_id", tenantId)
        .eq("status", "active");
      if (error) {
        toast.error("Öğrenciler alınamadı");
        setTrainingStudents([]);
        return;
      }
      const mapped = (data || []).map((s: any) => ({
        id: s.id,
        fullName: s.full_name,
        photoUrl: s.photo_url,
        status: s.status,
      }));
      setTrainingStudents(mapped);
    }
    // Prefill attendance data for this training
    const { data: existing, error: attErr } = await supabase
      .from("attendance")
      .select("student_id,status")
      .eq("training_id", training.id);
    if (!attErr && existing) {
      const map: Record<
        string,
        "present" | "absent" | "late" | "excused" | null
      > = {};
      existing.forEach((row: any) => {
        map[row.student_id] = row.status as any;
      });
      setAttendanceData(map);
    }
  };

  const openEdit = (training: Training) => {
    setSelectedTrainingForEdit(training);
    setEditTitle(training.title);
    setEditTrainingDate(training.trainingDate);
    setEditStartTime(training.startTime);
    setEditEndTime(training.endTime);
    setEditGroupId(training.groupId || "");
    setEditInstructorId(training.instructorId || "");
    setEditVenueId(training.venueId || "");
    setEditNotes(training.notes || "");
    setEditStatus(training.status);
    setIsEditOpen(true);
  };

  const setAttendance = (
    studentId: string,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }));
  };

  const saveAttendance = async () => {
    if (!selectedTrainingForAttendance) {
      toast.error("Antrenman seçili değil");
      return;
    }
    const rows = Object.entries(attendanceData)
      .filter(([_, status]) => !!status)
      .map(([studentId, status]) => ({
        training_id: selectedTrainingForAttendance.id,
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
    setIsAttendanceOpen(false);
  };

  const venueOptions = useMemo(() => {
    // If no branch filter or specific logic needed, return all venues
    // The user requested to show all venues since they are tenant-level
    return venues;
  }, [venues]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Antrenmanlar</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(selectedDate)}
          </p>
        </div>
        <Sheet open={isNewTrainingOpen} onOpenChange={setIsNewTrainingOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Antrenman</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[90vh] rounded-t-xl overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>Yeni Antrenman Planla</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Antrenman Başlığı</Label>
                <Input
                  placeholder="Örn: U12 Sabah Antrenmanı"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={trainingDate}
                  onChange={(e) => setTrainingDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Başlangıç Saati</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Saati</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grup</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grup seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                    {!groups?.length && (
                      <SelectItem value="none" disabled>
                        Grup bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Eğitmen</Label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Eğitmen seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors?.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.fullName}
                      </SelectItem>
                    ))}
                    {!instructors?.length && (
                      <SelectItem value="none" disabled>
                        Eğitmen bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Saha / Tesis</Label>
                <Select value={venueId} onValueChange={setVenueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Saha seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {venueOptions?.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                    {!venueOptions?.length && (
                      <SelectItem value="none" disabled>
                        Saha bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  placeholder="Antrenman detayları..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={async () => {
                  if (!title) {
                    toast.error("Başlık zorunlu");
                    return;
                  }
                  const branchIdForInsert =
                    groups?.find((g) => g.id === groupId)?.branchId ??
                    venues?.find((v) => v.id === venueId)?.branchId ??
                    currentBranch?.id ??
                    null;
                  if (!branchIdForInsert) {
                    toast.error("Şube zorunlu");
                    return;
                  }
                  const { error } = await supabase.from("trainings").insert({
                    tenant_id: tenantId,
                    branch_id: branchIdForInsert,
                    title,
                    training_date: trainingDate,
                    start_time: startTime,
                    end_time: endTime,
                    group_id: groupId || null,
                    instructor_id: instructorId || null,
                    venue_id: venueId || null,
                    status: "scheduled",
                    notes,
                  });
                  if (error) {
                    toast.error("Antrenman oluşturulamadı");
                    return;
                  }
                  setIsNewTrainingOpen(false);
                  location.reload();
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Antrenmanı Planla
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Week Navigation */}
      <Card className="bg-card">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateDate(-7)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {weekDays[0].toLocaleDateString("tr-TR", { month: "short" })}{" "}
              {weekDays[0].getDate()} - {weekDays[6].getDate()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateDate(7)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center justify-center rounded-lg p-2 transition-colors ${
                  isSelected(day)
                    ? "bg-primary text-primary-foreground"
                    : isToday(day)
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-secondary"
                }`}
              >
                <span className="text-xs">
                  {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][i]}
                </span>
                <span className="text-lg font-semibold">{day.getDate()}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training List */}
      <div className="space-y-3">
        {filteredTrainings.length > 0 ? (
          filteredTrainings.map((training) => (
            <Card
              key={training.id}
              className="bg-card cursor-pointer"
              onClick={() => openAttendance(training)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Time */}
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold">
                      {training.startTime}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {training.endTime}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(training);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Düzenle
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="w-1 self-stretch rounded-full bg-primary/20" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{training.title}</p>
                        {training.group && (
                          <p className="text-sm text-muted-foreground">
                            {training.group.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(training.status)}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {training.instructor && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={
                                training.instructor.photoUrl ||
                                "/placeholder.svg"
                              }
                            />
                            <AvatarFallback
                              name={training.instructor.fullName}
                              className="text-xs"
                            />
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {training.instructor.fullName}
                          </span>
                        </div>
                      )}
                      {training.venue && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {training.venue.name}
                        </span>
                      )}
                      {training.group && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {training.group.studentCount || 0} öğrenci
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Bu tarihte antrenman yok</p>
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => setIsNewTrainingOpen(true)}
              >
                Antrenman Ekle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Yoklama</SheetTitle>
          </SheetHeader>
          {selectedTrainingForAttendance && (
            <div className="mt-4 space-y-4">
              <Card className="bg-secondary/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {selectedTrainingForAttendance.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedTrainingForAttendance.group?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTrainingForAttendance.startTime} -{" "}
                        {selectedTrainingForAttendance.endTime} •{" "}
                        {selectedTrainingForAttendance.venue?.name}
                      </p>
                    </div>
                    {selectedTrainingForAttendance.instructor?.fullName && (
                      <Badge variant="outline">
                        {selectedTrainingForAttendance.instructor?.fullName}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-4 gap-2">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-green-500">
                      {attendanceCounts.present}
                    </p>
                    <p className="text-xs text-muted-foreground">Geldi</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-red-500">
                      {attendanceCounts.absent}
                    </p>
                    <p className="text-xs text-muted-foreground">Gelmedi</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-amber-500">
                      {attendanceCounts.late}
                    </p>
                    <p className="text-xs text-muted-foreground">Geç</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-lg font-bold text-blue-500">
                      {attendanceCounts.excused}
                    </p>
                    <p className="text-xs text-muted-foreground">İzinli</p>
                  </CardContent>
                </Card>
              </div>

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
                          <AvatarImage
                            src={student.photoUrl || "/placeholder.svg"}
                          />
                          <AvatarFallback
                            name={student.fullName}
                            className="bg-primary/20 text-xs"
                          />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {student.fullName}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant={
                              status === "present" ? "default" : "outline"
                            }
                            className={`h-9 w-9 ${
                              status === "present"
                                ? "bg-green-500 hover:bg-green-600"
                                : ""
                            }`}
                            onClick={() => setAttendance(student.id, "present")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant={
                              status === "absent" ? "default" : "outline"
                            }
                            className={`h-9 w-9 ${
                              status === "absent"
                                ? "bg-red-500 hover:bg-red-600"
                                : ""
                            }`}
                            onClick={() => setAttendance(student.id, "absent")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant={status === "late" ? "default" : "outline"}
                            className={`h-9 w-9 ${
                              status === "late"
                                ? "bg-amber-500 hover:bg-amber-600"
                                : ""
                            }`}
                            onClick={() => setAttendance(student.id, "late")}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Button className="w-full" size="lg" onClick={saveAttendance}>
                Yoklamayı Kaydet
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Antrenmanı Düzenle</SheetTitle>
          </SheetHeader>
          {selectedTrainingForEdit && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Antrenman Başlığı</Label>
                <Input
                  placeholder="Başlık"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={editTrainingDate}
                  onChange={(e) => setEditTrainingDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Başlangıç Saati</Label>
                  <Input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Saati</Label>
                  <Input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grup</Label>
                <Select value={editGroupId} onValueChange={setEditGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grup seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                    {!groups?.length && (
                      <SelectItem value="none" disabled>
                        Grup bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Eğitmen</Label>
                <Select
                  value={editInstructorId}
                  onValueChange={setEditInstructorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Eğitmen seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors?.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.fullName}
                      </SelectItem>
                    ))}
                    {!instructors?.length && (
                      <SelectItem value="none" disabled>
                        Eğitmen bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Saha / Tesis</Label>
                <Select value={editVenueId} onValueChange={setEditVenueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Saha seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {venueOptions?.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                    {!venueOptions?.length && (
                      <SelectItem value="none" disabled>
                        Saha bulunamadı
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) =>
                    setEditStatus(v as "scheduled" | "completed" | "cancelled")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Planlandı</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  placeholder="Antrenman detayları..."
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={async () => {
                  if (!selectedTrainingForEdit) {
                    toast.error("Antrenman seçili değil");
                    return;
                  }
                  if (!editTitle) {
                    toast.error("Başlık zorunlu");
                    return;
                  }
                  const { error } = await supabase
                    .from("trainings")
                    .update({
                      title: editTitle,
                      training_date: editTrainingDate,
                      start_time: editStartTime,
                      end_time: editEndTime,
                      group_id: editGroupId || null,
                      instructor_id: editInstructorId || null,
                      venue_id: editVenueId || null,
                      status: editStatus,
                      notes: editNotes,
                    })
                    .eq("id", selectedTrainingForEdit.id);
                  if (error) {
                    toast.error("Antrenman güncellenemedi");
                    return;
                  }
                  toast.success("Antrenman güncellendi");
                  setIsEditOpen(false);
                  location.reload();
                }}
              >
                Kaydet
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
