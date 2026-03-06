"use server";

import { getSupabaseService } from "@/lib/supabase/service";
import { triggerNotification, WORKFLOWS, studentSubId } from "@/lib/notifications/novu";
import { revalidatePath } from "next/cache";

export async function updateTrainingAction(trainingId: string, updates: any, tenantId: string) {
  const svc = getSupabaseService();

  try {
    const { data: oldTraining, error: fetchErr } = await svc
      .from("trainings")
      .select("*, venues(name), groups(name)")
      .eq("id", trainingId)
      .single();

    if (fetchErr) throw fetchErr;

    const { error: updateErr } = await svc
      .from("trainings")
      .update(updates)
      .eq("id", trainingId);

    if (updateErr) throw updateErr;

    // If cancelled, notify all group members
    if (updates.status === "cancelled" && oldTraining.status !== "cancelled") {
      try {
        // Fetch student IDs in the group
        const { data: students } = await svc
          .from("student_groups")
          .select("student_id, students(full_name, email, phone)")
          .eq("group_id", oldTraining.group_id)
          .eq("status", "active");

        if (students && students.length > 0) {
          // Trigger notifications for each student
          // Using triggerNotification in a loop (or bulk if we want to be more efficient)
          await Promise.all(
            students.map(async (row: any) => {
              if (row.students) {
                const subId = studentSubId(row.student_id);
                return triggerNotification(WORKFLOWS.TRAINING_CANCELLED, subId, {
                  title: oldTraining.title,
                  date: oldTraining.training_date,
                  time: `${oldTraining.start_time} - ${oldTraining.end_time}`
                });
              }
            })
          );
        }
      } catch (notifyErr) {
        console.error("[Training Cancel Notification Error]", notifyErr);
      }
    }

    revalidatePath("/dashboard/trainings");
    return { success: true };
  } catch (error: any) {
    console.error("Action error:", error);
    return { success: false, error: error.message };
  }
}
