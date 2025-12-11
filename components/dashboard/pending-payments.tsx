"use client";

import { Wallet, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { MonthlyDue } from "@/lib/types";

interface PendingPaymentsProps {
  payments: MonthlyDue[];
}

export function PendingPayments({ payments }: PendingPaymentsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
            <Clock className="mr-1 h-3 w-3" />
            Bekliyor
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Kısmi
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
            <AlertCircle className="mr-1 h-3 w-3" />
            Gecikmiş
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
            <Wallet className="h-5 w-5 text-amber-500" />
            Bekleyen Ödemeler
          </CardTitle>
          <Link href="/dashboard/accounting">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Tümünü Gör
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {payments.map((due) => (
          <Card key={due.id} className="border-border bg-secondary/30">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={due.student?.photoUrl || "/placeholder.svg"}
                    />
                    <AvatarFallback
                      name={due.student?.fullName}
                      className="bg-primary/20 text-xs"
                    />
                  </Avatar>
                  <div>
                    <p className="font-medium leading-tight">
                      {due.student?.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(due.paidAmount)} /{" "}
                      {formatCurrency(due.computedAmount ?? due.amount)}
                    </p>
                    <p className="text-xs text-amber-400">
                      {formatCurrency(
                        (due.computedAmount ?? due.amount) -
                          (due.paidAmount || 0)
                      )}{" "}
                      kalan
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(due.status)}
                  <span className="text-xs text-muted-foreground">
                    Son: {new Date(due.dueDate).toLocaleDateString("tr-TR")}
                  </span>
                  <span className="text-xs font-medium text-amber-400">
                    {formatCurrency(
                      (due.computedAmount ?? due.amount) - (due.paidAmount || 0)
                    )}{" "}
                    kalan
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
