import { Suspense } from "react";
import PolicyClient from "./policy-client";
import { getSupabaseServer } from "@/lib/supabase/server";

export const metadata = {
  title: "Aidat Politikası",
  description: "Şube bazlı aidat ve devamsızlık kuralları",
};

export default async function PolicyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp?.branch;
  const branchId = Array.isArray(raw) ? raw[0] : raw;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!userData?.tenant_id) throw new Error("Tenant not found");

  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <PolicyClient branchId={branchId} tenantId={userData.tenant_id} />
    </Suspense>
  );
}

