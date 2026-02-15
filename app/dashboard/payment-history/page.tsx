import { getPaymentsData } from "@/lib/api/payments";
import PaymentsClient from "./payments-client";

export default async function PaymentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawBranch = sp?.branch;
  const branchId = Array.isArray(rawBranch) ? rawBranch[0] : rawBranch;
  const fromRaw = sp?.from;
  const toRaw = sp?.to;
  const from = Array.isArray(fromRaw) ? fromRaw[0] : fromRaw;
  const to = Array.isArray(toRaw) ? toRaw[0] : toRaw;

  const { payments, tenantId } = await getPaymentsData(branchId, from, to);
  return (
    <PaymentsClient payments={payments} tenantId={tenantId} branchId={branchId} />
  );
}

