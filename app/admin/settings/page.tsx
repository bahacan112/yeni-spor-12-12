import { getPlatformSettings } from "@/lib/api/admin"
import SettingsClient from "./settings-client"

export default async function AdminSettingsPage() {
  const initialSettings = await getPlatformSettings()

  return <SettingsClient initialSettings={initialSettings} />
}
