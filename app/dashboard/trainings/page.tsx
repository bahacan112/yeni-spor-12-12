import { getTrainingsData } from "@/lib/api/trainings";
import { TrainingsClient } from "./trainings-client";
import { getSetupStatus } from "@/lib/api/setup";
import { redirect } from "next/navigation";

export default async function TrainingsPage({
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
  const { trainings, instructors, groups, venues, branches, tenantId } =
    await getTrainingsData(branchId);
  return (
    <TrainingsClient
      initialTrainings={trainings}
      instructors={instructors}
      groups={groups}
      venues={venues}
      branches={branches}
      tenantId={tenantId}
    />
  );
}
