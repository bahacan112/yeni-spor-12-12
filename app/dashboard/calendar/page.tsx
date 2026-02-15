import { getCalendarData } from "@/lib/api/calendar";
import CalendarClient from "./calendar-client";
import { getSetupStatus } from "@/lib/api/setup";
import { redirect } from "next/navigation";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  const mRaw = sp?.month;
  const month = Array.isArray(mRaw) ? mRaw[0] : mRaw;
  const setup = await getSetupStatus();
  if (!setup.isComplete) {
    redirect("/dashboard/setup");
  }
  const { trainings, tenantId } = await getCalendarData(branchId, month);
  return (
    <CalendarClient
      trainings={trainings}
      tenantId={tenantId}
      initialMonth={month}
    />
  );
}
