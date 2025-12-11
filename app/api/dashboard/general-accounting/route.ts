import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!userData?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
  }
  const tenantId = userData.tenant_id as string;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const svc = createClient(url, key);

  const { data: branches } = await svc
    .from("branches")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  const PAGE_SIZE = 1000;
  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();

  {
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data } = await svc
        .from("payments")
        .select("branch_id, amount", { count: "exact" })
        .eq("tenant_id", tenantId)
        .neq("payment_type", "product")
        .range(from, from + PAGE_SIZE - 1);
      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }
      for (const row of data as any[]) {
        const bid = row.branch_id as string | null;
        if (!bid) continue;
        const amt = Number(row.amount) || 0;
        incomeMap.set(bid, (incomeMap.get(bid) || 0) + amt);
      }
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    }
  }

  {
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data } = await svc
        .from("expenses")
        .select("branch_id, amount", { count: "exact" })
        .eq("tenant_id", tenantId)
        .range(from, from + PAGE_SIZE - 1);
      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }
      for (const row of data as any[]) {
        const bid = row.branch_id as string | null;
        if (!bid) continue;
        const amt = Number(row.amount) || 0;
        expenseMap.set(bid, (expenseMap.get(bid) || 0) + amt);
      }
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    }
  }

  const rows = (branches || []).map((b: any) => {
    const income = incomeMap.get(b.id) || 0;
    const expense = expenseMap.get(b.id) || 0;
    const diff = income - expense;
    return { id: b.id, name: b.name, income, expense, diff };
  });

  return NextResponse.json({ branches: rows });
}
