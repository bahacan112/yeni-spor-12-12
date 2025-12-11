import { Suspense } from "react"
import { getApplicationsData } from "@/lib/api/applications"
import ApplicationsClient from "./applications-client"

export const metadata = {
  title: "Başvurular",
  description: "Üyelik başvuruları",
}

export default async function ApplicationsPage() {
  const { applications, stats } = await getApplicationsData()

  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ApplicationsClient applications={applications} stats={stats} />
    </Suspense>
  )
}
