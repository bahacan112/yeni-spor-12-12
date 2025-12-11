import { getStudentsData } from "@/lib/api/students";
import { StudentsClient } from "./students-client";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  const { students, groups, branches, tenantId } = await getStudentsData(
    branchId
  );

  return (
    <StudentsClient
      initialStudents={students}
      groups={groups}
      branches={branches}
      tenantId={tenantId}
    />
  );
}
