import { getAllNotifications, getAllTenants } from "@/lib/api/admin"
import { NotificationsClient } from "./notifications-client"

export default async function AdminNotificationsPage() {
  const notifications = await getAllNotifications()
  const tenants = await getAllTenants()

  return <NotificationsClient notifications={notifications} tenants={tenants} />
}
