// deno-lint-ignore-file
import { createClient } from "npm:@supabase/supabase-js"

const url = Deno.env.get("SUPABASE_URL")!
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const svc = createClient(url, key)

function addMonths(d: Date, m: number) { const x = new Date(d); x.setMonth(x.getMonth() + m); return x }
function addYears(d: Date, y: number) { const x = new Date(d); x.setFullYear(x.getFullYear() + y); return x }

async function getPlatformExpiredLimits() {
  const { data } = await svc.from("platform_settings").select("key, value").in("key", [
    "expired_tenant_max_students","expired_tenant_max_groups",
    "billing_auto_charge_enabled","dunning_enabled","dunning_reminder_days","dunning_fail_days",
  ])
  const m = new Map<string,string>()
  for (const r of data || []) m.set(r.key, String(r.value ?? ""))
  return {
    maxStudents: Number(m.get("expired_tenant_max_students") || 0),
    maxGroups: Number(m.get("expired_tenant_max_groups") || 0),
    autoChargeEnabled: m.get("billing_auto_charge_enabled") === "true",
    dunningEnabled: m.get("dunning_enabled") === "true",
    dunningReminderDays: Number(m.get("dunning_reminder_days") || 3),
    dunningFailDays: Number(m.get("dunning_fail_days") || 7),
  }
}

async function renewals() {
  const nowIso = new Date().toISOString()
  const { data: subs } = await svc
    .from("tenant_subscriptions")
    .select("id, tenant_id, plan_id, billing_period, amount, status, payment_method, current_period_end, auto_renew, tenant:tenants(email, subscription_status), plan:platform_plans(name)")
    .eq("status","active").eq("auto_renew", true).lte("current_period_end", nowIso)

  const limits = await getPlatformExpiredLimits()
  if (!limits.autoChargeEnabled) return { processed: 0, results: [], skipped: "auto_charge_disabled" }

  const results: any[] = []
  for (const sub of subs || []) {
    const method = (sub as any).payment_method || "credit_card"
    const ok = method === "credit_card"
    const paidAt = new Date().toISOString()
    const { data: payment, error: payErr } = await svc
      .from("tenant_payments")
      .insert({
        tenant_id: (sub as any).tenant_id,
        subscription_id: (sub as any).id,
        amount: (sub as any).amount,
        payment_method: method,
        status: ok ? "completed" : "failed",
        invoice_no: `INV-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        description: ok ? "Otomatik tahsilat başarılı" : "Otomatik tahsilat başarısız",
        paid_at: ok ? paidAt : null,
      })
      .select("*").single()
    if (payErr) { results.push({ subscriptionId: (sub as any).id, status: "payment_error", error: payErr.message }); continue }

    if (ok) {
      const start = new Date()
      const nextEnd = (sub as any).billing_period === "yearly" ? addYears(start,1) : addMonths(start,1)
      const { error: updErr } = await svc.from("tenant_subscriptions").update({
        current_period_start: start.toISOString(), current_period_end: nextEnd.toISOString(), status: "active",
      }).eq("id", (sub as any).id)
      if (updErr) { results.push({ subscriptionId: (sub as any).id, status: "update_error", error: updErr.message }); continue }
      await svc.from("tenants").update({ subscription_status: "active", is_limited: false }).eq("id", (sub as any).tenant_id)
      results.push({ subscriptionId: (sub as any).id, status: "renewed", paymentId: (payment as any).id })
    } else {
      await svc.from("tenant_subscriptions").update({ status: "suspended" }).eq("id", (sub as any).id)
      await svc.from("tenants").update({
        subscription_status: "expired", is_limited: true,
        max_students: limits.maxStudents || null, max_groups: limits.maxGroups || null,
      }).eq("id", (sub as any).tenant_id)
      const tEmail = (sub as any)?.tenant?.email || ""
      const planName = (sub as any)?.plan?.name || "-"
      await svc.from("notification_logs").insert({
        tenant_id: (sub as any).tenant_id, recipient_type: "tenant_admin", recipient_contact: tEmail,
        channel: "email", subject: "Abonelik tahsilatı başarısız",
        content: `Abonelik ödemesi başarısız oldu. Paket: ${planName}. Lütfen ödeme yöntemini güncelleyin.`,
        status: "pending",
      })
      results.push({ subscriptionId: (sub as any).id, status: "failed" })
    }
  }
  return { processed: (subs || []).length, results }
}

async function dunning() {
  const limits = await getPlatformExpiredLimits()
  if (!limits.dunningEnabled) return { reminded: 0, skipped: "dunning_disabled" }
  const now = new Date()
  const remindDays = Math.max(1, limits.dunningReminderDays || 3)
  const failDays = Math.max(remindDays + 1, limits.dunningFailDays || 7)
  const remindAgo = new Date(now); remindAgo.setDate(now.getDate() - remindDays)
  const failAgo = new Date(now); failAgo.setDate(now.getDate() - failDays)

  await svc.from("tenant_payments").update({ status: "failed" }).eq("status","pending").lte("created_at", failAgo.toISOString())

  const { data: toRemind } = await svc
    .from("tenant_payments")
    .select("id, tenant_id, status, amount, subscription_id, created_at, tenant:tenants(email)")
    .in("status", ["failed","pending"]).lte("created_at", remindAgo.toISOString())

  for (const p of toRemind || []) {
    const tEmail = (p as any)?.tenant?.email || ""
    await svc.from("notification_logs").insert({
      tenant_id: (p as any).tenant_id, recipient_type: "tenant_admin", recipient_contact: tEmail,
      channel: "email", subject: "Ödeme Hatırlatma",
      content: `Abonelik ödemeniz beklemede/başarısız: ${(p as any).amount} TL. Lütfen ödeme yapın.`,
      status: "pending",
    })
  }
  return { reminded: (toRemind || []).length }
}

Deno.serve(async (req) => {
  try {
    const action = new URL(req.url).searchParams.get("action") || "renewals"
    const result = action === "dunning" ? await dunning() : await renewals()
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})

