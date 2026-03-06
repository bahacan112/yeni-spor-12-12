import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { userSubId } from "@/lib/notifications/novu";

// GET /api/notifications/debug — Inbox debug bilgisi
export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const subscriberId = userSubId(user.id);

  // Novu API'den subscriber bilgisini al
  const apiUrl = process.env.NOVU_API_URL || "https://novu-api.mysportschool.com";
  const apiKey = process.env.NOVU_API_KEY || "";
  
  let subscriberData = null;
  let subscriberError = null;
  let notifications = null;
  let notifError = null;

  try {
    const subRes = await fetch(`${apiUrl}/v1/subscribers/${subscriberId}`, {
      headers: { Authorization: `ApiKey ${apiKey}` },
    });
    subscriberData = await subRes.json();
  } catch (e: any) {
    subscriberError = e.message;
  }

  try {
    const notifRes = await fetch(`${apiUrl}/v1/notifications?subscriberId=${subscriberId}&page=0&limit=5`, {
      headers: { Authorization: `ApiKey ${apiKey}` },
    });
    notifications = await notifRes.json();
  } catch (e: any) {
    notifError = e.message;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    subscriberId,
    config: {
      NEXT_PUBLIC_NOVU_APP_ID: process.env.NEXT_PUBLIC_NOVU_APP_ID,
      NEXT_PUBLIC_NOVU_API_URL: process.env.NEXT_PUBLIC_NOVU_API_URL,
      NEXT_PUBLIC_NOVU_WS_URL: process.env.NEXT_PUBLIC_NOVU_WS_URL,
      NOVU_API_URL: process.env.NOVU_API_URL,
    },
    subscriber: subscriberData,
    subscriberError,
    recentNotifications: notifications,
    notifError,
  });
}
