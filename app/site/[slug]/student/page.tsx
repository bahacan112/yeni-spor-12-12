import { getSupabaseServer } from "@/lib/supabase/server";
import { StudentPortal } from "@/app/student/portal";

export default async function SiteStudentPortal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const tenantId = String((tenant as any)?.id || "");
  return (
    <StudentPortal
      expectedTenantId={tenantId || undefined}
      loginHref={`/site/${slug}/login`}
    />
  );
}
