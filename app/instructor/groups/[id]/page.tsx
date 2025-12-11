"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Users, Calendar, TrendingUp, Search, MoreHorizontal, FileText, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

const groupData = {
  id: "1",
  name: "U-12 Futbol A",
  sportType: "Futbol",
  studentCount: 18,
  maxCapacity: 20,
  attendanceRate: 92,
  schedule: "Pzt, Çrş, Cum 09:00-10:30",
}

const students = [
  { id: "1", name: "Ali Yılmaz", attendance: 95, performance: 8.5, status: "active" },
  { id: "2", name: "Mehmet Demir", attendance: 78, performance: 7.2, status: "active" },
  { id: "3", name: "Ahmet Kaya", attendance: 92, performance: 8.8, status: "active" },
  { id: "4", name: "Burak Çelik", attendance: 88, performance: 7.9, status: "active" },
  { id: "5", name: "Can Öztürk", attendance: 100, performance: 9.2, status: "active" },
]

const recentTrainings = [
  { id: "1", date: "15 Ocak 2024", attended: 17, total: 18, rate: 94 },
  { id: "2", date: "13 Ocak 2024", attended: 16, total: 18, rate: 89 },
  { id: "3", date: "11 Ocak 2024", attended: 18, total: 18, rate: 100 },
]

export default function InstructorGroupDetailPage() {
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStudents = students.filter((student) => student.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/instructor/groups">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{groupData.name}</h1>
          <p className="text-slate-400">
            {groupData.sportType} • {groupData.schedule}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{groupData.studentCount}</p>
                <p className="text-xs text-slate-400">Öğrenci</p>
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
                <p className="text-2xl font-bold text-white">%{groupData.attendanceRate}</p>
                <p className="text-xs text-slate-400">Katılım Oranı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">8.3</p>
                <p className="text-xs text-slate-400">Ort. Performans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-500/10 p-2">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">45</p>
                <p className="text-xs text-slate-400">Antrenman</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="students" className="data-[state=active]:bg-emerald-600">
            Öğrenciler
          </TabsTrigger>
          <TabsTrigger value="trainings" className="data-[state=active]:bg-emerald-600">
            Antrenmanlar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-600">
            Analiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Öğrenci ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-800 text-white"
            />
          </div>

          {/* Students List */}
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/.jpg?height=48&width=48&query=${student.name}`} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-white">{student.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">Katılım: %{student.attendance}</span>
                      <span className="text-xs text-slate-400">Performans: {student.performance}/10</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      student.attendance >= 90 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    }
                  >
                    %{student.attendance}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem className="text-slate-300 focus:bg-slate-700">
                        <FileText className="mr-2 h-4 w-4" />
                        Not Ekle
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-300 focus:bg-slate-700">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Performans Değerlendir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trainings" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Son Antrenmanlar</CardTitle>
              <CardDescription className="text-slate-400">Katılım istatistikleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTrainings.map((training) => (
                <div
                  key={training.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 p-3"
                >
                  <div>
                    <p className="font-medium text-white">{training.date}</p>
                    <p className="text-sm text-slate-400">
                      {training.attended}/{training.total} katılım
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={training.rate} className="w-24 h-2" />
                    <Badge
                      className={
                        training.rate >= 90 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      }
                    >
                      %{training.rate}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Performans Analizi</CardTitle>
              <CardDescription className="text-slate-400">Grup performans metrikleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Teknik</span>
                    <span className="text-white">8.2/10</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Kondisyon</span>
                    <span className="text-white">7.8/10</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Takım Oyunu</span>
                    <span className="text-white">8.5/10</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Disiplin</span>
                    <span className="text-white">9.0/10</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
