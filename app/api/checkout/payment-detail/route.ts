import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  try {
    const svc = getSupabaseService();
    const paymentId = req.nextUrl.searchParams.get("paymentId") || "";
    if (!paymentId)
      return NextResponse.json({ error: "paymentId eksik" }, { status: 400 });
    const { data: payment, error } = await svc
      .from("tenant_payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    if (!payment)
      return NextResponse.json({ error: "Ödeme bulunamadı" }, { status: 404 });
    let meta: any = {};
    try {
      meta = JSON.parse(String(payment.description || "{}"));
    } catch {
      meta = {};
    }
    return NextResponse.json({
      paymentId: String(payment.id),
      planName: String(meta.planName || ""),
      amount: Number(meta.amount || payment.amount || 0),
      paidAt: payment.paid_at,
      tenantId: String(payment.tenant_id),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
