import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: u } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    if (!u?.tenant_id) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    const tenantId = String(u.tenant_id);

    const body = await req.json();
    const planIdRaw = body?.planId;
    const planSlug = typeof body?.planSlug === "string" ? body.planSlug : "";
    const planId = typeof planIdRaw === "string" ? planIdRaw : "";
    const validUuid =
      !!planId &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        planId,
      );
    if (!validUuid && !planSlug)
      return NextResponse.json({ error: "Geçersiz plan seçimi" }, { status: 400 });

    const planQuery = supabase
      .from("platform_plans")
      .select("id, name, monthly_price, max_students, max_groups, max_branches");
    const { data: plan } = validUuid
      ? await planQuery.eq("id", planId).single()
      : await planQuery.eq("slug", planSlug).single();
    if (!plan) return NextResponse.json({ error: "Plan bulunamadı" }, { status: 404 });

    const { data: subs } = await supabase
      .from("tenant_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1);
    const current = subs?.[0] || null;
    const currentAmount = Number(current?.amount || 0);
    const targetAmount = Number(plan.monthly_price || 0);
    const now = new Date();
    const end = new Date(
      current?.current_period_end || new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    );

    const svc = getSupabaseService();

    // If no current subscription, create one immediately with selected plan
    if (!current) {
      const { data: created, error: insErr } = await svc
        .from("tenant_subscriptions")
        .insert({
          tenant_id: tenantId,
          plan_id: plan.id,
          billing_period: "monthly",
          amount: targetAmount,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString(),
          auto_renew: true,
          payment_method: "simulation",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select("*")
        .single();
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

      await svc.from("tenant_payments").insert({
        tenant_id: tenantId,
        subscription_id: created.id,
        amount: targetAmount,
        payment_method: "simulation",
        status: "completed",
        invoice_no: `SIM-${Date.now()}`,
        paid_at: now.toISOString(),
        description: JSON.stringify({ planId: plan.id, planName: plan.name, amount: targetAmount }),
      });

      await svc.from("tenants").update({ subscription_status: "active", is_limited: false }).eq("id", tenantId);

      return NextResponse.json({ ok: true, effect: "upgraded_now" });
    }

    // Upgrade: immediately switch and create a completed payment
    if (targetAmount > currentAmount) {
      const { error: upErr } = await svc
        .from("tenant_subscriptions")
        .update({
          plan_id: plan.id,
          amount: targetAmount,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString(),
          auto_renew: true,
          payment_method: "simulation",
          updated_at: now.toISOString(),
        })
        .eq("id", current?.id);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

      await svc.from("tenant_payments").insert({
        tenant_id: tenantId,
        subscription_id: current?.id || null,
        amount: targetAmount,
        payment_method: "simulation",
        status: "completed",
        invoice_no: `SIM-${Date.now()}`,
        paid_at: now.toISOString(),
        description: JSON.stringify({ planId: plan.id, planName: plan.name, amount: targetAmount }),
      });

      await svc
        .from("tenants")
        .update({ subscription_status: "active", is_limited: false })
        .eq("id", tenantId);

      return NextResponse.json({ ok: true, effect: "upgraded_now" });
    }

    // Downgrade: schedule change at period end, keep features until end
    const payload: any = {
      pending_downgrade_plan_id: plan.id,
      pending_downgrade_effective_at: end.toISOString(),
      updated_at: now.toISOString(),
    };
    const { error: dnErr } = await svc
      .from("tenant_subscriptions")
      .update(payload)
      .eq("id", current?.id);
    if (dnErr) return NextResponse.json({ error: dnErr.message }, { status: 400 });
    return NextResponse.json({ ok: true, effect: "scheduled_downgrade", effectiveAt: end.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
