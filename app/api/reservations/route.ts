import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const venueId = searchParams.get("venueId");
  const weekStart = searchParams.get("weekStart");
  const tenantId = searchParams.get("tenantId");

  if (!venueId || !weekStart || !tenantId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const { data: reservations } = await supabase
    .from("venue_reservations")
    .select("id, venue_id, reservation_date, start_time, end_time, status, customer_name")
    .eq("venue_id", venueId)
    .eq("tenant_id", tenantId)
    .gte("reservation_date", weekStart)
    .lte("reservation_date", weekEndStr)
    .neq("status", "cancelled");

  const { data: trainings } = await supabase
    .from("trainings")
    .select("training_date, start_time, end_time, title")
    .eq("venue_id", venueId)
    .gte("training_date", weekStart)
    .lte("training_date", weekEndStr)
    .neq("status", "cancelled");

  return NextResponse.json({ reservations: reservations || [], trainings: trainings || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    tenantId,
    venueId,
    reservationDate,
    startTime,
    endTime,
    customerName,
    customerPhone,
    totalAmount,
    notes,
    branchId,
  } = body;

  if (!tenantId || !venueId || !reservationDate || !startTime || !endTime || !customerName) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();

  // Check for conflicts with trainings
  const { data: trainConflict } = await supabase
    .from("trainings")
    .select("id")
    .eq("venue_id", venueId)
    .eq("training_date", reservationDate)
    .neq("status", "cancelled")
    .lt("start_time", endTime)
    .gt("end_time", startTime)
    .limit(1);

  if (trainConflict && trainConflict.length > 0) {
    return NextResponse.json(
      { error: "Bu saat diliminde antrenman mevcut" },
      { status: 409 }
    );
  }

  // Check for reservation conflicts
  const { data: resConflict } = await supabase
    .from("venue_reservations")
    .select("id")
    .eq("venue_id", venueId)
    .eq("reservation_date", reservationDate)
    .neq("status", "cancelled")
    .lt("start_time", endTime)
    .gt("end_time", startTime)
    .limit(1);

  if (resConflict && resConflict.length > 0) {
    return NextResponse.json(
      { error: "Bu saat diliminde başka bir rezervasyon var" },
      { status: 409 }
    );
  }

  // Create reservation
  const { data: res, error: resErr } = await supabase
    .from("venue_reservations")
    .insert({
      tenant_id: tenantId,
      venue_id: venueId,
      reservation_date: reservationDate,
      start_time: startTime,
      end_time: endTime,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      total_amount: totalAmount || 0,
      status: "confirmed",
      notes: notes || null,
    })
    .select("*")
    .single();

  if (resErr || !res) {
    return NextResponse.json(
      { error: resErr?.message || "Rezervasyon oluşturulamadı" },
      { status: 500 }
    );
  }

  // Create payment record for income tracking
  if (totalAmount && totalAmount > 0) {
    const { data: venueData } = await supabase
      .from("venues")
      .select("name")
      .eq("id", venueId)
      .single();

    await supabase.from("payments").insert({
      tenant_id: tenantId,
      branch_id: branchId || null,
      amount: totalAmount,
      payment_type: "other",
      payment_method: "cash",
      description: `Saha Rezervasyonu – ${venueData?.name || "Saha"} ${reservationDate} ${startTime}–${endTime} (${customerName})`,
      payment_date: reservationDate,
    });
  }

  return NextResponse.json({ success: true, reservation: res });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("venue_reservations")
    .update({ status: status || "cancelled" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
