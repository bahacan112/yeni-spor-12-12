import { getTenantData } from "@/lib/api/tenant"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const { tenant, branches, stats } = await getTenantData()
  return <SettingsClient tenant={tenant} branches={branches} stats={stats} />
}
