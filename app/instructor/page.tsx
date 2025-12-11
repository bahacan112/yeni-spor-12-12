"use client"

import { Calendar, Users, ClipboardCheck, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

const todayTrainings = [
  { id: "1", group: "U-12 Futbol A", time: "09:00 - 10:30", venue: "Ana Saha", studentCount: 18, attended: 0 },
  { id: "2", group: "U-14 Futbol", time: "14:00 - 15:30", venue: "B Sahası", studentCount: 22, attended: 0 },
  { id: "3", group: "U-10 Minikler", time: "16:00 - 17:00", venue: "Ana Saha", studentCount: 15, attended: 0 },
]

const myGroups = [
  { id: "1", name: "U-12 Futbol A", studentCount: 18, attendanceRate: 92 },
  { id: "2", name: "U-14 Futbol", studentCount: 22, attendanceRate: 88 },
  { id: "3", name: "U-10 Minikler", studentCount: 15, attendanceRate: 95 },
]

const recentStudents = [
  { id: "1", name: "Ali Yılmaz", group: "U-12 Futbol A", status: "improving", note: "Tekniği gelişiyor" },
  { id: "2", name: "Mehmet Demir", group: "U-14 Futbol", status: "attention", note: "Devamsızlık sorunu" },
  { id: "3", name: "Ayşe Kaya", group: "U-10 Minikler", status: "excellent", note: "Çok yetenekli" },
]

const statusColors = {
  improving: "bg-blue-500/10 text-blue-500",
  attention: "bg-amber-500/10 text-amber-500",
  excellent: "bg-green-500/10 text-green-500",
}

const statusLabels = {
  improving: "Gelişiyor",
  attention: "Dikkat",
  excellent: "Mükemmel",
}

export default function InstructorDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Hoş Geldin, Ahmet Koç</h1>
        <p className="text-slate-400">Bugünkü antrenmanlarını ve gruplarını yönet</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">3</p>
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
                <p className="text-2xl font-bold text-white">55</p>
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
                <p className="text-2xl font-bold text-white">%91</p>
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
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-xs text-slate-400">Aktif Grup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Trainings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Bugünkü Antrenmanlar</CardTitle>
            <CardDescription className="text-slate-400">Yoklama almak için antrenmana tıklayın</CardDescription>
          </div>
          <Link href="/instructor/trainings">
            <Button variant="ghost" className="text-emerald-500 hover:text-emerald-400">
              Tümünü Gör
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayTrainings.map((training) => (
            <Link key={training.id} href={`/instructor/attendance/${training.id}`}>
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-4 transition-colors hover:bg-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Clock className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{training.group}</h3>
                    <p className="text-sm text-slate-400">
                      {training.time} • {training.venue}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-slate-700 text-slate-300">{training.studentCount} Öğrenci</Badge>
                  <p className="mt-1 text-xs text-amber-500">Yoklama Bekliyor</p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Groups */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Gruplarım</CardTitle>
            <CardDescription className="text-slate-400">Katılım oranları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myGroups.map((group) => (
              <Link key={group.id} href={`/instructor/groups/${group.id}`}>
                <div className="space-y-2 rounded-lg border border-slate-800 p-3 transition-colors hover:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{group.name}</span>
                    <span className="text-sm text-slate-400">{group.studentCount} öğrenci</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={group.attendanceRate} className="h-2 flex-1" />
                    <span className="text-sm text-emerald-500">%{group.attendanceRate}</span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Dikkat Edilmesi Gereken Öğrenciler</CardTitle>
            <CardDescription className="text-slate-400">Son notlar ve gözlemler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentStudents.map((student) => (
              <div key={student.id} className="flex items-center gap-3 rounded-lg border border-slate-800 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/.jpg?height=40&width=40&query=${student.name}`} />
                  <AvatarFallback className="bg-slate-700 text-white">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{student.name}</span>
                    <Badge className={statusColors[student.status as keyof typeof statusColors]}>
                      {statusLabels[student.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">{student.group}</p>
                  <p className="text-xs text-slate-500 mt-1">{student.note}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
