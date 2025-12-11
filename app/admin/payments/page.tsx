import { getAllPayments } from "@/lib/api/admin"
import { PaymentsClient } from "./payments-client"

export default async function AdminPaymentsPage() {
  const payments = await getAllPayments()

  return <PaymentsClient payments={payments} />
}
