"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Training } from "@/lib/types";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  trainings: Training[];
  tenantId: string;
  initialMonth?: string;
}

export default function CalendarClient({ trainings, initialMonth }: Props) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(
    initialMonth ? new Date(initialMonth) : new Date()
  );
  const [view, setView] = useState<"month" | "week">("month");

  const eventsByDay = useMemo(() => {
    const map: Record<string, Training[]> = {};
    trainings.forEach((t) => {
      const key = new Date(t.trainingDate).toDateString();
      map[key] = map[key] || [];
      map[key].push(t);
    });
    return map;
  }, [trainings]);

  const selectedKey = selectedDay ? selectedDay.toDateString() : undefined;
  const selectedEvents = selectedKey ? eventsByDay[selectedKey] || [] : [];
  const weekDays = useMemo(() => {
    if (!selectedDay) return [];
    const start = new Date(selectedDay);
    // move to Monday
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDay]);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Takvim</h1>
        <p className="text-sm text-slate-400">Antrenman programı</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ay Görünümü</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={view === "month" ? "default" : "outline"}
                  className={
                    view === "month"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-slate-700 text-slate-300 bg-transparent"
                  }
                  onClick={() => setView("month")}
                >
                  Ay
                </Button>
                <Button
                  variant={view === "week" ? "default" : "outline"}
                  className={
                    view === "week"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border-slate-700 text-slate-300 bg-transparent"
                  }
                  onClick={() => setView("week")}
                >
                  Hafta
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DayPicker
              month={month}
              onMonthChange={setMonth}
              selected={selectedDay}
              onSelect={setSelectedDay}
              modifiers={{
                hasEvent: trainings.map((t) => new Date(t.trainingDate)),
              }}
              modifiersClassNames={{
                hasEvent: "bg-blue-600/20 text-white rounded-md",
              }}
            />
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle>
              {view === "month" ? "Seçili Gün" : "Hafta Görünümü"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {view === "month" ? (
              selectedEvents.length === 0 ? (
                <div className="text-slate-400">
                  Gün seçin veya etkinlik yok.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between rounded-lg border border-slate-800 bg-slate-900 p-3"
                    >
                      <div className="text-white">
                        <div className="font-semibold">
                          {t.group?.name || t.title}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {new Date(t.trainingDate).toLocaleDateString("tr-TR")}{" "}
                          {t.startTime} - {t.endTime}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {t.venue?.name || "-"}
                        </div>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {t.instructor?.fullName || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {weekDays.map((d, idx) => {
                  const key = d.toDateString();
                  const events = eventsByDay[key] || [];
                  const conflicts = new Set<string>();
                  // naive conflict detection by time overlap
                  for (let i = 0; i < events.length; i++) {
                    for (let j = i + 1; j < events.length; j++) {
                      const a = events[i];
                      const b = events[j];
                      if (a.startTime < b.endTime && b.startTime < a.endTime) {
                        conflicts.add(a.id);
                        conflicts.add(b.id);
                      }
                    }
                  }
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-3"
                    >
                      <div className="mb-2 text-slate-300 text-sm">
                        {d.toLocaleDateString("tr-TR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                      {events.length === 0 ? (
                        <div className="text-slate-500 text-sm">
                          Etkinlik yok
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {events.map((t) => (
                            <div
                              key={t.id}
                              className={`flex items-start justify-between rounded-md border p-2 ${
                                conflicts.has(t.id)
                                  ? "border-red-600 bg-red-950/30"
                                  : "border-slate-800 bg-slate-900"
                              }`}
                            >
                              <div className="text-white">
                                <div className="font-semibold">
                                  {t.group?.name || t.title}
                                  {conflicts.has(t.id) && (
                                    <Badge className="ml-2 bg-red-600">
                                      Çakışma
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-slate-400 text-sm">
                                  {t.startTime} - {t.endTime} •{" "}
                                  {t.venue?.name || "-"}
                                </div>
                              </div>
                              <div className="text-slate-400 text-sm">
                                {t.instructor?.fullName || "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
