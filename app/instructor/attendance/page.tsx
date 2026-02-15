"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ChevronRight, Check, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function InstructorAttendancePage() {
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data: instructor } = await supabase
        .from("instructors")
        .select("*")
        .eq("user_id", uid)
        .eq("status", "active")
        .maybeSingle();
      if (!instructor) {
        setLoading(false);
        return;
      }
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 14);
      const { data: trainings } = await supabase
        .from("trainings")
        .select(`*, group:groups(*), venue:venues(*), branch:branches(name)`)
        .eq("instructor_id", instructor.id)
        .gte("training_date", lastWeek.toISOString())
        .lte("training_date", nextWeek.toISOString())
        .order("training_date", { ascending: true });
      const enriched = [];
      for (const t of trainings || []) {
        let studentCount = null as number | null;
        if (t.group?.id) {
          const { count } = await supabase
            .from("student_groups")
            .select("*", { count: "exact", head: true })
            .eq("group_id", t.group.id)
            .eq("status", "active");
          studentCount = count || 0;
        }
        const { data: attRows } = await supabase
          .from("attendance")
          .select("status")
          .eq("training_id", t.id);
        let present = 0;
        let total = 0;
        for (const a of attRows || []) {
          total += 1;
          if (a.status === "present") present += 1;
        }
        enriched.push({
          id: t.id,
          groupName: t.group?.name || t.title,
          date: t.training_date,
          time: `${t.start_time} - ${t.end_time}`,
          venue: t.venue?.name || "",
          branch: t.branch?.name || "",
          status: t.status === "completed" ? "completed" : "pending",
          studentCount,
          presentCount: present,
          attendanceTotal: total,
        });
      }
      setRows(enriched);
      setLoading(false);
    };
    run();
  }, []);

  const filteredTrainings = useMemo(() => {
    if (filter === "pending") return rows.filter((r) => r.status === "pending");
    if (filter === "completed")
      return rows.filter((r) => r.status === "completed");
    return rows;
  }, [rows, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Yoklama</h1>
          <p className="text-slate-400">Antrenman yoklamalarını yönetin</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="pending">Bekleyen</SelectItem>
            <SelectItem value="completed">Tamamlanan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-slate-400">
              Yükleniyor...
            </CardContent>
          </Card>
        ) : filteredTrainings.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-slate-400">
              Kayıt bulunamadı
            </CardContent>
          </Card>
        ) : (
          filteredTrainings.map((training) => (
            <Link
              key={training.id}
              href={`/instructor/attendance/${training.id}`}
            >
              <Card className="bg-slate-900 border-slate-800 transition-colors hover:border-slate-700">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        training.status === "completed"
                          ? "bg-emerald-500/10"
                          : "bg-amber-500/10"
                      }`}
                    >
                      {training.status === "completed" ? (
                        <Check className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <Clock className="h-6 w-6 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {training.groupName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(training.date).toLocaleDateString("tr-TR")}
                        </span>
                        <span>•</span>
                        <span>{training.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {training.venue}
                        {training.branch ? ` • ${training.branch}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className="bg-slate-700 text-slate-300">
                      <Users className="mr-1 h-3 w-3" />
                      {training.studentCount ?? "-"}
                    </Badge>
                    {training.status === "completed" && (
                      <Badge className="bg-emerald-500/10 text-emerald-500">
                        Katılım {training.presentCount}/
                        {training.attendanceTotal}
                      </Badge>
                    )}
                    {training.status === "completed" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500">
                        Tamamlandı
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-500">
                        Yoklama Bekliyor
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-slate-500" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
