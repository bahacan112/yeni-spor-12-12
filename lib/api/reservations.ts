import { getSupabaseServer } from "@/lib/supabase/server";
import { VenueReservation } from "@/lib/types";

export async function getVenueReservationsForWeek(
  venueId: string,
  weekStart: string // YYYY-MM-DD (Monday)
): Promise<VenueReservation[]> {
  const supabase = await getSupabaseServer();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("venue_reservations")
    .select("*, venue:venues(id, name, hourly_rate)")
    .eq("venue_id", venueId)
    .gte("reservation_date", weekStart)
    .lte("reservation_date", weekEndStr)
    .neq("status", "cancelled")
    .order("reservation_date")
    .order("start_time");

  if (error) {
    console.error("Error fetching reservations:", error);
    return [];
  }

  return (data || []).map(mapReservation);
}

export async function getVenueReservationsForWeekPublic(
  venueId: string,
  weekStart: string,
  tenantId: string
): Promise<VenueReservation[]> {
  const supabase = await getSupabaseServer();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("venue_reservations")
    .select("id, venue_id, reservation_date, start_time, end_time, status")
    .eq("venue_id", venueId)
    .eq("tenant_id", tenantId)
    .gte("reservation_date", weekStart)
    .lte("reservation_date", weekEndStr)
    .neq("status", "cancelled");

  if (error) return [];
  return (data || []).map(mapReservation);
}

export async function getTrainingsForWeek(
  venueId: string,
  weekStart: string
): Promise<{ trainingDate: string; startTime: string; endTime: string }[]> {
  const supabase = await getSupabaseServer();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("trainings")
    .select("training_date, start_time, end_time")
    .eq("venue_id", venueId)
    .gte("training_date", weekStart)
    .lte("training_date", weekEndStr)
    .neq("status", "cancelled");

  if (error) return [];
  return (data || []).map((t: any) => ({
    trainingDate: t.training_date,
    startTime: t.start_time,
    endTime: t.end_time,
  }));
}

export async function createVenueReservation(params: {
  tenantId: string;
  venueId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  notes?: string;
  branchId?: string;
}): Promise<{ reservation: VenueReservation | null; error: string | null }> {
  const supabase = await getSupabaseServer();

  // Check for conflicts with trainings
  const { data: trainConflict } = await supabase
    .from("trainings")
    .select("id")
    .eq("venue_id", params.venueId)
    .eq("training_date", params.reservationDate)
    .neq("status", "cancelled")
    .lt("start_time", params.endTime)
    .gt("end_time", params.startTime)
    .limit(1);

  if (trainConflict && trainConflict.length > 0) {
    return { reservation: null, error: "Bu saat diliminde antrenman mevcut" };
  }

  // Check for conflicts with other reservations
  const { data: resConflict } = await supabase
    .from("venue_reservations")
    .select("id")
    .eq("venue_id", params.venueId)
    .eq("reservation_date", params.reservationDate)
    .neq("status", "cancelled")
    .lt("start_time", params.endTime)
    .gt("end_time", params.startTime)
    .limit(1);

  if (resConflict && resConflict.length > 0) {
    return {
      reservation: null,
      error: "Bu saat diliminde başka bir rezervasyon var",
    };
  }

  // Create the reservation
  const { data: res, error: resErr } = await supabase
    .from("venue_reservations")
    .insert({
      tenant_id: params.tenantId,
      venue_id: params.venueId,
      reservation_date: params.reservationDate,
      start_time: params.startTime,
      end_time: params.endTime,
      customer_name: params.customerName,
      customer_phone: params.customerPhone || null,
      total_amount: params.totalAmount,
      status: "confirmed",
      notes: params.notes || null,
    })
    .select("*")
    .single();

  if (resErr || !res) {
    return { reservation: null, error: resErr?.message || "Rezervasyon oluşturulamadı" };
  }

  // Create a payment entry for income tracking
  if (params.totalAmount > 0) {
    const { data: venueData } = await supabase
      .from("venues")
      .select("name")
      .eq("id", params.venueId)
      .single();

    await supabase.from("payments").insert({
      tenant_id: params.tenantId,
      branch_id: params.branchId || null,
      amount: params.totalAmount,
      payment_type: "other",
      payment_method: "cash",
      description: `Saha Rezervasyonu – ${venueData?.name || "Saha"} ${params.reservationDate} ${params.startTime}–${params.endTime} (${params.customerName})`,
      payment_date: params.reservationDate,
    });
  }

  return { reservation: mapReservation(res), error: null };
}

export async function cancelVenueReservation(
  reservationId: string
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("venue_reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId);

  return { error: error?.message || null };
}

function mapReservation(r: any): VenueReservation {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    venueId: r.venue_id,
    venue: r.venue
      ? { id: r.venue.id, name: r.venue.name, hourlyRate: r.venue.hourly_rate } as any
      : undefined,
    reservationDate: r.reservation_date,
    startTime: r.start_time,
    endTime: r.end_time,
    customerName: r.customer_name,
    customerPhone: r.customer_phone || undefined,
    totalAmount: Number(r.total_amount || 0),
    status: r.status,
    paymentId: r.payment_id || undefined,
    notes: r.notes || undefined,
    createdBy: r.created_by || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
