import { getStudentDetails } from "@/lib/api/students"
import { StudentDetailClient } from "./student-detail-client"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getStudentDetails(id)

  if (!data || !data.student) {
    notFound()
  }

  return <StudentDetailClient student={data.student} groups={data.groups} allBranchGroups={data.allBranchGroups} monthlyDues={data.monthlyDues} />
}
