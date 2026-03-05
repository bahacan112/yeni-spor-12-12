import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PublicReservationPage } from "./public-reservation-page";

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();

  // Get tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, website_enabled")
    .eq("slug", slug)
    .single();

  if (!tenant || !tenant.website_enabled) {
    notFound();
  }

  // Get active venues with hourly_rate
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, hourly_rate, type, capacity, description")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .not("hourly_rate", "is", null)
    .gt("hourly_rate", 0)
    .order("name");

  return (
    <PublicReservationPage
      venues={venues || []}
      tenantId={tenant.id}
      tenantName={tenant.name}
    />
  );
}
