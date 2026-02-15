import { getSupabaseServer } from "@/lib/supabase/server";
import { SportsClient } from "./sports-client";

export default async function SportsPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const { data: userRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  const tenantId = userRow?.tenant_id as string;

  const { data: sports } = await supabase
    .from("sports")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const items = (sports || []).map((s: any) => ({
    id: String(s.id),
    name: String(s.name),
    slug: s.slug ? String(s.slug) : undefined,
    isActive: Boolean(s.is_active),
    sortOrder: Number(s.sort_order || 0),
  }));

  return <SportsClient initialSports={items} tenantId={tenantId} />;
}
