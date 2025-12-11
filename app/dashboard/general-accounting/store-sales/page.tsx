import { headers, cookies } from "next/headers"
import StoreSalesClient from "./store-sales-client"

export const metadata = { title: "Mağaza Satışları" }

export default async function StoreSalesPage() {
  const hdrs = await headers()
  const host = hdrs.get("host") || "localhost:3000"
  const protocol = process.env.VERCEL ? "https" : "http"
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ")

  const res = await fetch(`${base}/api/dashboard/store-sales`, {
    cache: "no-store",
    next: { revalidate: 0 },
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })

  if (res.status === 403) {
    return <div className="p-4">Bu bölüme erişiminiz yok.</div>
  }
  if (!res.ok) {
    return <div className="p-4">Veriler yüklenemedi.</div>
  }

  const summary = (await res.json()) as {
    totalSalesAmount: number
    totalOrders: number
    recentOrders: Array<{ id: string; orderNo: string; total: number; status: string; createdAt: string }>
  }

  return (
    <div className="p-4 md:p-6">
      <StoreSalesClient summary={summary} />
    </div>
  )
}
