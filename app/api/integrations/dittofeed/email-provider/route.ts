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
    const providers = await admin.listEmailProviders();
    return NextResponse.json({ providers });
  } catch (e: any) {
    return NextResponse.json({ providers: [] });
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
  const host = String(body.host || "");
  const portNum = Number(body.port);
  const username = String(body.username || "");
  const password = String(body.password || "");
  const secure = Boolean(body.secure);
  const from = typeof body.from === "string" ? body.from : undefined;
  const fromName =
    typeof body.fromName === "string" ? body.fromName : undefined;
  const setDefault = Boolean(body.setDefault);
  if (!host || !portNum || !username || !password) {
    return NextResponse.json(
      { error: "host, port, username, password gerekli" },
      { status: 400 }
    );
  }
  try {
    const admin = getDittofeedAdmin();
    const result = await admin.configureSmtp({
      host,
      port: portNum,
      secure,
      username,
      password,
      from,
      fromName,
      setDefault,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
