"use server";

import { getSupabaseService } from "@/lib/supabase/service";
import { triggerNotification, WORKFLOWS, studentSubId, upsertSubscriber } from "@/lib/notifications/novu";

export async function sendDueReminderAction(dueId: string) {
  const svc = getSupabaseService();

  try {
    const { data: due, error } = await svc
      .from("monthly_dues")
      .select("*, students(*)")
      .eq("id", dueId)
      .single();

    if (error || !due) throw new Error("Borç kaydı bulunamadı");

    const student = due.students;
    if (!student) throw new Error("Öğrenci kaydı bulunamadı");

    const subId = studentSubId(student.id);
    
    // ensure subscriber
    await upsertSubscriber(subId, {
      email: student.email || undefined,
      firstName: student.full_name,
      phone: student.phone || undefined
    });

    const workflowId = due.status === "overdue" ? WORKFLOWS.DUES_OVERDUE : WORKFLOWS.DUES_REMINDER;
    
    await triggerNotification(workflowId, subId, {
      studentName: student.full_name,
      amount: Number(due.computed_amount || due.amount || 0),
      month: new Date(due.due_month).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
      dueDate: due.due_date
    });

    return { success: true };
  } catch (error: any) {
    console.error("Due reminder error:", error);
    return { success: false, error: error.message };
  }
}
