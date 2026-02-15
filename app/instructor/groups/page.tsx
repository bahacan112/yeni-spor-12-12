"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Calendar,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function InstructorGroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
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
      const { data: groups } = await supabase
        .from("groups")
        .select("*, branch:branches(name), sport:sports(name)")
        .eq("instructor_id", inst.id)
        .eq("status", "active")
        .order("name");
      const enriched: any[] = [];
      for (const g of groups || []) {
        const { count } = await supabase
          .from("student_groups")
          .select("*", { count: "exact", head: true })
          .eq("group_id", g.id)
          .eq("status", "active");
        const { data: nextT } = await supabase
          .from("trainings")
          .select("*")
          .eq("group_id", g.id)
          .gte("training_date", new Date().toISOString())
          .order("training_date")
          .limit(1);
        enriched.push({
          id: g.id,
          name: g.name,
          sportType:
            (g.sport?.name as string) || (g.sport_type as string) || "",
          branch: g.branch?.name || "",
          studentCount: count || 0,
          maxCapacity: g.capacity || 0,
          attendanceRate: 0,
          schedule: g.schedule || "",
          nextTraining:
            nextT && nextT.length
              ? `${new Date(nextT[0].training_date).toLocaleDateString(
                  "tr-TR"
                )} ${nextT[0].start_time}`
              : "Yakında",
        });
      }
      setRows(enriched);
      setLoading(false);
    };
    run();
  }, []);

  const filteredGroups = useMemo(
    () =>
      rows.filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [rows, searchQuery]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Gruplarım</h1>
        <p className="text-slate-400">Sorumlu olduğunuz grupları yönetin</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Grup ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white"
        />
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-slate-400">
              Yükleniyor...
            </CardContent>
          </Card>
        ) : filteredGroups.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-slate-400">
              Kayıt bulunamadı
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <Link key={group.id} href={`/instructor/groups/${group.id}`}>
              <Card className="bg-slate-900 border-slate-800 h-full transition-colors hover:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{group.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {group.sportType}
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500">
                      {group.nextTraining}
                    </Badge>
                  </div>
                  {group.branch && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {group.branch}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="h-4 w-4" />
                      <span>
                        {group.studentCount}/{group.maxCapacity} Öğrenci
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <TrendingUp className="h-4 w-4" />
                      <span>%{group.attendanceRate}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Doluluk</span>
                      <span>
                        {group.maxCapacity
                          ? Math.round(
                              (group.studentCount / group.maxCapacity) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        group.maxCapacity
                          ? (group.studentCount / group.maxCapacity) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>{group.schedule}</span>
                  </div>

                  <div className="flex items-center justify-end text-emerald-500 text-sm">
                    <span>Detayları Gör</span>
                    <ChevronRight className="h-4 w-4" />
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
