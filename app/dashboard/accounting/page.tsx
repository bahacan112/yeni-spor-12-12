import { Suspense } from "react";
import { getAccountingData } from "@/lib/api/accounting";
import AccountingClient from "./accounting-client";

export const metadata = {
  title: "Muhasebe",
  description: "Gelir gider takibi",
};

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  const { payments, expenses, stats, tenantId } = await getAccountingData(
    branchId
  );

  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <AccountingClient
        payments={payments}
        expenses={expenses}
        stats={stats}
        tenantId={tenantId}
        branchId={branchId}
      />
    </Suspense>
  );
}
