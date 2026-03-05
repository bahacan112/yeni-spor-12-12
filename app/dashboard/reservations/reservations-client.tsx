"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Phone,
  User,
  X,
  Loader2,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Venue {
  id: string;
  name: string;
  hourly_rate?: number;
  type?: string;
  capacity?: number;
}

interface CalendarSlot {
  date: string;
  hour: number;
  startTime: string;
  endTime: string;
  type: "free" | "training" | "reserved";
  label?: string;
  reservationId?: string;
}

interface ReservationsClientProps {
  venues: Venue[];
  tenantId: string;
  branchId?: string;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00–22:00
const DAY_NAMES_LONG = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAY_NAMES_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

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

export function ReservationsClient({ venues, tenantId, branchId }: ReservationsClientProps) {
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || "");
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1; // map Sun=0 → index 6, Mon=1 → 0
  });

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [durationHours, setDurationHours] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReservationId, setCancelReservationId] = useState<string | null>(null);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const loadCalendar = useCallback(async () => {
    if (!selectedVenueId || !tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reservations?venueId=${selectedVenueId}&weekStart=${formatDate(weekStart)}&tenantId=${tenantId}`
      );
      const data = await res.json();
      buildSlots(data.reservations || [], data.trainings || []);
    } catch {
      toast.error("Takvim yüklenemedi");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenueId, weekStart, tenantId]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  function buildSlots(reservations: any[], trainings: any[]) {
    const built: CalendarSlot[] = [];
    weekDays.forEach((dayDate) => {
      const date = formatDate(dayDate);
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
          built.push({ date, hour, startTime, endTime, type: "training", label: training.title || "Antrenman" });
          return;
        }

        const reservation = reservations.find((r: any) => {
          if (r.reservation_date !== date) return false;
          const rs = timeToMinutes(r.start_time);
          const re = timeToMinutes(r.end_time);
          return rs < endMin && re > startMin;
        });
        if (reservation) {
          built.push({ date, hour, startTime, endTime, type: "reserved", label: reservation.customer_name, reservationId: reservation.id });
          return;
        }

        built.push({ date, hour, startTime, endTime, type: "free" });
      });
    });
    setSlots(built);
  }

  function handleSlotClick(slot: CalendarSlot) {
    if (slot.type === "training") return;
    if (slot.type === "reserved") {
      setCancelReservationId(slot.reservationId || null);
      setCancelDialogOpen(true);
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

  async function handleSubmitReservation() {
    if (!selectedSlot || !customerName.trim()) { toast.error("Ad Soyad zorunlu"); return; }
    setSubmitting(true);
    try {
      const endTime = computeEndTime(selectedSlot.startTime, durationHours);
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId, venueId: selectedVenueId, branchId: branchId || null,
          reservationDate: selectedSlot.date, startTime: selectedSlot.startTime, endTime,
          customerName: customerName.trim(), customerPhone: customerPhone.trim() || null,
          totalAmount: computeAmount(), notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json?.error || "Rezervasyon oluşturulamadı"); return; }
      toast.success("Rezervasyon oluşturuldu!");
      setDialogOpen(false);
      loadCalendar();
    } catch { toast.error("Bir hata oluştu"); } finally { setSubmitting(false); }
  }

  async function handleCancelReservation() {
    if (!cancelReservationId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cancelReservationId, status: "cancelled" }),
      });
      if (!res.ok) { toast.error("İptal edilemedi"); return; }
      toast.success("Rezervasyon iptal edildi");
      setCancelDialogOpen(false);
      loadCalendar();
    } catch { toast.error("Bir hata oluştu"); } finally { setSubmitting(false); }
  }

  const weekLabel = `${weekDays[0].toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`;

  function goWeek(dir: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d);
  }

  // ─── Slot cell renderer ─────────────────────────────────────
  function SlotCell({ slot, compact = false }: { slot: CalendarSlot | undefined; compact?: boolean }) {
    if (!slot) return <div className={compact ? "h-10" : "h-9 rounded"} />;

    const base = compact
      ? "h-10 flex items-center px-2 text-xs border-b border-border/30 cursor-pointer transition-colors"
      : "h-9 rounded flex items-center justify-center text-[10px] border cursor-pointer transition-colors";

    if (slot.type === "training") return (
      <div className={cn(base, compact ? "bg-orange-500/10 text-orange-400" : "bg-orange-500/20 border-orange-500/40 text-orange-400 cursor-not-allowed")}>
        <span className="truncate">🏃 {slot.label || "Antrenman"}</span>
      </div>
    );

    if (slot.type === "reserved") return (
      <div
        className={cn(base, compact ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30")}
        onClick={() => handleSlotClick(slot)}
      >
        <span className="truncate">✓ {slot.label}</span>
      </div>
    );

    return (
      <div
        className={cn(base, compact ? "bg-transparent text-muted-foreground/30 hover:bg-primary/10 hover:text-primary" : "bg-secondary/20 border-border/30 text-muted-foreground/40 hover:bg-blue-500/20 hover:border-blue-500/40")}
        onClick={() => handleSlotClick(slot)}
      >
        <span>{compact ? "+ Rezerve Et" : "+"}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Saha Rezervasyonları</h1>
        <p className="text-sm text-muted-foreground">Antrenman olmayan saatlerde sahaları kiraya verin</p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedVenueId} onValueChange={setSelectedVenueId}>
          <SelectTrigger className="flex-1 min-w-[180px] max-w-xs">
            <SelectValue placeholder="Saha seçin" />
          </SelectTrigger>
          <SelectContent>
            {venues.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}{v.hourly_rate ? ` – ₺${v.hourly_rate}/saat` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Week navigator */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => goWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-center min-w-[120px] tabular-nums">{weekLabel}</span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => goWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 px-2 text-xs" onClick={() => setWeekStart(getMonday(new Date()))}>
            Bugün
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-secondary border border-border inline-block" /> Boş</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500/30 inline-block" /> Antrenman</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/30 inline-block" /> Rezerve</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !selectedVenueId ? (
        <Card><CardContent className="flex items-center justify-center h-32 text-muted-foreground">Lütfen bir saha seçin</CardContent></Card>
      ) : (
        <>
          {/* ── MOBILE VIEW: Day tabs + vertical list ──────────── */}
          <div className="md:hidden">
            {/* Day tab bar */}
            <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-none -mx-1 px-1">
              {weekDays.map((day, i) => {
                const dateStr = formatDate(day);
                const isToday = dateStr === formatDate(new Date());
                const isActive = i === activeDayIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveDayIndex(i)}
                    className={cn(
                      "flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isToday
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    <span className="text-[10px]">{DAY_NAMES_SHORT[i]}</span>
                    <span className="text-base font-bold leading-tight">{day.getDate()}</span>
                    <span className="text-[9px] opacity-70">{day.toLocaleDateString("tr-TR", { month: "short" })}</span>
                  </button>
                );
              })}
            </div>

            {/* Active day header */}
            <div className="text-sm font-semibold mb-2 text-foreground">
              {DAY_NAMES_LONG[activeDayIndex]}, {weekDays[activeDayIndex].toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
            </div>

            {/* Time slots for the active day */}
            <Card className="overflow-hidden">
              <div className="divide-y divide-border/50">
                {HOURS.map((hour) => {
                  const dateStr = formatDate(weekDays[activeDayIndex]);
                  const slot = slots.find((s) => s.date === dateStr && s.hour === hour);
                  return (
                    <div key={hour} className="flex items-stretch">
                      <div className="w-14 flex-shrink-0 flex items-center justify-center text-[10px] font-mono text-muted-foreground/60 bg-secondary/20 border-r border-border/30 py-1">
                        {padTime(hour)}
                      </div>
                      <div className="flex-1 py-1 px-2">
                        <SlotCell slot={slot} compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── DESKTOP VIEW: Full 7-day table ────────────────── */}
          <Card className="hidden md:block bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="w-14 p-2 border-b border-border bg-secondary/30 text-muted-foreground font-medium text-center">Saat</th>
                    {weekDays.map((day, i) => {
                      const isToday = formatDate(day) === formatDate(new Date());
                      return (
                        <th key={i} className={cn("p-2 border-b border-border font-medium text-center", isToday ? "bg-primary/20 text-primary" : "bg-secondary/30 text-muted-foreground")}>
                          <div className="text-[10px]">{DAY_NAMES_SHORT[i]}</div>
                          <div className={cn("text-base font-bold", isToday && "text-primary")}>{day.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((hour) => (
                    <tr key={hour}>
                      <td className="p-1 border-b border-border/40 text-center text-[10px] text-muted-foreground font-mono bg-secondary/20">{padTime(hour)}</td>
                      {weekDays.map((day, di) => {
                        const dateStr = formatDate(day);
                        const slot = slots.find((s) => s.date === dateStr && s.hour === hour);
                        return (
                          <td key={di} className="border-b border-border/40 p-1">
                            <SlotCell slot={slot} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Booking Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Rezervasyon Oluştur
            </DialogTitle>
            <DialogDescription>
              {selectedVenue?.name} — {selectedSlot?.date} {selectedSlot?.startTime}
            </DialogDescription>
          </DialogHeader>

          {selectedVenue && (
            <div className="rounded-lg bg-secondary/40 border border-border p-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">{selectedVenue.name}</p>
                {selectedVenue.hourly_rate && (
                  <p className="text-xs text-muted-foreground">₺{selectedVenue.hourly_rate}/saat</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Süre</Label>
              <Select value={String(durationHours)} onValueChange={(v) => setDurationHours(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <span className="font-bold text-primary">₺{computeAmount().toLocaleString("tr-TR")}</span>
            </div>

            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Müşteri adı" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="5XX XXX XX XX" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Not (isteğe bağlı)</Label>
              <Textarea rows={2} placeholder="Ek bilgi..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSubmitReservation} disabled={submitting || !customerName.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ─────────────────────────────────── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rezervasyonu İptal Et</DialogTitle>
            <DialogDescription>Bu rezervasyonu iptal etmek istediğinizden emin misiniz?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Vazgeç</Button>
            <Button variant="destructive" onClick={handleCancelReservation} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              İptal Et
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
