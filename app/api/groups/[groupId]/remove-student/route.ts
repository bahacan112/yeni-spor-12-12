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
    const bearer = authHeader && authHeader.toLowerCase().startsWith("bearer ")
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

  const { error } = await client
    .from("student_groups")
    .update({
      status: "left",
      left_at: new Date().toISOString().split("T")[0],
    })
    .eq("group_id", groupId)
    .eq("student_id", studentId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

