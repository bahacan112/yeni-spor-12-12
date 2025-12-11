"use client"

import { useState } from "react"
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const weekDays = ["Pzt", "Sal", "Çrş", "Prş", "Cum", "Cmt", "Paz"]

const trainings = [
  { id: "1", group: "U-12 Futbol A", day: 0, time: "09:00", duration: 90, venue: "Ana Saha", color: "bg-emerald-500" },
  { id: "2", group: "U-14 Futbol", day: 1, time: "14:00", duration: 90, venue: "B Sahası", color: "bg-blue-500" },
  { id: "3", group: "U-12 Futbol A", day: 2, time: "09:00", duration: 90, venue: "Ana Saha", color: "bg-emerald-500" },
  { id: "4", group: "U-14 Futbol", day: 3, time: "14:00", duration: 90, venue: "B Sahası", color: "bg-blue-500" },
  { id: "5", group: "U-12 Futbol A", day: 4, time: "09:00", duration: 90, venue: "Ana Saha", color: "bg-emerald-500" },
  { id: "6", group: "U-10 Minikler", day: 0, time: "16:00", duration: 60, venue: "Ana Saha", color: "bg-purple-500" },
  { id: "7", group: "U-10 Minikler", day: 2, time: "16:00", duration: 60, venue: "Ana Saha", color: "bg-purple-500" },
  { id: "8", group: "U-10 Minikler", day: 4, time: "16:00", duration: 60, venue: "Ana Saha", color: "bg-purple-500" },
]

const upcomingTrainings = [
  { id: "1", group: "U-12 Futbol A", date: "15 Ocak", time: "09:00 - 10:30", venue: "Ana Saha", studentCount: 18 },
  { id: "2", group: "U-14 Futbol", date: "16 Ocak", time: "14:00 - 15:30", venue: "B Sahası", studentCount: 22 },
  { id: "3", group: "U-10 Minikler", date: "15 Ocak", time: "16:00 - 17:00", venue: "Ana Saha", studentCount: 15 },
]

export default function InstructorTrainingsPage() {
  const [currentWeek, setCurrentWeek] = useState(0)

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
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-800">
            {weekDays.map((day, index) => (
              <div key={day} className="p-3 text-center border-r border-slate-800 last:border-r-0">
                <span className="text-sm font-medium text-slate-400">{day}</span>
              </div>
            ))}
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDays.map((_, dayIndex) => (
              <div key={dayIndex} className="border-r border-slate-800 last:border-r-0 p-2 space-y-2">
                {trainings
                  .filter((t) => t.day === dayIndex)
                  .map((training) => (
                    <div key={training.id} className={`${training.color} rounded-lg p-2 text-white text-xs`}>
                      <p className="font-medium truncate">{training.group}</p>
                      <p className="opacity-80">{training.time}</p>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Trainings */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Yaklaşan Antrenmanlar</h2>
        <div className="space-y-3">
          {upcomingTrainings.map((training) => (
            <Card key={training.id} className="bg-slate-900 border-slate-800">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Calendar className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{training.group}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{training.date}</span>
                      <span>•</span>
                      <span>{training.time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{training.venue}</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-slate-700 text-slate-300">
                  <Users className="mr-1 h-3 w-3" />
                  {training.studentCount}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
