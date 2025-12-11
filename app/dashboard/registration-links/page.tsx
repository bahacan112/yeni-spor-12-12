import { Suspense } from "react"
import { getRegistrationLinksData } from "@/lib/api/registration-links"
import RegistrationLinksClient from "./registration-links-client"

export const metadata = {
  title: "Kayıt Linkleri",
  description: "Kayıt linkleri yönetimi",
}

export default async function RegistrationLinksPage() {
  const { links, tenantId } = await getRegistrationLinksData()

  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <RegistrationLinksClient links={links} tenantId={tenantId} />
    </Suspense>
  )
}
