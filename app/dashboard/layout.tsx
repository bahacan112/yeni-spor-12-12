import type React from "react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { getSupabaseServer } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();

  // Fetch tenant info
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let tenantName = "Spor Okulu";
  let userProfile = null;
  let branches: any[] = [];

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("*, tenant:tenants(name)")
      .eq("id", user.id)
      .single();

    if (userData) {
      userProfile = userData;
      // @ts-ignore
      if (userData.tenant?.name) {
        // @ts-ignore
        tenantName = userData.tenant.name;
      }

      if (userData.tenant_id) {
        const { data: branchesData } = await supabase
          .from("branches")
          .select("*")
          .eq("tenant_id", userData.tenant_id);
        branches = branchesData || [];
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar - Desktop */}
      <Sidebar tenantName={tenantName} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <MobileHeader
          tenantName={tenantName}
          user={userProfile}
          branches={branches}
        />

        <Breadcrumbs />

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
