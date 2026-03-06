"use server";

import { getSupabaseService } from "@/lib/supabase/service";
import { triggerNotification, WORKFLOWS, studentSubId, upsertSubscriber } from "@/lib/notifications/novu";

interface AttendanceRow {
  training_id: string;
  student_id: string;
  status: string;
  marked_at: string;
}

export async function saveAttendanceAction(
  trainingId: string,
  rows: AttendanceRow[]
) {
  const svc = getSupabaseService();

  try {
    // 1. Yoklamayı kaydet
    const { error } = await svc
      .from("attendance")
      .upsert(rows, { onConflict: "training_id,student_id" });

    if (error) throw error;

    // 2. Antrenman bilgisini al
    const { data: training } = await svc
      .from("trainings")
      .select("title, training_date, start_time, end_time, group_id")
      .eq("id", trainingId)
      .single();

    if (!training) return { success: true }; // yoklama kaydedildi ama bildirim gönderilemedi

    // 3. Devamsız öğrencileri bul ve bildirim gönder
    const absentStudentIds = rows
      .filter((r) => r.status === "absent")
      .map((r) => r.student_id);

    if (absentStudentIds.length === 0) return { success: true };

    // Öğrenci bilgilerini al
    const { data: students } = await svc
      .from("students")
      .select("id, full_name, email, phone, guardian_name, guardian_phone")
      .in("id", absentStudentIds);

    if (!students || students.length === 0) return { success: true };

    // Her devamsız öğrenci için bildirim gönder
    await Promise.allSettled(
      students.map(async (student) => {
        try {
          const subId = studentSubId(student.id);
          
          await upsertSubscriber(subId, {
            email: student.email || undefined,
            firstName: student.full_name,
            phone: student.phone || undefined,
          });

          await triggerNotification(WORKFLOWS.ATTENDANCE_ABSENCE, subId, {
            studentName: student.full_name,
            trainingTitle: training.title,
            date: training.training_date,
            time: `${training.start_time} - ${training.end_time}`,
          });
        } catch (err) {
          console.error(`[Devamsızlık Bildirimi] ${student.full_name}:`, err);
        }
      })
    );

    return { success: true, absentCount: absentStudentIds.length };
  } catch (error: any) {
    console.error("Yoklama kaydetme hatası:", error);
    return { success: false, error: error.message };
  }
}
