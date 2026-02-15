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
  if (!error) {
    return NextResponse.json({ ok: true, count: data ?? 0 });
  }

  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("tenant_id", userData.tenant_id)
    .eq("branch_id", branchId)
    .eq("status", "active");

  if (!students || students.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  let ok = 0;
  for (const s of students as { id: string }[]) {
    const { error: compErr } = await supabase.rpc("compute_monthly_due_v3", {
      p_tenant_id: userData.tenant_id,
      p_branch_id: branchId,
      p_student_id: s.id,
      p_due_month: month,
    });
    if (!compErr) ok++;
  }
  return NextResponse.json({ ok: true, count: ok });
}
