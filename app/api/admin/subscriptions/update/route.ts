import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!userData || userData.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const tenantId = String(body.tenantId || "");
  if (!tenantId) return NextResponse.json({ error: "tenantId zorunlu" }, { status: 400 });

  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseService() : supabase;
  const { data: subs } = await svc
    .from("tenant_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);
  const sub = subs?.[0];
  if (!sub) return NextResponse.json({ error: "Aktif abonelik bulunamadı" }, { status: 404 });

  const fields: any = {};
  if (typeof body.autoRenew === "boolean") fields.auto_renew = body.autoRenew;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const { error } = await svc.from("tenant_subscriptions").update(fields).eq("id", sub.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

