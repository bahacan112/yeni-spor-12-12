import { headers, cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GeneralAccountingClient from "./general-accounting-client";
import GeneralAccountingStats from "./general-accounting-stats";
import { getAccountingData } from "@/lib/api/accounting";

export const metadata = { title: "Genel Muhasebe" };

export default async function GeneralAccountingPage() {
  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const protocol = process.env.VERCEL ? "https" : "http";
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const res = await fetch(`${base}/api/dashboard/general-accounting`, {
    cache: "no-store",
    next: { revalidate: 0 },
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!res.ok) throw new Error("Genel muhasebe verileri alınamadı");
  const { branches } = (await res.json()) as {
    branches: Array<{
      id: string;
      name: string;
      income: number;
      expense: number;
      diff: number;
    }>;
  };

  const { payments, expenses, stats } = await getAccountingData();
  const totalIncomeExcludingProducts = (payments || [])
    .filter((p) => p.paymentType !== "product")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const effectiveStats = {
    totalIncome: totalIncomeExcludingProducts,
    totalExpense: stats.totalExpense,
    netProfit: totalIncomeExcludingProducts - stats.totalExpense,
    pendingPayments: stats.pendingPayments,
  };

  let storeSummary: {
    totalSalesAmount: number;
    totalOrders: number;
    recentOrders: Array<{
      id: string;
      orderNo: string;
      total: number;
      status: string;
      createdAt: string;
    }>;
  } | null = null;
  let canViewStoreSales = true;
  const resSales = await fetch(`${base}/api/dashboard/store-sales`, {
    cache: "no-store",
    next: { revalidate: 0 },
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (resSales.status === 403) {
    canViewStoreSales = false;
  } else if (resSales.ok) {
    storeSummary = (await resSales.json()) as any;
  }
  return (
    <div className="p-4 md:p-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Genel Muhasebe</CardTitle>
        </CardHeader>
        <CardContent>
          <GeneralAccountingStats stats={effectiveStats} expenses={expenses} />
          <GeneralAccountingClient
            rows={branches}
            storeSummary={storeSummary || undefined}
            canViewStoreSales={canViewStoreSales}
          />
        </CardContent>
      </Card>
    </div>
  );
}
