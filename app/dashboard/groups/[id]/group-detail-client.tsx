"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  MapPin,
  Edit,
  Plus,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Group, Student, Training } from "@/lib/types";

interface GroupDetailClientProps {
  group: Group;
  students: Student[];
  trainings: Training[];
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function GroupDetailClient({
  group,
  students,
  trainings,
}: GroupDetailClientProps) {
  const router = useRouter();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClient();

  // Edit states
  const [editGroupName, setEditGroupName] = useState(group.name);
  const [editSportType, setEditSportType] = useState(group.sportType || "");
  const [editBirthDateFrom, setEditBirthDateFrom] = useState(
    group.birthDateFrom || ""
  );
  const [editBirthDateTo, setEditBirthDateTo] = useState(
    group.birthDateTo || ""
  );
  const [editLicenseRequirement, setEditLicenseRequirement] = useState<string>(
    group.licenseRequirement || "any"
  );
  const [editCapacity, setEditCapacity] = useState(group.capacity.toString());
  const [editMonthlyFee, setEditMonthlyFee] = useState(
    group.monthlyFee?.toString() || ""
  );
  const [editInstructorId, setEditInstructorId] = useState(
    group.instructorId || ""
  );
  const [editDescription, setEditDescription] = useState(
    group.description || ""
  );

  const handleUpdateGroup = async () => {
    if (!editGroupName) {
      toast.error("Grup adı zorunlu");
      return;
    }

    const { error } = await supabase
      .from("groups")
      .update({
        name: editGroupName,
        sport_type: editSportType || null,
        birth_date_from: editBirthDateFrom || null,
        birth_date_to: editBirthDateTo || null,
        license_requirement: editLicenseRequirement,
        capacity: Number(editCapacity || 0),
        monthly_fee: Number(editMonthlyFee || 0),
        instructor_id: editInstructorId || null,
        description: editDescription || null,
      })
      .eq("id", group.id);

    if (error) {
      toast.error("Grup güncellenemedi");
      return;
    }

    toast.success("Grup güncellendi");
    setIsEditGroupOpen(false);
    router.refresh();
  };

  // Search students when query changes
  useEffect(() => {
    const searchStudents = async () => {
      setIsSearching(true);
      try {
        // Step 1: Search students
        let query = supabase.from("students").select("*").limit(50); // Increased limit

        // Filter by group's branch if available
        if (group.branchId) {
          query = query.eq("branch_id", group.branchId);
        }

        // Build OR filter manually only if search query exists
        if (searchQuery.trim()) {
          const searchTerm = `%${searchQuery}%`;
          query = query.or(
            `full_name.ilike.${searchTerm},student_no.ilike.${searchTerm},phone.ilike.${searchTerm}`
          );
        } else {
          // If no search query, maybe order by created_at desc to show newest students
          query = query.order("created_at", { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter out existing students and apply group criteria
        const existingIds = new Set(students.map((s) => s.id));
        const filtered = (data || []).filter((s: any) => {
          if (existingIds.has(s.id)) return false;

          // Check birth date criteria (String comparison is safer for YYYY-MM-DD)
          if (
            group.birthDateFrom &&
            s.birth_date &&
            s.birth_date < group.birthDateFrom
          )
            return false;
          if (
            group.birthDateTo &&
            s.birth_date &&
            s.birth_date > group.birthDateTo
          )
            return false;

          // Check license criteria
          // The database column is 'is_licensed' (boolean).
          // If group requires "unlicensed", we must ensure student is NOT licensed.
          // If student is licensed (true), they should be excluded.
          if (group.licenseRequirement === "licensed" && !s.is_licensed)
            return false;
          if (group.licenseRequirement === "unlicensed" && s.is_licensed)
            return false;

          return true;
        });

        // Map to Student type (simplified mapping)
        const mappedStudents = filtered.map((s: any) => ({
          id: s.id,
          fullName: s.full_name,
          studentNo: s.student_no,
          phone: s.phone,
          photoUrl: s.photo_url,
          // ... map other fields if needed for display
        })) as Student[];

        setSearchResults(mappedStudents);
      } catch (error) {
        console.error("Error searching students:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, students, supabase, group]);

  const addStudentToGroup = async (studentId: string) => {
    try {
      // Use upsert to handle re-adding students who were previously removed (soft deleted)
      // On conflict (student_id, group_id), we update the status to active and clear left_at
      const { error } = await supabase.from("student_groups").upsert(
        {
          student_id: studentId,
          group_id: group.id,
          status: "active",
          joined_at: new Date().toISOString().split("T")[0],
          left_at: null, // Clear left_at if it was set
        },
        { onConflict: "student_id,group_id" }
      );

      if (error) throw error;

      // Aidat oluşturma artık veritabanı tetikleyicisi ile yapılır

      toast.success("Öğrenci gruba eklendi");
      setIsAddStudentOpen(false);
      setSearchQuery("");
      router.refresh();
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Öğrenci eklenirken bir hata oluştu");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Öğrenciyi gruptan çıkarmak istediğinize emin misiniz?"))
      return;

    try {
      const { error } = await supabase
        .from("student_groups")
        .update({
          status: "left",
          left_at: new Date().toISOString().split("T")[0],
        })
        .eq("group_id", group.id)
        .eq("student_id", studentId)
        .eq("status", "active");

      if (error) throw error;

      toast.success("Öğrenci gruptan çıkarıldı");
      router.refresh();
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("İşlem başarısız oldu");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      monday: "Pazartesi",
      tuesday: "Salı",
      wednesday: "Çarşamba",
      thursday: "Perşembe",
      friday: "Cuma",
      saturday: "Cumartesi",
      sunday: "Pazar",
    };
    return days[day] || day;
  };

  const capacityPercent = group.studentCount
    ? (group.studentCount / group.capacity) * 100
    : 0;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Grup Detayı</h1>
      </div>

      {/* Group Info Card */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-500/20">
                <Users className="h-7 w-7 text-teal-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{group.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{group.sportType}</span>
                  <span>•</span>
                  <span>{group.ageGroup}</span>
                </div>
              </div>
            </div>
            <Sheet open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 bg-transparent"
                >
                  <Edit className="h-3 w-3" />
                  Düzenle
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[85vh] rounded-t-xl overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Grubu Düzenle</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Grup Adı</Label>
                    <Input
                      placeholder="Örn: U12 Basketbol A"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Spor Branşı</Label>
                    <Select
                      value={editSportType}
                      onValueChange={setEditSportType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Branş seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basketball">Basketbol</SelectItem>
                        <SelectItem value="football">Futbol</SelectItem>
                        <SelectItem value="volleyball">Voleybol</SelectItem>
                        <SelectItem value="swimming">Yüzme</SelectItem>
                        <SelectItem value="tennis">Tenis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Doğum Tarihi Başlangıç</Label>
                      <Input
                        type="date"
                        value={editBirthDateFrom}
                        onChange={(e) => setEditBirthDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Doğum Tarihi Bitiş</Label>
                      <Input
                        type="date"
                        value={editBirthDateTo}
                        onChange={(e) => setEditBirthDateTo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Lisans Gereksinimi</Label>
                      <Select
                        value={editLicenseRequirement}
                        onValueChange={setEditLicenseRequirement}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Herhangi</SelectItem>
                          <SelectItem value="licensed">
                            Sadece Lisanslı
                          </SelectItem>
                          <SelectItem value="unlicensed">
                            Sadece Lisanssız
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kapasite</Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Aylık Ücret (₺)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={editMonthlyFee}
                      onChange={(e) => setEditMonthlyFee(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      placeholder="Grup hakkında notlar..."
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleUpdateGroup}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Grubu Güncelle
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Instructor */}
          {group.instructor && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={group.instructor.photoUrl || "/placeholder.svg"}
                />
                <AvatarFallback
                  name={group.instructor.fullName}
                  className="bg-purple-500/20 text-purple-500"
                />
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {group.instructor.fullName}
                </p>
                <p className="text-xs text-muted-foreground">Eğitmen</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {group.studentCount || 0}/{group.capacity}
              </p>
              <p className="text-xs text-muted-foreground">Öğrenci</p>
              <Progress value={capacityPercent} className="h-1.5 mt-2" />
            </div>
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(group.monthlyFee || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Aylık Ücret</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Card */}
      {group.schedule && (
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Haftalık Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(group.schedule).map(([day, times]) => (
              <div
                key={day}
                className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
              >
                <span className="font-medium">{getDayName(day)}</span>
                <div className="flex items-center gap-2">
                  {times.map((time, i) => (
                    <Badge key={i} variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="students">Öğrenciler</TabsTrigger>
          <TabsTrigger value="trainings">Antrenmanlar</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4 space-y-2">
          <div className="flex justify-end">
            <Sheet open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Öğrenci Ekle
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Öğrenci Ekle</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput
                      placeholder="İsim veya numara ara..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchQuery
                          ? "Öğrenci bulunamadı."
                          : "Aramak için yazın..."}
                      </CommandEmpty>
                      <CommandGroup heading="Sonuçlar">
                        {searchResults.map((student) => (
                          <CommandItem
                            key={student.id}
                            onSelect={() => addStudentToGroup(student.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={student.photoUrl || "/placeholder.svg"}
                                />
                                <AvatarFallback
                                  name={student.fullName}
                                  className="bg-primary/20 text-xs"
                                />
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {student.fullName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  #{student.studentNo}{" "}
                                  {student.phone && `• ${student.phone}`}
                                </span>
                              </div>
                              <Plus className="ml-auto h-4 w-4 text-muted-foreground" />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {students.map((student) => (
            <Card key={student.id} className="bg-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.photoUrl || "/placeholder.svg"} />
                    <AvatarFallback
                      name={student.fullName}
                      className="bg-primary/20"
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      #{student.studentNo}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/dashboard/students/${student.id}`)
                        }
                      >
                        Profili Gör
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        Gruptan Çıkar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
          {students.length === 0 && (
            <div className="text-center p-4 text-muted-foreground">
              Henüz öğrenci yok
            </div>
          )}
        </TabsContent>

        <TabsContent value="trainings" className="mt-4 space-y-2">
          {trainings.length > 0 ? (
            trainings.map((training) => (
              <Card key={training.id} className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{training.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(training.trainingDate).toLocaleDateString(
                            "tr-TR"
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {training.startTime}
                        </span>
                        {training.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {training.venue.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={
                        training.status === "completed"
                          ? "bg-green-500/20 text-green-500"
                          : training.status === "cancelled"
                          ? "bg-red-500/20 text-red-500"
                          : "bg-blue-500/20 text-blue-500"
                      }
                    >
                      {training.status === "completed"
                        ? "Tamamlandı"
                        : training.status === "cancelled"
                        ? "İptal"
                        : "Planlandı"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Henüz antrenman planlanmamış
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
