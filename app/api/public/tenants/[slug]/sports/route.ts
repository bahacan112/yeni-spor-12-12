import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const p = await ctx.params;
  const slug = String(p?.slug || "");
  if (!slug) {
    return NextResponse.json({ sports: [] });
  }
  const svc = getSupabaseService();
  const { data: t } = await svc
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const tenantId = String(t?.id || "");
  if (!tenantId) return NextResponse.json({ sports: [] });
  const { data: ss } = await svc
    .from("sports")
    .select("id,name,is_active")
    .eq("tenant_id", tenantId)
    .order("name");
  return NextResponse.json({
    sports: (ss || []).map((s: any) => ({
      id: String(s.id),
      name: String(s.name),
      isActive: s.is_active !== false,
    })),
  });
}
