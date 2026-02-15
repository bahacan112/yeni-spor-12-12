import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date: Date, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

async function getPlatformExpiredLimits(
  svc: ReturnType<typeof getSupabaseService>
) {
  const { data } = await svc
    .from("platform_settings")
    .select("key, value")
    .in("key", [
      "expired_tenant_max_students",
      "expired_tenant_max_groups",
      "billing_auto_charge_enabled",
      "dunning_enabled",
      "dunning_reminder_days",
      "dunning_fail_days",
    ]);

  const map = new Map<string, string>();
  for (const row of data || []) map.set(row.key, String(row.value ?? ""));
  return {
    maxStudents: Number(map.get("expired_tenant_max_students") || 0),
    maxGroups: Number(map.get("expired_tenant_max_groups") || 0),
    autoChargeEnabled: map.get("billing_auto_charge_enabled") === "true",
    dunningEnabled: map.get("dunning_enabled") === "true",
    dunningReminderDays: Number(map.get("dunning_reminder_days") || 3),
    dunningFailDays: Number(map.get("dunning_fail_days") || 7),
  } as any;
}

async function processRenewals() {
  const svc = getSupabaseService();
  const secret = process.env.CRON_SECRET;

  // Fetch subscriptions that need renewal
  const now = new Date();
  const { data: subs } = await svc
    .from("tenant_subscriptions")
    .select(
      "id, tenant_id, plan_id, billing_period, amount, status, payment_method, current_period_end, auto_renew, tenant:tenants(email, subscription_status), plan:platform_plans(name)"
    )
    .eq("status", "active")
    .eq("auto_renew", true)
    .lte("current_period_end", now.toISOString());

  const expiredLimits = await getPlatformExpiredLimits(svc);
  if ((expiredLimits as any).autoChargeEnabled === false) {
    return NextResponse.json({
      processed: 0,
      results: [],
      skipped: "auto_charge_disabled",
    });
  }

  const results: any[] = [];
  for (const sub of subs || []) {
    const method = sub.payment_method || "credit_card";
    const shouldSucceed = method === "credit_card";
    const paidAt = new Date().toISOString();

    // Create payment record
    const { data: payment, error: payErr } = await svc
      .from("tenant_payments")
      .insert({
        tenant_id: sub.tenant_id,
        subscription_id: sub.id,
        amount: sub.amount,
        payment_method: method,
        status: shouldSucceed ? "completed" : "failed",
        invoice_no: `INV-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`,
        description: shouldSucceed
          ? "Otomatik tahsilat başarılı"
          : "Otomatik tahsilat başarısız",
        paid_at: shouldSucceed ? paidAt : null,
      })
      .select("*")
      .single();

    if (payErr) {
      results.push({
        subscriptionId: sub.id,
        status: "payment_error",
        error: payErr.message,
      });
      continue;
    }

    if (shouldSucceed) {
      const start = new Date();
      const nextEnd =
        sub.billing_period === "yearly"
          ? addYears(start, 1)
          : addMonths(start, 1);

      const { error: updErr } = await svc
        .from("tenant_subscriptions")
        .update({
          current_period_start: start.toISOString(),
          current_period_end: nextEnd.toISOString(),
          status: "active",
        })
        .eq("id", sub.id);

      if (updErr) {
        results.push({
          subscriptionId: sub.id,
          status: "update_error",
          error: updErr.message,
        });
        continue;
      }

      // Ensure tenant active and limits removed
      await svc
        .from("tenants")
        .update({ subscription_status: "active", is_limited: false })
        .eq("id", sub.tenant_id);

      results.push({
        subscriptionId: sub.id,
        status: "renewed",
        paymentId: payment.id,
      });
    } else {
      // Failed payment: suspend subscription and limit tenant
      await svc
        .from("tenant_subscriptions")
        .update({ status: "suspended" })
        .eq("id", sub.id);

      await svc
        .from("tenants")
        .update({
          subscription_status: "expired",
          is_limited: true,
          max_students: expiredLimits.maxStudents || null,
          max_groups: expiredLimits.maxGroups || null,
        })
        .eq("id", sub.tenant_id);

      // Log notification intent
      const tEmail = (sub as any)?.tenant?.email || "";
      const planName = (sub as any)?.plan?.name || "-";
      await svc.from("notification_logs").insert({
        tenant_id: sub.tenant_id,
        recipient_type: "tenant_admin",
        recipient_contact: tEmail,
        channel: "email",
        subject: "Abonelik tahsilatı başarısız",
        content: `Abonelik ödemesi başarısız oldu. Paket: ${planName}. Lütfen ödeme yöntemini güncelleyin.`,
        status: "pending",
      });

      results.push({ subscriptionId: sub.id, status: "failed" });
    }
  }

  return NextResponse.json({ processed: (subs || []).length, results });
}

async function processDunning() {
  const svc = getSupabaseService();
  const now = new Date();
  const limits = await getPlatformExpiredLimits(svc);
  if ((limits as any).dunningEnabled === false) {
    return NextResponse.json({ reminded: 0, skipped: "dunning_disabled" });
  }
  const remindDays = Math.max(
    1,
    Number((limits as any).dunningReminderDays) || 3
  );
  const failDays = Math.max(
    remindDays + 1,
    Number((limits as any).dunningFailDays) || 7
  );
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - remindDays);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - failDays);

  // Payments pending for >=7 days -> mark failed
  await svc
    .from("tenant_payments")
    .update({ status: "failed" })
    .eq("status", "pending")
    .lte("created_at", sevenDaysAgo.toISOString());

  // Send reminders for failed or pending (>=3 days)
  const { data: toRemind } = await svc
    .from("tenant_payments")
    .select(
      "id, tenant_id, status, amount, subscription_id, created_at, tenant:tenants(email)"
    )
    .in("status", ["failed", "pending"])
    .lte("created_at", threeDaysAgo.toISOString());

  for (const p of toRemind || []) {
    const tEmailRem = (p as any)?.tenant?.email || "";
    await svc.from("notification_logs").insert({
      tenant_id: p.tenant_id,
      recipient_type: "tenant_admin",
      recipient_contact: tEmailRem,
      channel: "email",
      subject: "Ödeme Hatırlatma",
      content: `Abonelik ödemeniz beklemede/başarısız: ${p.amount} TL. Lütfen ödeme yapın.`,
      status: "pending",
    });
  }

  return NextResponse.json({ reminded: (toRemind || []).length });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const action = req.nextUrl.searchParams.get("action") || "renewals";
  if (action === "dunning") return processDunning();
  return processRenewals();
}

export async function GET(req: NextRequest) {
  // Allow running manually for testing
  return POST(req);
}
