"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSupabaseClient } from "@/lib/supabase/client";

const weekDays = ["Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt", "Paz"];

function mondayStart(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function InstructorTrainingsPage() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weeklyRows, setWeeklyRows] = useState<any[]>([]);
  const [upcomingRows, setUpcomingRows] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data: inst } = await supabase
        .from("instructors")
        .select("*")
        .eq("user_id", uid)
        .eq("status", "active")
        .maybeSingle();
      if (!inst) {
        setLoading(false);
        return;
      }
      const base = mondayStart(new Date());
      const start = new Date(base);
      start.setDate(base.getDate() + currentWeek * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      const { data: trainings } = await supabase
        .from("trainings")
        .select(`*, group:groups(*), venue:venues(*), branch:branches(name)`)
        .eq("instructor_id", inst.id)
        .gte("training_date", start.toISOString())
        .lte("training_date", end.toISOString())
        .order("training_date")
        .order("start_time");
      const weekly: any[] = [];
      for (const t of trainings || []) {
        const dt = new Date(t.training_date);
        const dayIdx = (dt.getDay() + 6) % 7;
        const color =
          String(t.group?.id || "").length % 3 === 0
            ? "bg-emerald-500"
            : String(t.group?.id || "").length % 3 === 1
            ? "bg-blue-500"
            : "bg-purple-500";
        weekly.push({
          id: t.id,
          group: t.group?.name || t.title || "",
          day: dayIdx,
          time: t.start_time,
          duration: t.duration_minutes || null,
          venue: t.venue?.name || "",
          branch: t.branch?.name || "",
          color,
        });
      }
      setWeeklyRows(weekly);
      const now = new Date();
      const next14 = new Date();
      next14.setDate(now.getDate() + 14);
      const { data: upcoming } = await supabase
        .from("trainings")
        .select(`*, group:groups(*), venue:venues(*), branch:branches(name)`)
        .eq("instructor_id", inst.id)
        .gte("training_date", now.toISOString())
        .lte("training_date", next14.toISOString())
        .order("training_date")
        .order("start_time");
      const ups: any[] = [];
      for (const t of upcoming || []) {
        let count = null as number | null;
        if (t.group?.id) {
          const { count: c } = await supabase
            .from("student_groups")
            .select("*", { count: "exact", head: true })
            .eq("group_id", t.group.id)
            .eq("status", "active");
          count = c || 0;
        }
        ups.push({
          id: t.id,
          group: t.group?.name || t.title || "",
          date: new Date(t.training_date).toLocaleDateString("tr-TR"),
          time: `${t.start_time} - ${t.end_time}`,
          venue: t.venue?.name || "",
          branch: t.branch?.name || "",
          studentCount: count,
        });
      }
      setUpcomingRows(ups);
      setLoading(false);
    };
    run();
  }, [currentWeek]);

  const weeklyByDay = useMemo(() => {
    const map: Record<number, any[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    for (const w of weeklyRows) {
      map[w.day] = [...map[w.day], w];
    }
    return map;
  }, [weeklyRows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Antrenmanlar</h1>
        <p className="text-slate-400">Haftalık antrenman programınız</p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400"
          onClick={() => setCurrentWeek((prev) => prev - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium text-white">
          {currentWeek === 0
            ? "Bu Hafta"
            : currentWeek > 0
            ? `${currentWeek} Hafta Sonra`
            : `${Math.abs(currentWeek)} Hafta Önce`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400"
          onClick={() => setCurrentWeek((prev) => prev + 1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Weekly Schedule */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-slate-800">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className="p-3 text-center border-r border-slate-800 last:border-r-0"
              >
                <span className="text-sm font-medium text-slate-400">
                  {day}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDays.map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="border-r border-slate-800 last:border-r-0 p-2 space-y-2"
              >
                {(weeklyByDay[dayIndex] || []).map((training) => (
                  <div
                    key={training.id}
                    className={`${training.color} rounded-lg p-2 text-white text-xs`}
                  >
                    <p className="font-medium truncate">{training.group}</p>
                    <p className="opacity-80">{training.time}</p>
                    {training.branch && (
                      <p className="opacity-80">{training.branch}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Trainings */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Yaklaşan Antrenmanlar
        </h2>
        <div className="space-y-3">
          {loading ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6 text-slate-400">
                Yükleniyor...
              </CardContent>
            </Card>
          ) : upcomingRows.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6 text-slate-400">
                Kayıt bulunamadı
              </CardContent>
            </Card>
          ) : (
            upcomingRows.map((training) => (
              <Card key={training.id} className="bg-slate-900 border-slate-800">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Calendar className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {training.group}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span>{training.date}</span>
                        <span>•</span>
                        <span>{training.time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{training.venue}</span>
                        {training.branch && (
                          <>
                            <span>•</span>
                            <span>{training.branch}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-slate-700 text-slate-300">
                    <Users className="mr-1 h-3 w-3" />
                    {training.studentCount}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
