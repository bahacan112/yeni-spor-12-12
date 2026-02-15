import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      slug,
      code,
      sportId,
      sportName,
      fullName,
      birthDate,
      phone,
      email,
      guardianName,
      guardianPhone,
      gender,
      address,
      message,
    } = body || {};

    if (!slug || !fullName) {
      return NextResponse.json(
        { error: "Eksik zorunlu alanlar" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();
    if (tenantErr || !tenant) {
      return NextResponse.json({ error: "Tenant bulunamadı" }, { status: 404 });
    }

    let registrationLink: any | null = null;
    if (code) {
      const { data: rl } = await supabase
        .from("registration_links")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      if (rl) {
        const isExpired = rl.expires_at
          ? new Date(rl.expires_at) < new Date()
          : false;
        if (!rl.is_active || isExpired) {
          return NextResponse.json(
            { error: "Geçersiz kayıt linki" },
            { status: 400 }
          );
        }
        registrationLink = rl;
      }
    }

    let branchId: string | null = registrationLink?.branch_id || null;
    if (!branchId) {
      const { data: branches } = await supabase
        .from("branches")
        .select("id,is_main")
        .eq("tenant_id", tenant.id)
        .order("is_main", { ascending: false })
        .limit(1);
      branchId = branches && branches[0]?.id;
    }

    let resolvedSportId: string | null = null;
    if (sportId) {
      resolvedSportId = sportId;
    } else if (sportName) {
      const { data: s } = await supabase
        .from("sports")
        .select("id")
        .eq("tenant_id", tenant.id)
        .ilike("name", sportName)
        .maybeSingle();
      resolvedSportId = s?.id || null;
    } else if (registrationLink?.group_id) {
      const { data: g } = await supabase
        .from("groups")
        .select("sport_id")
        .eq("id", registrationLink.group_id)
        .maybeSingle();
      resolvedSportId = g?.sport_id || null;
    }

    const payload = {
      tenant_id: tenant.id,
      branch_id: branchId || null,
      registration_link_id: registrationLink?.id || null,
      sport_id: resolvedSportId,
      sport_name: sportName || null,
      full_name: fullName,
      birth_date: birthDate || null,
      phone: phone || null,
      email: email || null,
      guardian_name: guardianName || null,
      guardian_phone: guardianPhone || null,
      preferred_group_id: registrationLink?.group_id || null,
      gender: gender || null,
      address: address || null,
      message: message || null,
      status: "pending",
    };

    const { data, error } = await supabase
      .from("applications")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "İşlem başarısız" },
      { status: 500 }
    );
  }
}
