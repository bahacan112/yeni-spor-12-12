import { getGroupDetails } from "@/lib/api/groups";
import { GroupDetailClient } from "./group-detail-client";
import { notFound } from "next/navigation";
import { Training } from "@/lib/types";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getGroupDetails(id);

  if (!data || !data.group) {
    notFound();
  }

  return (
    <GroupDetailClient
      group={data.group}
      students={data.students}
      trainings={(data.trainings || []) as Training[]}
    />
  );
}
