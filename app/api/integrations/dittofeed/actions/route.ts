import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getDittofeedAdmin } from "@/lib/integrations/dittofeed";

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!u || u.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const admin = getDittofeedAdmin();
    const actions = await admin.listActions();
    return NextResponse.json({ actions });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!u || u.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const key = String(body.key || "");
  if (!key) return NextResponse.json({ error: "key gerekli" }, { status: 400 });
  try {
    const admin = getDittofeedAdmin();
    const created = await admin.createAction({
      key,
      name: typeof body.name === "string" ? body.name : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      conditions:
        body.conditions && typeof body.conditions === "object"
          ? body.conditions
          : undefined,
      steps: Array.isArray(body.steps) ? body.steps : undefined,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? body.metadata
          : undefined,
    });
    return NextResponse.json({ action: created });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
