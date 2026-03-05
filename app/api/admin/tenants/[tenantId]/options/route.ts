import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const p = await ctx.params;
  const tenantId = String(p?.tenantId || "");
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId gerekli" }, { status: 400 });
  }
  const svc = getSupabaseService();
  const { data: branches } = await svc
    .from("branches")
    .select("id,name,is_active")
    .eq("tenant_id", tenantId)
    .order("name");
  const { data: sports } = await svc
    .from("sports")
    .select("id,name,is_active")
    .eq("tenant_id", tenantId)
    .order("name");
  return NextResponse.json({
    branches: (branches || []).map((b: any) => ({
      id: String(b.id),
      name: String(b.name),
      isActive: b.is_active !== false,
    })),
    sports: (sports || []).map((s: any) => ({
      id: String(s.id),
      name: String(s.name),
      isActive: s.is_active !== false,
    })),
  });
}
