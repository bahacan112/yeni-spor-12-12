import { Suspense } from "react";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { NavCards } from "@/components/dashboard/nav-cards";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodayTrainings } from "@/components/dashboard/today-trainings";
import { PendingPayments } from "@/components/dashboard/pending-payments";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { getDashboardData } from "@/lib/api/dashboard";
import { getSetupStatus } from "@/lib/api/setup";
import {
  StatsCardsSkeleton,
  RecentActivitySkeleton,
  TableSkeleton,
} from "@/components/skeletons";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  const data = await getDashboardData(branchId);

  // If tenantSlug is 'admin', redirect to admin dashboard
  if (data.tenantSlug === "admin") {
    redirect("/admin");
  }

  const setup = await getSetupStatus();
  if (!setup.isComplete) {
    redirect("/dashboard/setup");
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* 1. Özet İstatistikler - İlk Bakış */}
      <StatsCards stats={data.stats} />

      {/* 2. Hızlı İşlemler - Mobil Öncelikli Eylemler */}
      <QuickActions tenantSlug={data.tenantSlug} />

      {/* 3. Bugünün Gündemi */}
      <TodayTrainings trainings={data.todayTrainings} />

      {/* 4. İşlem Bekleyenler - İki Kolonlu */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PendingPayments payments={data.pendingPayments} />
        <RecentApplications applications={data.recentApplications} />
      </div>

      {/* 5. Navigasyon Kartları - Mobilde Alt Kısma İndi */}
      <div className="mt-2 pt-6 border-t border-border">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground px-1">
          Tüm Modüller
        </h3>
        <NavCards />
      </div>
    </div>
  );
}
