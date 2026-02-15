import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

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
  const months = Number(body.months || 0);
  if (!tenantId || !months || Number.isNaN(months) || months <= 0) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

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

  const currentEnd = new Date(sub.current_period_end || new Date());
  const newEnd = addMonths(currentEnd, months);
  const { data: updated, error } = await svc
    .from("tenant_subscriptions")
    .update({ current_period_end: newEnd.toISOString() })
    .eq("id", sub.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    id: updated.id,
    tenantId: updated.tenant_id,
    planId: updated.plan_id,
    currentPeriodEnd: updated.current_period_end,
  });
}

