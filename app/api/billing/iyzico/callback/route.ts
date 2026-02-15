import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function POST(req: NextRequest) {
  const svc = getSupabaseService();
  let token = req.nextUrl.searchParams.get("token") || "";
  if (!token) {
    try {
      const fd = await req.formData();
      const v = (fd as any)?.get ? (fd as any).get("token") : undefined;
      token = String(v || "");
    } catch {}
  }
  if (!token) {
    try {
      const j = await req.json();
      token = String((j as any)?.token || "");
    } catch {}
  }
  console.log("callback:token-resolved", { hasToken: !!token });
  if (!token)
    return NextResponse.json({ error: "token eksik" }, { status: 400 });

  const { data: payment } = await svc
    .from("tenant_payments")
    .select("*")
    .eq("invoice_no", token)
    .maybeSingle();
  let paymentRecord: any = payment || null;
  if (!paymentRecord) {
    try {
      const IyzipayMod = await import("iyzipay");
      const Iyzipay: any = (IyzipayMod as any).default ?? IyzipayMod;
      const iyzipay = new Iyzipay({
        apiKey: process.env.IYZI_API_KEY || "",
        secretKey: process.env.IYZI_SECRET_KEY || "",
        uri: process.env.IYZI_BASE_URL || "https://sandbox-api.iyzipay.com",
      });
      const result = await new Promise<any>((resolve, reject) => {
        iyzipay.checkoutForm.retrieve(
          { locale: Iyzipay.LOCALE.TR, token },
          (err: any, res: any) => {
            if (err) reject(err);
            else resolve(res);
          }
        );
      });
      const convId = String(result?.conversationId || "");
      if (convId) {
        const { data: byConv } = await svc
          .from("tenant_payments")
          .select("*")
          .eq("id", convId)
          .maybeSingle();
        paymentRecord = byConv || null;
        try {
          await svc
            .from("tenant_payments")
            .update({
              gateway_status: String(result?.status || "") || null,
              gateway_error_code: String(result?.errorCode || "") || null,
              gateway_error_message: String(result?.errorMessage || "") || null,
              gateway_payload: result || null,
              gateway_token: String(result?.token || "") || null,
              invoice_no: String(result?.token || "") || undefined,
            })
            .eq("id", convId);
        } catch {}
      }
      if (!paymentRecord) {
        const { data: latest } = await svc
          .from("tenant_payments")
          .select("*")
          .eq("payment_method", "iyzico")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1);
        paymentRecord = latest?.[0] || null;
        if (paymentRecord) {
          try {
            await svc
              .from("tenant_payments")
              .update({ invoice_no: token })
              .eq("id", paymentRecord.id);
          } catch {}
        }
      }
    } catch {}
  }
  if (!paymentRecord)
    return NextResponse.json(
      { error: "Ödeme kaydı bulunamadı" },
      { status: 404 }
    );
  console.log("callback:payment-found", { paymentId: paymentRecord.id });

  let meta: any = {};
  try {
    meta = JSON.parse(String(payment.description || "{}"));
  } catch {
    meta = {};
  }
  const amount = Number(meta.amount || paymentRecord.amount || 0);
  const planId = String(meta.planId || "");
  const tenantId = String(paymentRecord.tenant_id);
  const now = new Date();
  const end = addMonths(new Date(now), 1);

  let iyzicoStatus = "";
  let iyzicoPaymentStatus = "";
  let iyzicoErrorCode = "";
  let iyzicoErrorMessage = "";
  try {
    const IyzipayMod = await import("iyzipay");
    const Iyzipay: any = (IyzipayMod as any).default ?? IyzipayMod;
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZI_API_KEY || "",
      secretKey: process.env.IYZI_SECRET_KEY || "",
      uri: process.env.IYZI_BASE_URL || "https://sandbox-api.iyzipay.com",
    });
    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(
        { locale: Iyzipay.LOCALE.TR, token },
        (err: any, res: any) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
    });
    iyzicoStatus = String(result?.status || "");
    iyzicoPaymentStatus = String(result?.paymentStatus || "");
    iyzicoErrorCode = String(result?.errorCode || "");
    iyzicoErrorMessage = String(result?.errorMessage || "");
    console.log("callback:retrieve", {
      status: iyzicoStatus,
      paymentStatus: iyzicoPaymentStatus,
      conversationId: String(result?.conversationId || ""),
    });
    try {
      await svc
        .from("tenant_payments")
        .update({
          gateway_status: iyzicoStatus || null,
          gateway_error_code: iyzicoErrorCode || null,
          gateway_error_message: iyzicoErrorMessage || null,
          gateway_payload: result || null,
        })
        .eq("id", paymentRecord.id);
    } catch {}
  } catch {}

  if (!(iyzicoStatus === "success" && iyzicoPaymentStatus === "SUCCESS")) {
    await svc
      .from("tenant_payments")
      .update({ status: "failed" })
      .eq("id", paymentRecord.id);
    console.log("callback:failed", {
      paymentId: paymentRecord.id,
      status: iyzicoStatus,
      paymentStatus: iyzicoPaymentStatus,
    });
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirect = `${base}/checkout/error?paymentId=${encodeURIComponent(
      String(paymentRecord.id)
    )}`;
    return NextResponse.redirect(redirect);
  }

  await svc
    .from("tenant_payments")
    .update({ status: "completed", paid_at: now.toISOString() })
    .eq("id", paymentRecord.id);
  console.log("callback:completed", { paymentId: paymentRecord.id });

  const { data: subs } = await svc
    .from("tenant_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);
  const sub = subs?.[0];
  if (!sub) {
    await svc.from("tenant_subscriptions").insert({
      tenant_id: tenantId,
      plan_id: planId,
      billing_period: "monthly",
      amount,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      auto_renew: true,
      payment_method: "iyzico",
    });
  } else {
    await svc
      .from("tenant_subscriptions")
      .update({
        plan_id: planId,
        amount,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        payment_method: "iyzico",
        updated_at: now.toISOString(),
      })
      .eq("id", sub.id);
  }

  await svc
    .from("tenants")
    .update({ subscription_status: "active", is_limited: false })
    .eq("id", tenantId);

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const redirect = `${base}/checkout/success?paymentId=${encodeURIComponent(
    String(paymentRecord.id)
  )}`;
  return NextResponse.redirect(redirect);
}

export async function GET(req: NextRequest) {
  const svc = getSupabaseService();
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token)
    return NextResponse.json({ error: "token eksik" }, { status: 400 });
  const { data: paymentByToken } = await svc
    .from("tenant_payments")
    .select("*")
    .eq("invoice_no", token)
    .maybeSingle();
  let payment: any = paymentByToken || null;
  if (!payment) {
    try {
      const IyzipayMod = await import("iyzipay");
      const Iyzipay: any = (IyzipayMod as any).default ?? IyzipayMod;
      const iyzipay = new Iyzipay({
        apiKey: process.env.IYZI_API_KEY || "",
        secretKey: process.env.IYZI_SECRET_KEY || "",
        uri: process.env.IYZI_BASE_URL || "https://sandbox-api.iyzipay.com",
      });
      const result = await new Promise<any>((resolve, reject) => {
        iyzipay.checkoutForm.retrieve(
          { locale: Iyzipay.LOCALE.TR, token },
          (err: any, res: any) => {
            if (err) reject(err);
            else resolve(res);
          }
        );
      });
      const convId = String(result?.conversationId || "");
      if (convId) {
        const { data: byConv } = await svc
          .from("tenant_payments")
          .select("*")
          .eq("id", convId)
          .maybeSingle();
        payment = byConv || null;
        try {
          await svc
            .from("tenant_payments")
            .update({
              gateway_status: String(result?.status || "") || null,
              gateway_error_code: String(result?.errorCode || "") || null,
              gateway_error_message: String(result?.errorMessage || "") || null,
              gateway_payload: result || null,
              gateway_token: String(result?.token || "") || null,
              invoice_no: String(result?.token || "") || undefined,
            })
            .eq("id", convId);
        } catch {}
      }
      if (!payment) {
        const { data: latest } = await svc
          .from("tenant_payments")
          .select("*")
          .eq("payment_method", "iyzico")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1);
        payment = latest?.[0] || null;
        if (payment) {
          try {
            await svc
              .from("tenant_payments")
              .update({ invoice_no: token })
              .eq("id", payment.id);
          } catch {}
        }
      }
    } catch {}
  }
  if (!payment)
    return NextResponse.json(
      { error: "Ödeme kaydı bulunamadı" },
      { status: 404 }
    );
  let meta: any = {};
  try {
    meta = JSON.parse(String(payment.description || "{}"));
  } catch {
    meta = {};
  }
  const amount = Number(meta.amount || payment.amount || 0);
  const planId = String(meta.planId || "");
  const tenantId = String(payment.tenant_id);
  const now = new Date();
  const end = addMonths(new Date(now), 1);
  let iyzicoStatus = "";
  let iyzicoPaymentStatus = "";
  let iyzicoErrorCode = "";
  let iyzicoErrorMessage = "";
  try {
    const IyzipayMod = await import("iyzipay");
    const Iyzipay: any = (IyzipayMod as any).default ?? IyzipayMod;
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZI_API_KEY || "",
      secretKey: process.env.IYZI_SECRET_KEY || "",
      uri: process.env.IYZI_BASE_URL || "https://sandbox-api.iyzipay.com",
    });
    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve(
        { locale: Iyzipay.LOCALE.TR, token },
        (err: any, res: any) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
    });
    iyzicoStatus = String(result?.status || "");
    iyzicoPaymentStatus = String(result?.paymentStatus || "");
    iyzicoErrorCode = String(result?.errorCode || "");
    iyzicoErrorMessage = String(result?.errorMessage || "");
    try {
      await svc
        .from("tenant_payments")
        .update({
          gateway_status: iyzicoStatus || null,
          gateway_error_code: iyzicoErrorCode || null,
          gateway_error_message: iyzicoErrorMessage || null,
          gateway_payload: result || null,
        })
        .eq("id", payment.id);
    } catch {}
  } catch {}
  if (!(iyzicoStatus === "success" && iyzicoPaymentStatus === "SUCCESS")) {
    await svc
      .from("tenant_payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirect = `${base}/checkout/error?paymentId=${encodeURIComponent(
      String(payment.id)
    )}`;
    return NextResponse.redirect(redirect);
  }
  await svc
    .from("tenant_payments")
    .update({ status: "completed", paid_at: now.toISOString() })
    .eq("id", payment.id);
  const { data: subs } = await svc
    .from("tenant_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);
  const sub = subs?.[0];
  if (!sub) {
    await svc.from("tenant_subscriptions").insert({
      tenant_id: tenantId,
      plan_id: planId,
      billing_period: "monthly",
      amount,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      auto_renew: true,
      payment_method: "iyzico",
    });
  } else {
    await svc
      .from("tenant_subscriptions")
      .update({
        plan_id: planId,
        amount,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        payment_method: "iyzico",
        updated_at: now.toISOString(),
      })
      .eq("id", sub.id);
  }
  await svc
    .from("tenants")
    .update({ subscription_status: "active", is_limited: false })
    .eq("id", tenantId);
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const redirect = `${base}/checkout/success?paymentId=${encodeURIComponent(
    String(payment.id)
  )}`;
  return NextResponse.redirect(redirect);
}
