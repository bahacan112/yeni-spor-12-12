import { StatsCardsSkeleton, RecentActivitySkeleton, TableSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Quick Actions Skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 shrink-0" />
        ))}
      </div>

      {/* Nav Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* Stats Overview */}
      <StatsCardsSkeleton />

      {/* Today's Trainings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-8" />
        </div>
        <TableSkeleton />
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivitySkeleton />
        <RecentActivitySkeleton />
      </div>
    </div>
  )
}
