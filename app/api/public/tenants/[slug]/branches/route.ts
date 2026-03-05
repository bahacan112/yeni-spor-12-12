import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const p = await ctx.params;
  const slug = String(p?.slug || "");
  if (!slug) {
    return NextResponse.json({ branches: [] });
  }
  const svc = getSupabaseService();
  const { data: t } = await svc
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const tenantId = String(t?.id || "");
  if (!tenantId) return NextResponse.json({ branches: [] });
  const { data: bs } = await svc
    .from("branches")
    .select("id,name,is_active")
    .eq("tenant_id", tenantId)
    .order("name");
  return NextResponse.json({
    branches: (bs || []).map((b: any) => ({
      id: String(b.id),
      name: String(b.name),
      isActive: b.is_active !== false,
    })),
  });
}
