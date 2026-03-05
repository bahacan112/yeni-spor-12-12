"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  Loader2,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Venue {
  id: string;
  name: string;
  hourly_rate?: number;
  type?: string;
  capacity?: number;
  description?: string;
}

interface PublicReservationPageProps {
  venues: Venue[];
  tenantId: string;
  tenantName: string;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 – 22:00
const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function padTime(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

type SlotType = "free" | "training" | "reserved";

interface Slot {
  date: string;
  hour: number;
  startTime: string;
  endTime: string;
  type: SlotType;
}

export function PublicReservationPage({
  venues,
  tenantId,
  tenantName,
}: PublicReservationPageProps) {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [durationHours, setDurationHours] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCalendar = useCallback(async () => {
    if (!selectedVenue) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reservations?venueId=${selectedVenue.id}&weekStart=${formatDate(weekStart)}&tenantId=${tenantId}`
      );
      const data = await res.json();
      buildSlots(data.reservations || [], data.trainings || []);
    } catch {
      toast.error("Takvim yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [selectedVenue, weekStart, tenantId]);

  useEffect(() => {
    if (selectedVenue) loadCalendar();
  }, [loadCalendar, selectedVenue]);

  function buildSlots(reservations: any[], trainings: any[]) {
    const built: Slot[] = [];
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return formatDate(d);
    });

    weekDays.forEach((date) => {
      HOURS.forEach((hour) => {
        const startTime = padTime(hour);
        const endTime = padTime(hour + 1);
        const startMin = hour * 60;
        const endMin = (hour + 1) * 60;

        const training = trainings.find((t: any) => {
          if (t.training_date !== date) return false;
          const ts = timeToMinutes(t.start_time);
          const te = timeToMinutes(t.end_time);
          return ts < endMin && te > startMin;
        });

        if (training) {
          built.push({ date, hour, startTime, endTime, type: "training" });
          return;
        }

        const reservation = reservations.find((r: any) => {
          if (r.reservation_date !== date) return false;
          const rs = timeToMinutes(r.start_time);
          const re = timeToMinutes(r.end_time);
          return rs < endMin && re > startMin;
        });

        if (reservation) {
          built.push({ date, hour, startTime, endTime, type: "reserved" });
          return;
        }

        built.push({ date, hour, startTime, endTime, type: "free" });
      });
    });

    setSlots(built);
  }

  function handleSlotClick(slot: Slot) {
    if (slot.type !== "free") return;
    const now = new Date();
    const slotDate = new Date(slot.date + "T" + slot.startTime);
    if (slotDate < now) {
      toast.error("Geçmiş bir saate rezervasyon yapamazsınız");
      return;
    }
    setSelectedSlot(slot);
    setDurationHours(1);
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
    setDialogOpen(true);
  }

  function computeEndTime(startTime: string, hours: number): string {
    const [h] = startTime.split(":").map(Number);
    return padTime(h + hours);
  }

  function computeAmount(): number {
    return (selectedVenue?.hourly_rate || 0) * durationHours;
  }

  async function handleSubmit() {
    if (!selectedSlot || !selectedVenue || !customerName.trim()) {
      toast.error("Ad Soyad zorunlu");
      return;
    }
    setSubmitting(true);
    try {
      const endTime = computeEndTime(selectedSlot.startTime, durationHours);
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          venueId: selectedVenue.id,
          reservationDate: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          totalAmount: computeAmount(),
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error || "Rezervasyon yapılamadı");
        return;
      }
      toast.success("Rezervasyonunuz alındı! İyi oyunlar 🎉");
      setDialogOpen(false);
      loadCalendar();
    } catch {
      toast.error("Sunucu hatası");
    } finally {
      setSubmitting(false);
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekLabel = `${weekDays[0].toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`;

  // Venue list view
  if (!selectedVenue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">{tenantName}</h1>
        <p className="text-muted-foreground mb-6">Saha Rezervasyonu</p>

        {venues.length === 0 ? (
          <Card className="text-center p-12">
            <p className="text-muted-foreground">Rezervasyon için uygun saha bulunamadı.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <Card
                key={v.id}
                className="cursor-pointer hover:border-primary/50 hover:bg-card/80 transition-all"
                onClick={() => setSelectedVenue(v)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold">{v.name}</h2>
                      {v.type && (
                        <Badge variant="outline" className="mt-1 text-xs capitalize">
                          {v.type === "indoor" ? "Kapalı Alan" : v.type === "outdoor" ? "Açık Alan" : v.type}
                        </Badge>
                      )}
                      {v.capacity && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Kapasite: {v.capacity} kişi
                        </p>
                      )}
                      {v.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {v.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      {v.hourly_rate ? (
                        <span className="text-lg font-bold text-primary">
                          ₺{v.hourly_rate.toLocaleString("tr-TR")}
                          <span className="text-xs font-normal text-muted-foreground">/saat</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Fiyat için iletişime geçin</span>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Rezervasyon Yap →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Calendar view for selected venue
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedVenue(null)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{selectedVenue.name}</h1>
          <p className="text-sm text-muted-foreground">
            {selectedVenue.hourly_rate ? `₺${selectedVenue.hourly_rate}/saat` : "Reservasyon Takvimi"}
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="icon" onClick={() => {
          const d = new Date(weekStart);
          d.setDate(d.getDate() - 7);
          setWeekStart(d);
        }}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[180px] text-center">{weekLabel}</span>
        <Button variant="outline" size="icon" onClick={() => {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + 7);
          setWeekStart(d);
        }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(getMonday(new Date()))}>
          Bu Hafta
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary/20 border border-primary/40 inline-block" />
          Boş (Rezerve et)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-secondary inline-block border border-border" />
          Dolu
        </span>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        {loading ? (
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-14 p-2 border-b border-border bg-secondary/40 text-muted-foreground font-medium">
                    Saat
                  </th>
                  {weekDays.map((day, i) => {
                    const isToday = formatDate(day) === formatDate(new Date());
                    const isPast = day < new Date(formatDate(new Date()));
                    return (
                      <th
                        key={i}
                        className={`p-2 border-b border-border font-medium text-center ${isToday ? "bg-primary/20 text-primary" : isPast ? "bg-secondary/20 text-muted-foreground/50" : "bg-secondary/40 text-muted-foreground"}`}
                      >
                        <div>{DAY_NAMES[i]}</div>
                        <div className={`text-base font-bold ${isToday ? "text-primary" : ""}`}>
                          {day.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    <td className="p-1 border-b border-border/50 text-center text-muted-foreground font-mono bg-secondary/20 text-[10px]">
                      {padTime(hour)}
                    </td>
                    {weekDays.map((day, di) => {
                      const dateStr = formatDate(day);
                      const slot = slots.find((s) => s.date === dateStr && s.hour === hour);
                      const isPast = new Date(dateStr + "T" + padTime(hour)) < new Date();

                      if (!slot || isPast || slot.type !== "free") {
                        return (
                          <td key={di} className="border-b border-border/50 p-1">
                            <div className="h-8 rounded bg-secondary/30" />
                          </td>
                        );
                      }

                      return (
                        <td key={di} className="border-b border-border/50 p-1">
                          <div
                            className="h-8 rounded cursor-pointer bg-primary/10 border border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-colors flex items-center justify-center"
                            onClick={() => handleSlotClick(slot)}
                          >
                            <span className="text-primary/60 text-[10px]">+</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Rezervasyon
            </DialogTitle>
            <DialogDescription>
              {selectedVenue.name} — {selectedSlot?.date} {selectedSlot?.startTime}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Süre</Label>
              <Select value={String(durationHours)} onValueChange={(v) => setDurationHours(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h} saat — {selectedSlot ? computeEndTime(selectedSlot.startTime, h) : ""}e kadar
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>{selectedSlot?.startTime} – {selectedSlot ? computeEndTime(selectedSlot.startTime, durationHours) : ""}</span>
              </div>
              <span className="font-bold text-primary text-lg">₺{computeAmount().toLocaleString("tr-TR")}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" className="pl-9" placeholder="Adınız Soyadınız" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" className="pl-9" placeholder="5XX XXX XX XX" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Not (isteğe bağlı)</Label>
              <Textarea rows={2} placeholder="Eklemek istediğiniz bilgi..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSubmit} disabled={submitting || !customerName.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Rezervasyonu Onayla
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
