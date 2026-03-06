import { Novu } from "@novu/node";

// Lazy singleton so the app doesn't crash if env vars are missing
let _novu: Novu | null = null;

function getNovu(): Novu {
  if (!_novu) {
    const apiKey = process.env.NOVU_API_KEY;
    if (!apiKey) throw new Error("NOVU_API_KEY is not set");
    _novu = new Novu(apiKey, {
      backendUrl: process.env.NOVU_API_URL || "https://novu-api.mysportschool.com",
    });
  }
  return _novu;
}

// ─── Subscriber Management ───────────────────────────────────

export async function upsertSubscriber(
  subscriberId: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    locale?: string;
    data?: Record<string, unknown>;
  }
) {
  try {
    const novu = getNovu();
    await novu.subscribers.identify(subscriberId, {
      ...data,
      data: data.data as Record<string, string>, // Type cast for ISubscriberPayload
      locale: data.locale || "tr",
    });
    return { success: true };
  } catch (error: any) {
    console.error(`[Novu] Subscriber oluşturulamadı (${subscriberId}):`, error?.message);
    return { success: false, error: error?.message };
  }
}

export async function deleteSubscriber(subscriberId: string) {
  try {
    const novu = getNovu();
    await novu.subscribers.delete(subscriberId);
    return { success: true };
  } catch (error: any) {
    console.error(`[Novu] Subscriber silinemedi (${subscriberId}):`, error?.message);
    return { success: false, error: error?.message };
  }
}

// ─── Notification Triggering ─────────────────────────────────

export async function triggerNotification(
  workflowId: string,
  subscriberId: string,
  payload: Record<string, any>,
  overrides?: Record<string, any>
) {
  try {
    const novu = getNovu();
    // In Novu v3 (Framework), 'to' can be just the subscriber ID string or an object with subscriberId and email.
    // However, if the email isn't in 'to', it relies on the subscriber's info.
    const result = await novu.trigger(workflowId, {
      to: subscriberId,
      payload,
    });
    console.log(`[Novu] Bildirim tetiklendi: ${workflowId} → ${subscriberId}`);
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error(`[Novu] Bildirim gönderilemedi (${workflowId}):`, error?.message);
    return { success: false, error: error?.message };
  }
}

// Toplu bildirim gönderimi
export async function triggerBulkNotification(
  workflowId: string,
  subscribers: Array<{
    subscriberId: string;
    payload: Record<string, any>;
  }>
) {
  try {
    const novu = getNovu();
    const results = await Promise.all(
      subscribers.map((sub) =>
        novu.trigger(workflowId, {
          to: sub.subscriberId,
          payload: sub.payload,
        })
      )
    );
    console.log(`[Novu] Toplu bildirim: ${workflowId} → ${subscribers.length} kişi`);
    return { success: true, data: results };
  } catch (error: any) {
    console.error(`[Novu] Toplu bildirim başarısız (${workflowId}):`, error?.message);
    return { success: false, error: error?.message };
  }
}

// ─── Predefined Workflow IDs ─────────────────────────────────

export const WORKFLOWS = {
  // Aidat
  DUES_REMINDER: "dues-reminder",
  DUES_OVERDUE: "dues-overdue",
  PAYMENT_RECEIVED: "payment-received",

  // Kayıt
  APPLICATION_RECEIVED: "application-received",
  WELCOME_STUDENT: "welcome-student",

  // Antrenman
  TRAINING_CANCELLED: "training-cancelled",
  TRAINING_REMINDER: "training-reminder",
  ATTENDANCE_ABSENCE: "attendance-absence",

  // Rezervasyon
  RESERVATION_CONFIRMED: "reservation-confirmed",
  RESERVATION_CANCELLED: "reservation-cancelled",

  // Genel
  ANNOUNCEMENT: "announcement",
  CUSTOM_MESSAGE: "custom-message",
} as const;

// ─── Helper: Subscriber ID Generators ────────────────────────

export function studentSubId(studentId: string) {
  return `student-${studentId}`;
}

export function applicantSubId(applicantId: string) {
  return `applicant-${applicantId}`;
}

export function userSubId(userId: string) {
  return `user-${userId}`;
}

export function customerSubId(identifier: string) {
  return `customer-${identifier}`;
}
