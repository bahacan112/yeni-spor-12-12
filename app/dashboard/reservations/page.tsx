import { getSupabaseServer } from "@/lib/supabase/server";
import { getSetupStatus } from "@/lib/api/setup";
import { redirect } from "next/navigation";
import { ReservationsClient } from "./reservations-client";

export default async function ReservationsPage({
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

  const supabase = await getSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  const tenantId = userRow?.tenant_id;

  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, hourly_rate, type, capacity")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name");

  return (
    <ReservationsClient
      venues={venues || []}
      tenantId={tenantId}
      branchId={branchId}
    />
  );
}
