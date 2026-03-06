"use server";

import { getSupabaseService } from "@/lib/supabase/service";
import { triggerNotification, WORKFLOWS, upsertSubscriber, studentSubId } from "@/lib/notifications/novu";
import { revalidatePath } from "next/cache";

export async function createStudentAction(formData: any, tenantId: string) {
  const svc = getSupabaseService();

  try {
    // 1. Insert student
    const { data: student, error: studentError } = await svc
      .from("students")
      .insert({
        tenant_id: tenantId,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        birth_date: formData.birthDate || null,
        gender: formData.gender,
        is_licensed: formData.isLicensed === "true",
        branch_id: formData.branchId || null,
        guardian_name: formData.guardianName,
        guardian_phone: formData.guardianPhone,
        address: formData.address,
        notes: formData.notes,
        status: "active",
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // 2. Insert into group if selected
    if (formData.groupId && student) {
      const { error: groupError } = await svc
        .from("student_groups")
        .upsert(
          {
            student_id: student.id,
            group_id: formData.groupId,
            status: "active",
            joined_at: new Date().toISOString().split("T")[0],
            left_at: null,
          },
          { onConflict: "student_id,group_id" }
        );
      if (groupError) console.error("Group assign error:", groupError);
    }

    // 3. Notify Student (Novu)
    try {
      const { data: tenant } = await svc.from("tenants").select("name").eq("id", tenantId).single();
      const subId = studentSubId(student.id);
      
      // identifying the subscriber first
      await upsertSubscriber(subId, {
        email: student.email || undefined,
        firstName: student.full_name,
        phone: student.phone || undefined
      });

      await triggerNotification(WORKFLOWS.WELCOME_STUDENT, subId, {
        studentName: student.full_name,
        schoolName: tenant?.name || "Spor Okulu"
      });
    } catch (notifyErr) {
      console.error("[Student Welcome Notification Error]", notifyErr);
    }

    revalidatePath("/dashboard/students");
    return { success: true, student };
  } catch (error: any) {
    console.error("Action error:", error);
    return { success: false, error: error.message };
  }
}
