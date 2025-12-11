"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Users, Calendar, TrendingUp, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const myGroups = [
  {
    id: "1",
    name: "U-12 Futbol A",
    sportType: "Futbol",
    studentCount: 18,
    maxCapacity: 20,
    attendanceRate: 92,
    schedule: "Pzt, Çrş, Cum 09:00-10:30",
    nextTraining: "Bugün 09:00",
  },
  {
    id: "2",
    name: "U-14 Futbol",
    sportType: "Futbol",
    studentCount: 22,
    maxCapacity: 25,
    attendanceRate: 88,
    schedule: "Sal, Prş 14:00-15:30",
    nextTraining: "Yarın 14:00",
  },
  {
    id: "3",
    name: "U-10 Minikler",
    sportType: "Futbol",
    studentCount: 15,
    maxCapacity: 18,
    attendanceRate: 95,
    schedule: "Pzt, Çrş, Cum 16:00-17:00",
    nextTraining: "Bugün 16:00",
  },
]

export default function InstructorGroupsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredGroups = myGroups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))

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
        {filteredGroups.map((group) => (
          <Link key={group.id} href={`/instructor/groups/${group.id}`}>
            <Card className="bg-slate-900 border-slate-800 h-full transition-colors hover:border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white">{group.name}</CardTitle>
                    <CardDescription className="text-slate-400">{group.sportType}</CardDescription>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500">{group.nextTraining}</Badge>
                </div>
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
                    <span>{Math.round((group.studentCount / group.maxCapacity) * 100)}%</span>
                  </div>
                  <Progress value={(group.studentCount / group.maxCapacity) * 100} className="h-2" />
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
        ))}
      </div>
    </div>
  )
}
