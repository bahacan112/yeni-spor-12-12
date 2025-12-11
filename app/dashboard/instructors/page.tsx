import { getInstructorsData } from "@/lib/api/instructors";
import { InstructorsClient } from "./instructors-client";

export default async function InstructorsPage() {
  const { instructors, groups, tenantId } = await getInstructorsData();

  return (
    <InstructorsClient
      initialInstructors={instructors}
      groups={groups}
      tenantId={tenantId}
    />
  );
}
