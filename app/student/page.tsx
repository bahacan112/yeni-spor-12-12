import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { StudentPortal } from "@/app/student/portal";

export default async function StudentPortalPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <StudentPortal />;

  const { data: u } = await supabase
    .from("users")
    .select("tenant:tenants(slug)")
    .eq("id", user.id)
    .maybeSingle();
  const slug = String((u as any)?.tenant?.slug || "");
  if (slug) redirect(`/site/${slug}/student`);
  return <StudentPortal />;
}
