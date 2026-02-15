import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getDittofeedAdmin } from "@/lib/integrations/dittofeed";

const JOURNEY_KEY = "send_test_email_v1";

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!u || u.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const admin = getDittofeedAdmin();
    try {
      const journeys = await admin.listJourneys();
      const existing = Array.isArray(journeys)
        ? journeys.find((a: any) => a?.key === JOURNEY_KEY)
        : undefined;
      return NextResponse.json({
        exists: !!existing,
        action: existing || null,
      });
    } catch {
      const actions = await admin.listActions();
      const existing = Array.isArray(actions)
        ? actions.find((a: any) => a?.key === JOURNEY_KEY)
        : undefined;
      return NextResponse.json({
        exists: !!existing,
        action: existing || null,
      });
    }
  } catch (e: any) {
    return NextResponse.json({ exists: false, action: null });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: u } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!u || u.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const name =
      typeof body?.eventName === "string" && body.eventName
        ? body.eventName
        : "TestEmail";
    const admin = getDittofeedAdmin();
    const journeys = await admin.listJourneys().catch(() => []);
    const existing = Array.isArray(journeys)
      ? journeys.find((a: any) => a?.key === JOURNEY_KEY)
      : undefined;
    if (existing) {
      return NextResponse.json({ ok: true, created: false, action: existing });
    }
    let created: any;
    try {
      created = await admin.createJourney({
        key: JOURNEY_KEY,
        name: "Send TestEmail",
        description: "Track('TestEmail') geldiğinde e-posta gönder",
        conditions: {
          type: "event",
          match: { name },
        },
        steps: [
          {
            type: "email",
            to: "{{ profile.email || properties.email || properties.to || properties.userid }}",
            subject: "{{ properties.subject || 'Dittofeed SMTP Test' }}",
            content:
              "{{ properties.content || 'Merhaba, bu bir test e-postasıdır.' }}",
            provider: "default",
          },
        ],
        metadata: {
          version: 1,
          createdBy: "admin",
        },
      });
    } catch {
      created = await admin.createAction({
        key: JOURNEY_KEY,
        name: "Send TestEmail",
        description: "Track('TestEmail') geldiğinde e-posta gönder",
        conditions: {
          type: "event",
          match: { name },
        },
        steps: [
          {
            type: "email",
            to: "{{ profile.email || properties.email || properties.to || properties.userid }}",
            subject: "{{ properties.subject || 'Dittofeed SMTP Test' }}",
            content:
              "{{ properties.content || 'Merhaba, bu bir test e-postasıdır.' }}",
            provider: "default",
          },
        ],
        metadata: {
          version: 1,
          createdBy: "admin",
        },
      });
    }
    return NextResponse.json({ ok: true, created: true, action: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, created: false, action: null });
  }
}
