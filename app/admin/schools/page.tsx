import { getAllTenants, getAllSubscriptions, getAllPlans } from "@/lib/api/admin"
import { SchoolsClient } from "./schools-client"

export default async function AdminSchoolsPage() {
  const tenants = await getAllTenants()
  const subscriptions = await getAllSubscriptions()
  const plans = await getAllPlans()

  return <SchoolsClient tenants={tenants} subscriptions={subscriptions} plans={plans} />
}
