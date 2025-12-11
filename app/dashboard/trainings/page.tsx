import { getTrainingsData } from "@/lib/api/trainings";
import { TrainingsClient } from "./trainings-client";

export default async function TrainingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  const { trainings, instructors, groups, venues, tenantId } =
    await getTrainingsData(branchId);
  return (
    <TrainingsClient
      initialTrainings={trainings}
      instructors={instructors}
      groups={groups}
      venues={venues}
      tenantId={tenantId}
    />
  );
}
