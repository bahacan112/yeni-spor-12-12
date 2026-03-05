"use client";

import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Training } from "@/lib/types";
import Link from "next/link";

interface TodayTrainingsProps {
  trainings: Training[];
}

export function TodayTrainings({ trainings }: TodayTrainingsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
            Planlandı
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
            Tamamlandı
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
            İptal
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Bugünkü Antrenmanlar
          </CardTitle>
          <Badge variant="secondary">{trainings.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {trainings.map((training) => (
          <Link href={`/dashboard/trainings?date=${training.trainingDate}`} key={training.id} className="block group">
            <Card className="border-border bg-secondary/30 transition-colors group-hover:bg-secondary/60">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={training.instructor?.photoUrl || "/placeholder.svg"}
                    />
                    <AvatarFallback
                      name={training.instructor?.fullName}
                      className="bg-primary/20 text-xs"
                    />
                  </Avatar>
                  <div className="space-y-1">
                    <p className="font-medium leading-tight">
                      {training.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {training.instructor?.fullName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {training.startTime} - {training.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {training.venue?.name}
                      </span>
                      {training.attendanceStats && (
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          {training.attendanceStats.present > 0 && <span className="text-green-500 font-medium">{training.attendanceStats.present} Geldi</span>}
                          {training.attendanceStats.absent > 0 && <span className="text-red-500 font-medium">{training.attendanceStats.absent} Gelmedi</span>}
                          {training.attendanceStats.late > 0 && <span className="text-amber-500 font-medium">{training.attendanceStats.late} Geç Kalma</span>}
                          {training.attendanceStats.excused > 0 && <span className="text-blue-500 font-medium">{training.attendanceStats.excused} İzinli</span>}
                          {training.attendanceStats.unmarked !== undefined && training.attendanceStats.unmarked > 0 && <span className="text-muted-foreground">{training.attendanceStats.unmarked} İşlenmemiş</span>}
                          
                          {training.attendanceStats.present === 0 && 
                           training.attendanceStats.absent === 0 && 
                           training.attendanceStats.late === 0 && 
                           training.attendanceStats.excused === 0 && 
                           (!training.attendanceStats.unmarked) && (
                            <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Yoklama alınmadı</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {getStatusBadge(training.status)}
              </div>
            </CardContent>
          </Card>
        </Link>
        ))}
      </CardContent>
    </Card>
  );
}
