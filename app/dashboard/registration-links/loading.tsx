import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function RegistrationLinksLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-3 text-center">
              <Skeleton className="h-8 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
