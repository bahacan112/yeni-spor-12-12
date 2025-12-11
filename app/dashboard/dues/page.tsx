import { getDuesData } from "@/lib/api/dues";
import { DuesClient } from "./dues-client";

export default async function DuesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  const monthParamRaw = sp?.month;
  const monthParam = Array.isArray(monthParamRaw)
    ? monthParamRaw[0]
    : monthParamRaw;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const defaultMonth = `${y}-${String(m).padStart(2, "0")}-01`;
  const effectiveMonth = monthParam ?? defaultMonth;
  const { dues, groups, tenantId } = await getDuesData(
    branchId,
    effectiveMonth
  );
  return (
    <DuesClient
      initialDues={dues}
      groups={groups}
      tenantId={tenantId}
      initialMonth={effectiveMonth}
    />
  );
}
