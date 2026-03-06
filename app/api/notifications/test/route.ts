import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  triggerNotification,
  upsertSubscriber,
  WORKFLOWS,
  studentSubId,
  userSubId,
} from "@/lib/notifications/novu";

// POST /api/notifications/test
// Body: { type: "email" | "sms" | "in_app" | "push", workflow: string, email?: string, phone?: string }
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      type = "email",
      workflow = WORKFLOWS.CUSTOM_MESSAGE,
      email,
      phone,
      message,
    } = body;

    // Ensure the current user is a subscriber
    const subId = userSubId(user.id);
    await upsertSubscriber(subId, {
      email: email || user.email || "",
      firstName: user.user_metadata?.name || "Test",
      phone: phone || "",
    });

    // Build payload based on workflow
    const payload: Record<string, any> = {
      subject: message || "Uygulama Test Bildirimi",
      message: message || "Bu bir test bildirimidir. Email, Push ve In-App kanalları başarıyla entegre edilmiştir.",
      studentName: user.user_metadata?.name || "Test Kullanıcı",
      amount: 1500,
      paymentDate: new Date().toLocaleDateString("tr-TR"),
      month: "Mart 2026",
      dueDate: "2026-03-15",
      venueName: "Ana Saha",
      date: new Date().toLocaleDateString("tr-TR"),
      time: "19:00 - 20:00",
      schoolName: "MySportSchool",
      sport: "Basketbol",
      channel: type, // seçilen kanal: email, push, in_app
    };

    const result = await triggerNotification(
      workflow,
      subId,
      payload
    );

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Bildirim başarıyla kuyruğa alındı: ${workflow}`
        : `Hata: ${result.error}`,
      data: result.data,
    });
  } catch (error: any) {
    console.error("[Notification Test]", error);
    return NextResponse.json(
      { error: error.message || "Bildirim gönderilemedi" },
      { status: 500 }
    );
  }
}
