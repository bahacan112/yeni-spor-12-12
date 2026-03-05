"use client";

import { FileText, User, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Application } from "@/lib/types";

interface RecentApplicationsProps {
  applications: Application[];
}

export function RecentApplications({ applications }: RecentApplicationsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
            Yeni
          </Badge>
        );
      case "contacted":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
            İletişime Geçildi
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
            Onaylandı
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
            Reddedildi
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-green-500" />
            Son Başvurular
          </CardTitle>
          <Link href="/dashboard/applications">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Tümünü Gör
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {applications.map((app) => (
          <Card key={app.id} className="border-border bg-secondary/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{app.fullName}</span>
                  </div>
                  {app.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{app.phone}</span>
                    </div>
                  )}
                  {app.preferredGroup && (
                    <Badge variant="outline" className="text-xs">
                      {app.preferredGroup.name}
                    </Badge>
                  )}
                  {app.sport?.name && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Branş: {app.sport.name}
                      </Badge>
                      {app.sport.isActive === false && (
                        <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 text-[10px]">
                          Pasif
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(app.status)}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(app.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
