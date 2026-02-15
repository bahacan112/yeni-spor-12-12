import { getAttendanceData } from "@/lib/api/attendance";
import { AttendanceClient } from "./attendance-client";
import { getSetupStatus } from "@/lib/api/setup";
import { redirect } from "next/navigation";

export default async function AttendancePage({
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
  const { trainings, students, attendance, tenantId } = await getAttendanceData(
    branchId
  );
  return (
    <AttendanceClient
      trainings={trainings}
      students={students}
      initialAttendance={attendance}
      tenantId={tenantId}
    />
  );
}
