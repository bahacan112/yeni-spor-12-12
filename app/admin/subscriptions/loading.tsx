import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminSubscriptionsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-64 bg-slate-800" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full bg-slate-800" />
        </CardContent>
      </Card>
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <Skeleton className="h-20 w-full bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
