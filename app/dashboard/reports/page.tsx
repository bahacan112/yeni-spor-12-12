import { getReportsData } from "@/lib/api/reports";
import ReportsClient from "./reports-client";
import { getSetupStatus } from "@/lib/api/setup";
import { redirect } from "next/navigation";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  const setup = await getSetupStatus();
  if (!setup.isComplete) {
    redirect("/dashboard/setup");
  }
  const { monthly, methodDist, typeDist, tenantId } = await getReportsData(
    branchId
  );
  return (
    <ReportsClient
      monthly={monthly}
      methodDist={methodDist}
      typeDist={typeDist}
      tenantId={tenantId}
      branchId={branchId}
    />
  );
}
