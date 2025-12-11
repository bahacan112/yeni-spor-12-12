"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, X, Clock, Save, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

const trainingData = {
  id: "1",
  group: "U-12 Futbol A",
  date: "2024-01-15",
  time: "09:00 - 10:30",
  venue: "Ana Saha",
}

const initialStudents = [
  { id: "1", name: "Ali Yılmaz", status: null as string | null },
  { id: "2", name: "Mehmet Demir", status: null as string | null },
  { id: "3", name: "Ahmet Kaya", status: null as string | null },
  { id: "4", name: "Burak Çelik", status: null as string | null },
  { id: "5", name: "Can Öztürk", status: null as string | null },
  { id: "6", name: "Deniz Yıldız", status: null as string | null },
  { id: "7", name: "Emre Şahin", status: null as string | null },
  { id: "8", name: "Fatih Aydın", status: null as string | null },
]

export default function AttendanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [students, setStudents] = useState(initialStudents)
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const updateStatus = (studentId: string, status: string) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)))
  }

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "present" })))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    router.push("/instructor/attendance")
  }

  const presentCount = students.filter((s) => s.status === "present").length
  const absentCount = students.filter((s) => s.status === "absent").length
  const lateCount = students.filter((s) => s.status === "late").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/instructor/attendance">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{trainingData.group}</h1>
          <p className="text-slate-400">
            {new Date(trainingData.date).toLocaleDateString("tr-TR")} • {trainingData.time} • {trainingData.venue}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{presentCount}</p>
            <p className="text-xs text-emerald-400">Geldi</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-red-400">Gelmedi</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{lateCount}</p>
            <p className="text-xs text-amber-400">Geç Kaldı</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <Button
        onClick={markAllPresent}
        variant="outline"
        className="w-full border-slate-700 text-slate-300 bg-transparent"
      >
        <Users className="mr-2 h-4 w-4" />
        Tümünü Geldi İşaretle
      </Button>

      {/* Students List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Öğrenciler</CardTitle>
          <CardDescription className="text-slate-400">Her öğrenci için durum seçin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/.jpg?height=40&width=40&query=${student.name}`} />
                  <AvatarFallback className="bg-slate-700 text-white text-sm">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-white">{student.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={student.status === "present" ? "default" : "outline"}
                  className={
                    student.status === "present"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "border-slate-700 text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                  }
                  onClick={() => updateStatus(student.id, "present")}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={student.status === "absent" ? "default" : "outline"}
                  className={
                    student.status === "absent"
                      ? "bg-red-600 hover:bg-red-700"
                      : "border-slate-700 text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-600"
                  }
                  onClick={() => updateStatus(student.id, "absent")}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={student.status === "late" ? "default" : "outline"}
                  className={
                    student.status === "late"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "border-slate-700 text-slate-400 hover:bg-amber-600 hover:text-white hover:border-amber-600"
                  }
                  onClick={() => updateStatus(student.id, "late")}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Antrenman Notları</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Antrenman hakkında notlarınızı yazın..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white min-h-24"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700">
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
      </Button>
    </div>
  )
}
