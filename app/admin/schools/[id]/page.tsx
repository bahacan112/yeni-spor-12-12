import { getTenantDetails, getAllPlans } from "@/lib/api/admin"
import SchoolDetailClient from "./school-detail-client"
import { notFound } from "next/navigation"

export default async function AdminSchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantDetails(id);
  
  if (!tenant) {
    notFound();
  }

  const plans = await getAllPlans();

  return <SchoolDetailClient tenant={tenant} plans={plans} />;
}
