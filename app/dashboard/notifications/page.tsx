import { getNotificationsData } from "@/lib/api/notifications"
import { NotificationsClient } from "./notifications-client"

export default async function NotificationsPage() {
  const { dues, students, templates, tenantId } = await getNotificationsData()
  return <NotificationsClient dues={dues} students={students} templates={templates} tenantId={tenantId} />
}
