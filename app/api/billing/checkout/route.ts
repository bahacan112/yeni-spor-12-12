import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: u } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (!u?.tenant_id)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    const tenantId = String(u.tenant_id);

    const body = await req.json();
    const planId = String(body?.planId || "");
    const invoice = body?.invoice || {};
    if (!planId)
      return NextResponse.json({ error: "planId zorunlu" }, { status: 400 });

    const { data: plan } = await supabase
      .from("platform_plans")
      .select("id, name, monthly_price, yearly_price")
      .eq("id", planId)
      .single();
    if (!plan)
      return NextResponse.json({ error: "Plan bulunamadı" }, { status: 404 });

    const amount = Number(plan.monthly_price || 0);
    const payloadDesc = {
      planId,
      planName: plan.name,
      amount,
      invoice,
    };

    const svc = getSupabaseService();
    let payment: any | null = null;
    console.log("checkout:init", { tenantId, planId, amount });
    try {
      const { data: p1, error: err1 } = await svc
        .from("tenant_payments")
        .insert({
          tenant_id: tenantId,
          subscription_id: null,
          amount,
          payment_method: "iyzico",
          status: "pending",
          invoice_no: `PENDING-${Date.now()}`,
          gateway: "iyzico",
          gateway_status: "init_pending",
          description: JSON.stringify(payloadDesc),
        })
        .select("*")
        .single();
      if (err1) throw err1;
      payment = p1;
      console.log("checkout:payment-created", { paymentId: payment?.id });
    } catch (e: any) {
      const { data: p2, error: err2 } = await svc
        .from("tenant_payments")
        .insert({
          tenant_id: tenantId,
          subscription_id: null,
          amount,
          payment_method: "iyzico",
          status: "pending",
          invoice_no: `PENDING-${Date.now()}`,
          description: JSON.stringify(payloadDesc),
        })
        .select("*")
        .single();
      if (err2)
        return NextResponse.json({ error: err2.message }, { status: 400 });
      payment = p2;
      console.log("checkout:payment-created-fallback", {
        paymentId: payment?.id,
      });
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectUrl = `${base}/api/billing/iyzico/redirect?paymentId=${encodeURIComponent(
      payment.id
    )}`;
    console.log("checkout:redirect", { redirectUrl });
    return NextResponse.json({ redirectUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
