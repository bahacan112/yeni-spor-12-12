import { getAllSubscriptions } from "@/lib/api/admin"
import SubscriptionsClient from "./subscriptions-client"

export default async function AdminSubscriptionsPage() {
  const initialSubscriptions = await getAllSubscriptions()

  return <SubscriptionsClient initialSubscriptions={initialSubscriptions} />
}
