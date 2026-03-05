import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

export const runtime = "nodejs";

function toStringPrice(n: number) {
  const v = Number(n || 0);
  return v.toFixed(2);
}

export async function GET(req: NextRequest) {
  const svc = getSupabaseService();
  const paymentId = req.nextUrl.searchParams.get("paymentId") || "";
  if (!paymentId)
    return NextResponse.json({ error: "paymentId eksik" }, { status: 400 });

  const { data: payment } = await svc
    .from("tenant_payments")
    .select("*")
    .eq("id", paymentId)
    .single();
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
  const planName = String(meta.planName || "Abonelik");
  const tenantId = String(payment.tenant_id);
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const callbackUrl = `${base}/api/billing/iyzico/callback`;
  console.log("redirect:init", { paymentId, tenantId, amount, planName });

  let content = "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let Iyzipay: any;
    try {
      // Use require so that a missing package fails at runtime, not at build time
      Iyzipay = require("iyzipay");
      if (Iyzipay && Iyzipay.default) Iyzipay = Iyzipay.default;
    } catch {
      return NextResponse.json(
        { error: "iyzipay paketi yüklü değil. Sistem yöneticisiyle iletişime geçin." },
        { status: 503 }
      );
    }

    const apiKey = process.env.IYZI_API_KEY || "";
    const secretKey = process.env.IYZI_SECRET_KEY || "";
    const uri = process.env.IYZI_BASE_URL || "https://sandbox-api.iyzipay.com";
    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "iyzico anahtarları eksik" },
        { status: 400 }
      );
    }
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZI_API_KEY || "",
      secretKey: process.env.IYZI_SECRET_KEY || "",
      uri: process.env.IYZI_BASE_URL || "https://sandbox-api.iyzipay.com",
    });
    const fullName = String((meta.invoice || {}).companyName || "Musteri");
    const nameParts = fullName.trim().split(/\s+/);
    const name = nameParts[0] || "Musteri";
    const surname = nameParts.slice(1).join(" ") || "Musteri";
    const email = String((meta.invoice || {}).email || "");
    const phone = String((meta.invoice || {}).phone || "").replace(/\D+/g, "");
    const identityNumberRaw = String((meta.invoice || {}).taxNo || "");
    const identityNumber = /^\d{11}$/.test(identityNumberRaw)
      ? identityNumberRaw
      : "11111111110";
    const address = String((meta.invoice || {}).address || "");
    const city = String((meta.invoice || {}).city || "Istanbul");
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: String(payment.id),
      price: toStringPrice(amount),
      paidPrice: toStringPrice(amount),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: String(payment.id),
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      buyer: {
        id: tenantId,
        name,
        surname,
        gsmNumber: phone,
        email,
        identityNumber,
        registrationAddress: address,
        ip: "127.0.0.1",
        city,
        country: "Turkey",
      },
      billingAddress: {
        contactName: fullName,
        city,
        country: "Turkey",
        address,
      },
      shippingAddress: {
        contactName: fullName,
        city,
        country: "Turkey",
        address,
      },
      basketItems: [
        {
          id: String(meta.planId || "plan"),
          name: planName,
          category1: "Subscription",
          category2: "Gym",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: toStringPrice(amount),
        },
      ],
    };
    const init = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(
        request,
        (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    const token = String(init?.token || "");
    const status = String(init?.status || "");
    const errorCode = String(init?.errorCode || "");
    const errorMessage = String(init?.errorMessage || "");
    console.log("redirect:iyzico-init", {
      status,
      token,
      errorCode,
      errorMessage,
    });
    try {
      await svc
        .from("tenant_payments")
        .update({
          invoice_no: token || payment.invoice_no,
          gateway_token: token || null,
          gateway_conversation_id: String(payment.id),
          gateway_status: status || null,
          gateway_error_code: errorCode || null,
          gateway_error_message: errorMessage || null,
          gateway_payload: init || null,
        })
        .eq("id", paymentId);
    } catch {
      await svc
        .from("tenant_payments")
        .update({
          invoice_no: token || payment.invoice_no,
        })
        .eq("id", paymentId);
    }
    content = String(init?.checkoutFormContent || "");
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "iyzico init hatası" },
      { status: 400 }
    );
  }

  if (!content) {
    let p: any = null;
    try {
      const res = await svc
        .from("tenant_payments")
        .select("gateway_status, gateway_error_code, gateway_error_message")
        .eq("id", paymentId)
        .single();
      p = res.data;
    } catch {
      p = null;
    }
    console.log("redirect:no-content", {
      paymentId,
      status: p?.gateway_status || null,
      code: p?.gateway_error_code || null,
      message: p?.gateway_error_message || null,
    });
    return NextResponse.json(
      {
        error: "Checkout içerik alınamadı",
        status: p?.gateway_status || null,
        code: p?.gateway_error_code || null,
        message: p?.gateway_error_message || null,
      },
      { status: 400 }
    );
  }

  return new NextResponse(content, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
