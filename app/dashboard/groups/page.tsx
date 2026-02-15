import { getGroupsData } from "@/lib/api/groups";
import { GroupsClient } from "./groups-client";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;
  const { groups, instructors, branches, tenantId, sports } =
    await getGroupsData(branchId);
  return (
    <GroupsClient
      initialGroups={groups}
      instructors={instructors}
      branches={branches}
      tenantId={tenantId}
      sports={sports}
    />
  );
}
