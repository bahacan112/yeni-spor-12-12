import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase Admin Client
// We need SERVICE_ROLE_KEY to bypass RLS and create tenants/users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, schoolName, slug, email, phone, planId } = body;

    if (!userId || !schoolName) {
      return NextResponse.json(
        { error: "Eksik bilgi: userId ve schoolName zorunludur." },
        { status: 400 }
      );
    }

    // 1. Create Tenant
    const planSlug = planId.replace("plan-", "");

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: schoolName,
        slug: slug,
        email: email,
        phone: phone,
        subscription_plan: planSlug,
        subscription_status: "active",
      })
      .select()
      .single();

    if (tenantError) {
      console.error("Tenant creation error:", tenantError);
      // Check for unique violation on slug
      if (tenantError.code === "23505") {
        return NextResponse.json(
          { error: "Bu okul adı zaten kullanılıyor." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Okul oluşturulurken bir hata oluştu." },
        { status: 500 }
      );
    }

    // 2. Update User with Tenant ID and Role
    // First ensure user exists in public.users (in case trigger failed)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existingUser) {
      console.log("User not found in public.users, inserting manually...");
      const { error: insertError } = await supabaseAdmin.from("users").insert({
        id: userId,
        email: email,
        full_name: body.fullName || "Yönetici", // Ensure fullName is sent from client
        role: "tenant_admin",
        tenant_id: tenant.id,
        password_hash: "auth-managed",
      });

      if (insertError) {
        console.error("Manual user insert error:", insertError);
      }
    } else {
      const { error: userUpdateError } = await supabaseAdmin
        .from("users")
        .update({
          tenant_id: tenant.id,
          role: "tenant_admin",
        })
        .eq("id", userId);

      if (userUpdateError) {
        console.error("User update error:", userUpdateError);
        return NextResponse.json(
          { error: "Kullanıcı bilgileri güncellenemedi." },
          { status: 500 }
        );
      }
    }

    // 3. Create Subscription Record
    // First get the plan ID from platform_plans
    // Try English slug first, then Turkish fallback
    let targetSlug = planSlug;
    if (planSlug === "starter") targetSlug = "baslangic"; // Fallback check
    if (planSlug === "professional") targetSlug = "profesyonel";
    if (planSlug === "enterprise") targetSlug = "kurumsal";

    let { data: planData } = await supabaseAdmin
      .from("platform_plans")
      .select("id, monthly_price")
      .eq("slug", planSlug)
      .single();

    // If not found, try the fallback/Turkish slug
    if (!planData && targetSlug !== planSlug) {
      const { data: fallbackData } = await supabaseAdmin
        .from("platform_plans")
        .select("id, monthly_price")
        .eq("slug", targetSlug)
        .single();
      planData = fallbackData;
    }

    if (planData) {
      const { error: subError } = await supabaseAdmin
        .from("tenant_subscriptions")
        .insert({
          tenant_id: tenant.id,
          plan_id: planData.id,
          status: "active",
          billing_period: "monthly",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ).toISOString(),
          amount: planData.monthly_price || 0,
        });

      if (subError) {
        console.error("Subscription creation error:", subError);
      }
    } else {
      console.error("Plan not found for slug:", planSlug);
    }

    return NextResponse.json({ success: true, tenantId: tenant.id });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
