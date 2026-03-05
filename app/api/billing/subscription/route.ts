import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

async function handle(req: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = body?.action as string;
  if (!action)
    return NextResponse.json({ error: "Missing action" }, { status: 400 });

  const { data: userData, error: userErr } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (userErr) throw userErr;
  const tenantId = userData?.tenant_id;
  if (!tenantId)
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { data: subs, error: subErr } = await supabase
    .from("tenant_subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (subErr) throw subErr;
  let subscription = subs?.[0];

  if (action === "change_plan") {
    const planId = body?.planId as string;
    const planSlug = typeof body?.planSlug === "string" ? body.planSlug : "";
    const validUuid =
      typeof planId === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        planId,
      );
    if (!validUuid && !planSlug)
      return NextResponse.json(
        { error: "Geçersiz plan seçimi" },
        { status: 400 },
      );
    if (!subscription) {
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      const baseQuery = supabase.from("platform_plans").select("*");
      const { data: planRow } = validUuid
        ? await baseQuery.eq("id", planId).single()
        : await baseQuery.eq("slug", planSlug).single();
      const amount = planRow?.monthly_price ?? null;
      const insertPayload: any = {
        tenant_id: tenantId,
        plan_id: planId,
        billing_period: "monthly",
        amount,
        status: "inactive",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        auto_renew: true,
        is_trial: false,
        trial_days: null,
        payment_method: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      const { data: created, error: insErr } = await supabase
        .from("tenant_subscriptions")
        .insert(insertPayload)
        .select("*")
        .single();
      if (insErr) {
        const { data: created2, error: insErr2 } = await supabase
          .from("tenant_subscriptions")
          .insert({
            tenant_id: tenantId,
            plan_id: planId,
            billing_period: "monthly",
            amount,
            status: "inactive",
            current_period_start: now.toISOString(),
            current_period_end: end.toISOString(),
            auto_renew: true,
            payment_method: null,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .select("*")
          .single();
        if (insErr2) throw insErr2;
        subscription = created2;
      } else {
        subscription = created;
      }
    } else {
      const { error } = await supabase
        .from("tenant_subscriptions")
        .update({ plan_id: planId, updated_at: new Date().toISOString() })
        .eq("id", subscription.id);
      if (error) throw error;
    }
  } else if (action === "update_payment_method") {
    const paymentMethod = body?.paymentMethod as string;
    if (!paymentMethod)
      return NextResponse.json(
        { error: "Missing paymentMethod" },
        { status: 400 },
      );
    if (!subscription)
      return NextResponse.json({ error: "No subscription" }, { status: 404 });
    const now = new Date();
    const nextEnd = new Date(now);
    if ((subscription as any)?.billing_period === "yearly") {
      nextEnd.setFullYear(nextEnd.getFullYear() + 1);
    } else {
      nextEnd.setMonth(nextEnd.getMonth() + 1);
    }
    const payload: any = {
      payment_method: paymentMethod,
      updated_at: now.toISOString(),
    };
    if ((subscription as any)?.status !== "active") {
      payload.status = "active";
      payload.current_period_start = now.toISOString();
      payload.current_period_end = nextEnd.toISOString();
    }
    const { error } = await supabase
      .from("tenant_subscriptions")
      .update(payload)
      .eq("id", subscription.id);
    if (error) throw error;
  } else if (action === "toggle_auto_renew") {
    const autoRenew = !!body?.autoRenew;
    if (!subscription)
      return NextResponse.json({ error: "No subscription" }, { status: 404 });
    const { error } = await supabase
      .from("tenant_subscriptions")
      .update({ auto_renew: autoRenew, updated_at: new Date().toISOString() })
      .eq("id", subscription.id);
    if (error) throw error;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { data: updated } = await supabase
    .from("tenant_subscriptions")
    .select("*")
    .eq("id", subscription.id)
    .single();

  return NextResponse.json({ subscription: updated });
}

export async function PATCH(req: Request) {
  try {
    return await handle(req);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 },
    );
  }
}
