import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!userData || userData.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const tenantId = String(body.tenantId || "");
  const suspend = Boolean(body.suspend);
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId zorunlu" }, { status: 400 });
  }

  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseService() : supabase;
  const updates: Record<string, any> = {};
  updates.subscription_status = suspend ? "inactive" : "active";

  const { data: updated, error } = await svc
    .from("tenants")
    .update(updates)
    .eq("id", tenantId)
    .select("id, subscription_status")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: updated.id, subscriptionStatus: updated.subscription_status });
}

