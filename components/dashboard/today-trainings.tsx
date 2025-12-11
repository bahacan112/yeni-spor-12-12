"use client";

import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Training } from "@/lib/types";

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
          <Card key={training.id} className="border-border bg-secondary/30">
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
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {training.group?.studentCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(training.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
