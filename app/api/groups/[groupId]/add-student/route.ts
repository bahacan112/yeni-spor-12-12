import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  let supabase = await getSupabaseServer();
  let {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const authHeader = req.headers.get("authorization");
    const bearer =
      authHeader && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7)
        : undefined;
    if (bearer) {
      const alt = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${bearer}` } },
          auth: { persistSession: false },
        }
      );
      const r = await alt.auth.getUser();
      user = r.data.user || null;
      supabase = alt as any;
    }
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: u } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  const tenantId = u?.tenant_id as string | undefined;
  if (!tenantId)
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { groupId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const studentId = String(body.studentId || "");
  if (!studentId)
    return NextResponse.json({ error: "studentId zorunlu" }, { status: 400 });

  const client = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : supabase;

  const { data: existing, error: existErr } = await client
    .from("student_groups")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (existErr)
    return NextResponse.json({ error: existErr.message }, { status: 400 });

  if (!existing) {
    const { error: insErr } = await client.from("student_groups").insert({
      student_id: studentId,
      group_id: groupId,
      status: "active",
      joined_at: new Date().toISOString().split("T")[0],
      left_at: null,
    });
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } else {
    const { error: updErr } = await client
      .from("student_groups")
      .update({
        status: "active",
        left_at: null,
      })
      .eq("id", existing.id);
    if (updErr)
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
}
