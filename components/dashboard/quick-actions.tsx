"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Users, Copy, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";

interface QuickActionsProps {
  tenantSlug: string;
}

export function QuickActions({ tenantSlug }: QuickActionsProps) {
  const [copied, setCopied] = useState(false);
  const { currentBranch } = useAuthStore();

  const copyRegistrationLink = async () => {
    // Assuming the registration page is /kayit/[slug]
    const url = `${window.location.origin}/kayit/${tenantSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Hızlı İşlemler</CardTitle>
            <CardDescription className="text-xs">
              Günlük işlemlerinizi hızlıca gerçekleştirin
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary Actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={
              currentBranch
                ? `/dashboard/trainings?branch=${currentBranch.id}`
                : "/dashboard/trainings"
            }
          >
            <Card className="group cursor-pointer border-border bg-secondary/50 transition-colors hover:bg-secondary">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-amber-500">
                  Hızlı Yoklama
                </span>
                <span className="text-xs text-muted-foreground">
                  Bugün antrenmanları
                </span>
              </CardContent>
            </Card>
          </Link>

          <Card
            className="group cursor-pointer border-border bg-secondary/50 transition-colors hover:bg-secondary"
            onClick={copyRegistrationLink}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5 text-purple-500" />
                )}
              </div>
              <span className="text-sm font-medium text-purple-500">
                Hızlı Kayıt Linki
              </span>
              <span className="text-xs text-muted-foreground">
                {copied ? "Kopyalandı!" : "Otomatik hafızaya kopyalar"}
              </span>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
