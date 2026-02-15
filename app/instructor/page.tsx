"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Users,
  ClipboardCheck,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function InstructorDashboard() {
  const [loading, setLoading] = useState(true);
  const [instructor, setInstructor] = useState<any | null>(null);
  const [todayTrainings, setTodayTrainings] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

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
      setInstructor(inst);
      const { data: groups } = await supabase
        .from("groups")
        .select("*, branch:branches(name)")
        .eq("instructor_id", inst.id)
        .eq("status", "active")
        .order("name");
      let studentSum = 0;
      const mappedGroups: any[] = [];
      for (const g of groups || []) {
        const { count } = await supabase
          .from("student_groups")
          .select("*", { count: "exact", head: true })
          .eq("group_id", g.id)
          .eq("status", "active");
        studentSum += count || 0;
        mappedGroups.push({
          id: g.id,
          name: g.name,
          branch: g.branch?.name || "",
          studentCount: count || 0,
          attendanceRate: 0,
        });
      }
      setMyGroups(mappedGroups);
      setTotalStudents(studentSum);
      const today = new Date();
      const dayStart = new Date(today);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(today);
      dayEnd.setHours(23, 59, 59, 999);
      const { data: trainings } = await supabase
        .from("trainings")
        .select(`*, group:groups(*), venue:venues(*), branch:branches(name)`)
        .eq("instructor_id", inst.id)
        .gte("training_date", dayStart.toISOString())
        .lte("training_date", dayEnd.toISOString())
        .order("start_time");
      setTodayTrainings(
        (trainings || []).map((t: any) => ({
          id: t.id,
          group: t.group?.name || t.title,
          time: `${t.start_time} - ${t.end_time}`,
          venue: t.venue?.name || "",
          branch: t.branch?.name || "",
          studentCount: null,
        }))
      );
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: attendanceRows } = await supabase
        .from("attendance")
        .select("status")
        .in(
          "training_id",
          ((trainings || []) as any[]).map((t) => t.id)
        );
      let present = 0;
      let total = 0;
      for (const a of attendanceRows || []) {
        total += 1;
        if (a.status === "present") present += 1;
      }
      setAttendanceRate(total > 0 ? Math.round((present / total) * 100) : 0);
      setLoading(false);
    };
    run();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {instructor?.full_name || "Eğitmen"}
        </h1>
        <p className="text-slate-400">
          Bugünkü antrenmanlarını ve gruplarını yönet
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {todayTrainings.length}
                </p>
                <p className="text-xs text-slate-400">Bugünkü Antrenman</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalStudents}</p>
                <p className="text-xs text-slate-400">Toplam Öğrenci</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-2">
                <ClipboardCheck className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  %{attendanceRate}
                </p>
                <p className="text-xs text-slate-400">Katılım Oranı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {myGroups.length}
                </p>
                <p className="text-xs text-slate-400">Aktif Grup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Bugünkü Antrenmanlar</CardTitle>
            <CardDescription className="text-slate-400">
              Yoklama almak için antrenmana tıklayın
            </CardDescription>
          </div>
          <Link href="/instructor/trainings">
            <Button
              variant="ghost"
              className="text-emerald-500 hover:text-emerald-400"
            >
              Tümünü Gör
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayTrainings.map((training) => (
            <Link
              key={training.id}
              href={`/instructor/attendance/${training.id}`}
            >
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-4 transition-colors hover:bg-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Clock className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{training.group}</h3>
                    <p className="text-sm text-slate-400">
                      {training.time} • {training.venue}
                      {training.branch ? ` • ${training.branch}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-slate-700 text-slate-300">
                    {training.studentCount ?? "-"}
                  </Badge>
                  <p className="mt-1 text-xs text-amber-500">
                    Yoklama Bekliyor
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Gruplarım</CardTitle>
            <CardDescription className="text-slate-400">
              Katılım oranları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myGroups.map((group) => (
              <Link key={group.id} href={`/instructor/groups/${group.id}`}>
                <div className="space-y-2 rounded-lg border border-slate-800 p-3 transition-colors hover:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{group.name}</span>
                    <span className="text-sm text-slate-400">
                      {group.studentCount} öğrenci
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={group.attendanceRate}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm text-emerald-500">
                      %{group.attendanceRate}
                    </span>
                  </div>
                  {group.branch && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {group.branch}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              Dikkat Edilmesi Gereken Öğrenciler
            </CardTitle>
            <CardDescription className="text-slate-400">
              Katılım düşüşü görülen öğrenciler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-slate-500">Yakında</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
