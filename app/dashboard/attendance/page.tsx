import { getAttendanceData } from "@/lib/api/attendance";
import { AttendanceClient } from "./attendance-client";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
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
