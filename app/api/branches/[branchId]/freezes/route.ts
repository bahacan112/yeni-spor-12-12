import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ branchId: string }> }
) {
  const { branchId } = await context.params;
  const body = await req.json();
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

  const payload = {
    tenant_id: userData.tenant_id,
    branch_id: branchId,
    student_id: body.student_id,
    due_month: body.due_month, // first day of month (YYYY-MM-01)
    reason: body.reason,
    justified: !!body.justified,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("student_month_freezes")
    .upsert(payload, { onConflict: "student_id,due_month" })
    .select("*")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ freeze: data });
}
