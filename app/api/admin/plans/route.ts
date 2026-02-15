import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseService } from "@/lib/supabase/service";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!userData || userData.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const description =
    typeof body.description === "string" ? body.description : null;
  const monthlyPrice = Number(body.monthlyPrice);
  const yearlyPrice = Number(body.yearlyPrice);
  const maxStudents =
    body.maxStudents === null || body.maxStudents === undefined
      ? null
      : Number(body.maxStudents);
  const maxGroups =
    body.maxGroups === null || body.maxGroups === undefined
      ? null
      : Number(body.maxGroups);
  const maxBranches =
    body.maxBranches === null || body.maxBranches === undefined
      ? null
      : Number(body.maxBranches);
  const maxInstructors =
    body.maxInstructors === null || body.maxInstructors === undefined
      ? null
      : Number(body.maxInstructors);
  const features = Array.isArray(body.features) ? body.features : [];
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
  const trialEnabled =
    typeof body.trialEnabled === "boolean" ? body.trialEnabled : false;
  const trialDefaultDays =
    body.trialDefaultDays === null || body.trialDefaultDays === undefined
      ? null
      : Number(body.trialDefaultDays);
  const slug = String(body.slug || slugify(name));

  if (!name || Number.isNaN(monthlyPrice) || Number.isNaN(yearlyPrice)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : supabase;

  const { data: maxOrderRow } = await service
    .from("platform_plans")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (maxOrderRow?.sort_order ?? 0) + 1;

  const { data: inserted, error } = await service
    .from("platform_plans")
    .insert({
      name,
      slug,
      description,
      monthly_price: monthlyPrice,
      yearly_price: yearlyPrice,
      max_students: maxStudents,
      max_groups: maxGroups,
      max_branches: maxBranches,
      max_instructors: maxInstructors,
      features,
      is_active: isActive,
      trial_enabled: trialEnabled,
      trial_default_days: trialDefaultDays,
      sort_order: sortOrder,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Create failed" }, { status: 400 });
  }

  return NextResponse.json({
    id: inserted.id,
    name: inserted.name,
    slug: inserted.slug,
    description: inserted.description,
    monthlyPrice: Number(inserted.monthly_price),
    yearlyPrice: Number(inserted.yearly_price),
    maxStudents: inserted.max_students,
    maxGroups: inserted.max_groups,
    maxBranches: inserted.max_branches,
    maxInstructors: inserted.max_instructors,
    features: inserted.features || [],
    isActive: inserted.is_active,
    trialEnabled: (inserted as any).trial_enabled,
    trialDefaultDays: (inserted as any).trial_default_days,
    isFeatured: (inserted as any).is_featured,
    sortOrder: inserted.sort_order,
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
  });
}

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!userData || userData.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? getSupabaseService()
    : supabase;

  const { data } = await service
    .from("platform_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  return NextResponse.json(
    (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      monthlyPrice: Number(p.monthly_price),
      yearlyPrice: Number(p.yearly_price),
      maxStudents: p.max_students,
      maxGroups: p.max_groups,
      maxBranches: p.max_branches,
      maxInstructors: p.max_instructors,
      features: p.features || [],
      isActive: p.is_active,
      trialEnabled: (p as any).trial_enabled,
      trialDefaultDays: (p as any).trial_default_days,
      isFeatured: (p as any).is_featured,
      sortOrder: p.sort_order,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }))
  );
}
