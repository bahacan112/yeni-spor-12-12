"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, Clock, ChevronRight, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const trainings = [
  {
    id: "1",
    group: "U-12 Futbol A",
    date: "2024-01-15",
    time: "09:00 - 10:30",
    venue: "Ana Saha",
    studentCount: 18,
    status: "pending",
  },
  {
    id: "2",
    group: "U-14 Futbol",
    date: "2024-01-15",
    time: "14:00 - 15:30",
    venue: "B Sahası",
    studentCount: 22,
    status: "pending",
  },
  {
    id: "3",
    group: "U-10 Minikler",
    date: "2024-01-15",
    time: "16:00 - 17:00",
    venue: "Ana Saha",
    studentCount: 15,
    status: "pending",
  },
  {
    id: "4",
    group: "U-12 Futbol A",
    date: "2024-01-13",
    time: "09:00 - 10:30",
    venue: "Ana Saha",
    studentCount: 18,
    status: "completed",
    attended: 17,
  },
  {
    id: "5",
    group: "U-14 Futbol",
    date: "2024-01-12",
    time: "14:00 - 15:30",
    venue: "B Sahası",
    studentCount: 22,
    status: "completed",
    attended: 20,
  },
]

export default function InstructorAttendancePage() {
  const [filter, setFilter] = useState("all")

  const filteredTrainings = trainings.filter((training) => {
    if (filter === "pending") return training.status === "pending"
    if (filter === "completed") return training.status === "completed"
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Trainings List */}
      <div className="space-y-3">
        {filteredTrainings.map((training) => (
          <Link key={training.id} href={`/instructor/attendance/${training.id}`}>
            <Card className="bg-slate-900 border-slate-800 transition-colors hover:border-slate-700">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      training.status === "completed" ? "bg-emerald-500/10" : "bg-amber-500/10"
                    }`}
                  >
                    {training.status === "completed" ? (
                      <Check className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Clock className="h-6 w-6 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{training.group}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(training.date).toLocaleDateString("tr-TR")}</span>
                      <span>•</span>
                      <span>{training.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{training.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {training.status === "completed" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500">
                      {training.attended}/{training.studentCount} Katılım
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-500">Yoklama Bekliyor</Badge>
                  )}
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
