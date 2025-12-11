"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MoreVertical,
  User,
  Briefcase,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Instructor, Group } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface InstructorsClientProps {
  initialInstructors: Instructor[];
  groups: Group[];
  tenantId: string;
}

export function InstructorsClient({
  initialInstructors,
  groups,
  tenantId,
}: InstructorsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewInstructorOpen, setIsNewInstructorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(
    null
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarInstructor, setCalendarInstructor] =
    useState<Instructor | null>(null);
  const [calendarTrainings, setCalendarTrainings] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    specialization: "",
    hourlyRate: "",
    bio: "",
  });

  const instructors = initialInstructors;

  const searchLower = searchQuery.toLowerCase();
  const filteredInstructors = instructors.filter((instructor) => {
    const nameLower = (instructor.fullName || "").toLowerCase();
    const specLower = (instructor.specialization || "").toLowerCase();
    return nameLower.includes(searchLower) || specLower.includes(searchLower);
  });

  const getInstructorGroups = (instructorId: string) => {
    return groups.filter((g) => g.instructorId === instructorId);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName) {
      toast.error("Lütfen eğitmen adını giriniz");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingInstructor) {
        const { error } = await supabase
          .from("instructors")
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            specialization: formData.specialization,
            hourly_rate: formData.hourlyRate
              ? parseFloat(formData.hourlyRate)
              : null,
            bio: formData.bio,
          })
          .eq("id", editingInstructor.id);
        if (error) throw error;
        toast.success("Eğitmen başarıyla güncellendi");
      } else {
        const { error } = await supabase.from("instructors").insert({
          tenant_id: tenantId,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          specialization: formData.specialization,
          hourly_rate: formData.hourlyRate
            ? parseFloat(formData.hourlyRate)
            : null,
          bio: formData.bio,
          status: "active",
        });
        if (error) throw error;
        toast.success("Eğitmen başarıyla kaydedildi");
      }
      setIsNewInstructorOpen(false);
      setEditingInstructor(null);
      router.refresh();

      // Reset form
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        specialization: "",
        hourlyRate: "",
        bio: "",
      });
    } catch (error) {
      console.error("Error creating instructor:", error);
      toast.error("Eğitmen kaydedilirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (inst: Instructor) => {
    setEditingInstructor(inst);
    setFormData({
      fullName: inst.fullName,
      phone: inst.phone || "",
      email: inst.email || "",
      specialization: inst.specialization || "",
      hourlyRate: inst.hourlyRate ? String(inst.hourlyRate) : "",
      bio: inst.bio || "",
    });
    setIsNewInstructorOpen(true);
  };

  const openCalendar = async (inst: Instructor) => {
    setCalendarInstructor(inst);
    setCalendarLoading(true);
    setIsCalendarOpen(true);
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);
    const { data, error } = await supabase
      .from("trainings")
      .select(`*, group:groups(*), venue:venues(*)`)
      .eq("instructor_id", inst.id)
      .gte("training_date", lastWeek.toISOString())
      .lte("training_date", nextWeek.toISOString())
      .order("training_date", { ascending: true });
    if (!error) setCalendarTrainings(data || []);
    setCalendarLoading(false);
  };

  const handleDelete = async (inst: Instructor) => {
    const { error } = await supabase
      .from("instructors")
      .delete()
      .eq("id", inst.id);
    if (error) {
      toast.error("Eğitmen silinemedi");
      return;
    }
    toast.success("Eğitmen silindi");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Eğitmenler</h1>
          <p className="text-sm text-muted-foreground">
            {instructors.length} eğitmen kayıtlı
          </p>
        </div>
        <Sheet open={isNewInstructorOpen} onOpenChange={setIsNewInstructorOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditingInstructor(null);
                setFormData({
                  fullName: "",
                  phone: "",
                  email: "",
                  specialization: "",
                  hourlyRate: "",
                  bio: "",
                });
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Eğitmen</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[85vh] rounded-t-xl overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle>
                {editingInstructor ? "Eğitmeni Düzenle" : "Yeni Eğitmen Ekle"}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Ad Soyad *</Label>
                <Input
                  placeholder="Örn: Ahmet Yılmaz"
                  value={formData.fullName}
                  onChange={(e) => handleFormChange("fullName", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    placeholder="5XX XXX XX XX"
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Uzmanlık Alanı</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(v) => handleFormChange("specialization", v)}
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
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="general">Genel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Saatlik Ücret (₺)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    handleFormChange("hourlyRate", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Biyografi / Notlar</Label>
                <Textarea
                  placeholder="Eğitmen hakkında kısa bilgi..."
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleFormChange("bio", e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={!formData.fullName || isSubmitting}
              >
                <User className="h-4 w-4 mr-2" />
                {isSubmitting ? "Kaydediliyor..." : "Eğitmeni Kaydet"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Eğitmen veya uzmanlık ara..."
          className="pl-9 bg-card/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Instructor List */}
      <div className="space-y-3">
        {filteredInstructors.map((instructor) => {
          const instructorGroups = getInstructorGroups(instructor.id);
          return (
            <Card
              key={instructor.id}
              className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage
                      src={instructor.photoUrl || "/placeholder.svg"}
                    />
                    <AvatarFallback
                      name={instructor.fullName}
                      className="bg-purple-500/20 text-purple-500"
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{instructor.fullName}</p>
                        <Badge variant="outline" className="mt-1">
                          {instructor.specialization || "Genel"}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEdit(instructor)}
                          >
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openCalendar(instructor)}
                          >
                            Takvimi Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(instructor)}
                          >
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {instructor.phone && (
                        <a
                          href={`tel:${instructor.phone}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{instructor.phone}</span>
                        </a>
                      )}
                      {instructor.email && (
                        <a
                          href={`mailto:${instructor.email}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-32">
                            {instructor.email}
                          </span>
                        </a>
                      )}
                    </div>

                    {instructorGroups.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {instructorGroups.map((group) => (
                          <Badge
                            key={group.id}
                            className="bg-teal-500/20 text-teal-500 hover:bg-teal-500/30"
                          >
                            {group.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredInstructors.length === 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Eğitmen bulunamadı</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {calendarInstructor
                ? `${calendarInstructor.fullName} • Takvim`
                : "Takvim"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {calendarLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Yükleniyor...
              </div>
            ) : calendarTrainings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Planlanmış antrenman bulunmuyor
              </div>
            ) : (
              calendarTrainings.map((t) => (
                <Card key={t.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{t.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(t.training_date).toLocaleDateString(
                            "tr-TR"
                          )}{" "}
                          • {t.start_time} - {t.end_time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.group?.name} • {t.venue?.name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
