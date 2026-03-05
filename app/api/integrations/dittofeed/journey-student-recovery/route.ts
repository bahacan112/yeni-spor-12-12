import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getDittofeedAdmin } from "@/lib/integrations/dittofeed";

const JOURNEY_KEY = "student_account_created_email_v1";
const EVENT_NAME = "student_account_created";

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
  } catch {
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
        name: "Student Account Created Email",
        description:
          "Track(student_account_created) geldiğinde ilk giriş bilgisi e-postası gönder",
        conditions: {
          type: "event",
          match: { name: EVENT_NAME },
        },
        steps: [
          {
            type: "email",
            to: "{{ profile.email || properties.email }}",
            subject: "Hesabınız oluşturuldu",
            content:
              'Merhaba,<br/><br/>Hesabınız oluşturuldu. İlk giriş şifreniz: sifre1234. Giriş yaptıktan sonra şifrenizi belirlemeniz istenecektir.<br/><br/>Giriş: <a href="{{ properties.login_url }}">Giriş Yap</a>',
            provider: "default",
          },
        ],
        metadata: { version: 1, createdBy: "admin" },
      });
    } catch {
      created = await admin.createAction({
        key: JOURNEY_KEY,
        name: "Student Account Created Email",
        description:
          "Track(student_account_created) geldiğinde ilk giriş bilgisi e-postası gönder",
        conditions: {
          type: "event",
          match: { name: EVENT_NAME },
        },
        steps: [
          {
            type: "email",
            to: "{{ profile.email || properties.email }}",
            subject: "Hesabınız oluşturuldu",
            content:
              'Merhaba,<br/><br/>Hesabınız oluşturuldu. İlk giriş şifreniz: sifre1234. Giriş yaptıktan sonra şifrenizi belirlemeniz istenecektir.<br/><br/>Giriş: <a href="{{ properties.login_url }}">Giriş Yap</a>',
            provider: "default",
          },
        ],
        metadata: { version: 1, createdBy: "admin" },
      });
    }
    return NextResponse.json({ ok: true, created: true, action: created });
  } catch {
    return NextResponse.json({ ok: false, created: false, action: null });
  }
}
