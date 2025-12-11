import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ApplicationsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-2 text-center">
              <Skeleton className="h-4 w-4 mx-auto mb-1" />
              <Skeleton className="h-5 w-8 mx-auto mb-1" />
              <Skeleton className="h-2 w-12 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-3">
              <Skeleton className="h-16 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
