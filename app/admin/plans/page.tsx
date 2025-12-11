import { getAllPlans } from "@/lib/api/admin"
import { PlansClient } from "./plans-client"

export default async function AdminPlansPage() {
  const plans = await getAllPlans()

  return <PlansClient plans={plans} />
}
