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
  const channel = String(body.channel || "email"); // email | sms | push | all
  const subject = String(body.subject || "");
  const content = String(body.content || "");
  if (!tenantId || !content) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseService() : supabase;

  const channels =
    channel === "all" ? ["email", "sms", "push"] : [channel].filter((c) => ["email", "sms", "push"].includes(c));

  const payloads = channels.map((ch) => ({
    tenant_id: tenantId,
    template_id: null,
    recipient_type: "tenant_admin",
    recipient_contact: "",
    channel: ch,
    subject: subject || null,
    content,
    status: "pending",
    error_message: null,
  }));

  const { error } = await svc.from("notification_logs").insert(payloads);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, count: payloads.length });
}

