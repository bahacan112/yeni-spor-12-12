import { Suspense } from "react"
import { getBranchesData } from "@/lib/api/branches"
import BranchesClient from "./branches-client"

export const metadata = {
  title: "Şubeler",
  description: "Şube yönetimi",
}

export default async function BranchesPage() {
  const { branches, tenantId } = await getBranchesData()

  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <BranchesClient branches={branches} tenantId={tenantId} />
    </Suspense>
  )
}
