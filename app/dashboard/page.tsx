import { Suspense } from "react";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { NavCards } from "@/components/dashboard/nav-cards";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodayTrainings } from "@/components/dashboard/today-trainings";
import { PendingPayments } from "@/components/dashboard/pending-payments";
import { RecentApplications } from "@/components/dashboard/recent-applications";
import { getDashboardData } from "@/lib/api/dashboard";
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

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Quick Actions - matching the reference design */}
      <QuickActions tenantSlug={data.tenantSlug} />

      {/* Navigation Cards Grid */}
      <NavCards />

      {/* Stats Overview */}
      <StatsCards stats={data.stats} />

      {/* Today's Trainings */}
      <TodayTrainings trainings={data.todayTrainings} />

      {/* Two Column Layout on larger screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PendingPayments payments={data.pendingPayments} />
        <RecentApplications applications={data.recentApplications} />
      </div>
    </div>
  );
}
