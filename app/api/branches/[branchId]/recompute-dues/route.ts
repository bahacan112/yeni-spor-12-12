import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ branchId: string }> }
) {
  const { branchId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!userData?.tenant_id)
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const month = body.month || new Date().toISOString().slice(0, 7) + "-01";

  const { data, error } = await supabase.rpc("generate_monthly_dues_v3", {
    p_tenant_id: userData.tenant_id,
    p_branch_id: branchId,
    p_due_month: month,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
