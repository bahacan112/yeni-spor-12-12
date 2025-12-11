import { Skeleton } from "@/components/ui/skeleton"

export default function InstructorsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Search Skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* List Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  )
}
