"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GeneralAccountingClient({
  rows,
  storeSummary,
  canViewStoreSales = true,
}: {
  rows: Array<{
    id: string;
    name: string;
    income: number;
    expense: number;
    diff: number;
  }>;
  storeSummary?: {
    totalSalesAmount: number;
    totalOrders: number;
    recentOrders: Array<{
      id: string;
      orderNo: string;
      total: number;
      status: string;
      createdAt: string;
    }>;
  };
  canViewStoreSales?: boolean;
}) {
  const router = useRouter();
  const openBranch = (id: string) => {
    router.push(`/dashboard/accounting?branch=${encodeURIComponent(id)}`);
  };
  const openStoreSales = () => {
    router.push(`/dashboard/general-accounting/store-sales`);
  };
  return (
    <div className="w-full">
      {canViewStoreSales && storeSummary ? (
        <Card className="border-border bg-secondary/30 mb-3 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Mağaza Satışları</div>
              <div className="text-xs text-muted-foreground">
                Toplam: ₺{storeSummary.totalSalesAmount.toLocaleString("tr-TR")}{" "}
                • Sipariş: {storeSummary.totalOrders}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={openStoreSales}
            >
              Detaylar
            </Button>
          </div>
        </Card>
      ) : null}
      <div className="hidden md:grid grid-cols-4 gap-2 px-2 py-2 text-xs text-muted-foreground">
        <div>Şube</div>
        <div>Toplam Gelir</div>
        <div>Toplam Gider</div>
        <div>Fark</div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <Card
            key={r.id}
            className="border-border bg-secondary/30 p-3 cursor-pointer transition hover:bg-secondary/50"
            onClick={() => openBranch(r.id)}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-3">
              <div className="font-medium text-sm">{r.name}</div>
              <div className="text-sm">
                <span className="text-green-600 font-semibold">
                  ₺{r.income.toFixed(0)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-red-600 font-semibold">
                  ₺{r.expense.toFixed(0)}
                </span>
              </div>
              <div className="text-sm font-semibold">
                <span
                  className={r.diff >= 0 ? "text-green-600" : "text-red-600"}
                >
                  ₺{r.diff.toFixed(0)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
