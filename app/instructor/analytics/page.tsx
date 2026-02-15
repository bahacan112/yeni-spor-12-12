"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseClient } from "@/lib/supabase/client";

const studentAnalytics = [
  {
    id: "1",
    name: "Ali Yılmaz",
    group: "U-12 Futbol A",
    attendance: 95,
    technique: 8.5,
    strength: 7.2,
    teamwork: 9.0,
    trend: "up",
    notes: "Çok yetenekli, liderlik özellikleri var",
  },
  {
    id: "2",
    name: "Mehmet Demir",
    group: "U-14 Futbol",
    attendance: 78,
    technique: 7.2,
    strength: 8.0,
    teamwork: 6.5,
    trend: "down",
    notes: "Devamsızlık sorunu, takım oyununda gelişmeli",
  },
  {
    id: "3",
    name: "Ahmet Kaya",
    group: "U-12 Futbol A",
    attendance: 92,
    technique: 8.8,
    strength: 7.8,
    teamwork: 8.5,
    trend: "up",
    notes: "İstikrarlı performans gösteriyor",
  },
  {
    id: "4",
    name: "Burak Çelik",
    group: "U-10 Minikler",
    attendance: 88,
    technique: 7.9,
    strength: 6.5,
    teamwork: 8.0,
    trend: "stable",
    notes: "Fiziksel gelişim için ekstra çalışma gerekli",
  },
];

const trendIcons = {
  up: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  down: <TrendingDown className="h-4 w-4 text-red-500" />,
  stable: <Minus className="h-4 w-4 text-amber-500" />,
};

const trendLabels = {
  up: "Yükseliyor",
  down: "Düşüyor",
  stable: "Stabil",
};

export default function InstructorAnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [groups, setGroups] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data: gRows } = await supabase
        .from("groups")
        .select("*")
        .eq("instructor_id", inst.id)
        .eq("status", "active")
        .order("name");
      setGroups(gRows || []);
      const students: any[] = [];
      for (const g of gRows || []) {
        const { data: sg } = await supabase
          .from("student_groups")
          .select(`students(*)`)
          .eq("group_id", g.id)
          .eq("status", "active");
        for (const row of sg || []) {
          const s = row.students;
          if (!s) continue;
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          const { data: attRows } = await supabase
            .from("attendance")
            .select("*")
            .eq("student_id", s.id)
            .gte("marked_at", monthAgo.toISOString());
          const total = attRows?.length || 0;
          const present = (attRows || []).filter(
            (a: any) => a.status === "present"
          ).length;
          const attendance =
            total > 0 ? Math.round((present / total) * 100) : 0;
          let trend = "stable";
          if (attendance >= 85) trend = "up";
          else if (attendance <= 60) trend = "down";
          students.push({
            id: s.id,
            name: s.full_name || "",
            group: g.name,
            attendance,
            trend,
            notes: "",
          });
        }
      }
      setRows(students);
      setLoading(false);
    };
    run();
  }, []);

  const filteredStudents = useMemo(() => {
    const list = rows.length ? rows : studentAnalytics;
    return list.filter((student) => {
      const matchesSearch = student.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesGroup =
        selectedGroup === "all" || student.group === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [rows, searchQuery, selectedGroup]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Öğrenci Analizi</h1>
        <p className="text-slate-400">Öğrenci performanslarını değerlendirin</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Öğrenci ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white"
          />
        </div>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder="Grup seçin" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Tüm Gruplar</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.name}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">55</p>
                <p className="text-xs text-slate-400">Toplam Öğrenci</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">32</p>
                <p className="text-xs text-slate-400">Gelişen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-500/10 p-2">
                <Minus className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">18</p>
                <p className="text-xs text-slate-400">Stabil</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">5</p>
                <p className="text-xs text-slate-400">Dikkat Gerekli</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Analytics */}
      <div className="space-y-4">
        {loading ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-slate-400">
              Yükleniyor...
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  {/* Student Info */}
                  <div className="flex items-center gap-4 lg:w-64">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`/.jpg?height=48&width=48&query=${student.name}`}
                      />
                      <AvatarFallback className="bg-slate-700 text-white">
                        {student.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-white">{student.name}</h3>
                      <p className="text-sm text-slate-400">{student.group}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {trendIcons[student.trend as keyof typeof trendIcons]}
                        <span className="text-xs text-slate-500">
                          {
                            trendLabels[
                              student.trend as keyof typeof trendLabels
                            ]
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="flex-1 grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Katılım</span>
                        <span className="text-white">
                          %{student.attendance}
                        </span>
                      </div>
                      <Progress value={student.attendance} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Teknik</span>
                        <span className="text-white">
                          {student.technique}/10
                        </span>
                      </div>
                      <Progress
                        value={student.technique * 10}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Güç</span>
                        <span className="text-white">
                          {student.strength}/10
                        </span>
                      </div>
                      <Progress value={student.strength * 10} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Takım Oyunu</span>
                        <span className="text-white">
                          {student.teamwork}/10
                        </span>
                      </div>
                      <Progress value={student.teamwork * 10} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-sm text-slate-400">
                    <span className="text-slate-500">Not:</span> {student.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
