import { getPublicWebsiteData } from "@/lib/api/public-website";
import { SiteLoginClient } from "./login-client";

export default async function SiteLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await getPublicWebsiteData(slug);
  const tenantId = String((tenant as any)?.id || "");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <SiteLoginClient tenantId={tenantId} slug={slug} />
    </div>
  );
}
