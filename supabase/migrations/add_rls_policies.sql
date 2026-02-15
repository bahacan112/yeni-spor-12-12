ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY applications_select_for_tenant ON public.applications FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY applications_insert_for_tenant ON public.applications FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_current_user_tenant_id());
CREATE POLICY applications_update_for_tenant ON public.applications FOR UPDATE TO authenticated USING (tenant_id = public.get_current_user_tenant_id()) WITH CHECK (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_select_for_tenant ON public.products FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select_for_tenant ON public.orders FOR SELECT TO authenticated USING (tenant_id = public.get_current_user_tenant_id());

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY trainings_select_admin ON public.trainings FOR SELECT TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('tenant_admin','branch_manager','super_admin'))
);
CREATE POLICY trainings_select_instructor ON public.trainings FOR SELECT TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.instructors i
    WHERE i.user_id = auth.uid() AND i.id = public.trainings.instructor_id
  )
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendance_select_admin ON public.attendance FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = public.attendance.training_id AND t.tenant_id = public.get_current_user_tenant_id())
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('tenant_admin','branch_manager','super_admin'))
);
CREATE POLICY attendance_select_instructor ON public.attendance FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.trainings t
    JOIN public.instructors i ON i.id = t.instructor_id
    WHERE t.id = public.attendance.training_id
      AND t.tenant_id = public.get_current_user_tenant_id()
      AND i.user_id = auth.uid()
  )
);
CREATE POLICY attendance_insert_instructor ON public.attendance FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trainings t
    JOIN public.instructors i ON i.id = t.instructor_id
    WHERE t.id = public.attendance.training_id
      AND t.tenant_id = public.get_current_user_tenant_id()
      AND i.user_id = auth.uid()
  )
);
CREATE POLICY attendance_update_instructor ON public.attendance FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.trainings t
    JOIN public.instructors i ON i.id = t.instructor_id
    WHERE t.id = public.attendance.training_id
      AND t.tenant_id = public.get_current_user_tenant_id()
      AND i.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trainings t
    JOIN public.instructors i ON i.id = t.instructor_id
    WHERE t.id = public.attendance.training_id
      AND t.tenant_id = public.get_current_user_tenant_id()
      AND i.user_id = auth.uid()
  )
);
CREATE POLICY attendance_delete_instructor ON public.attendance FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.trainings t
    JOIN public.instructors i ON i.id = t.instructor_id
    WHERE t.id = public.attendance.training_id
      AND t.tenant_id = public.get_current_user_tenant_id()
      AND i.user_id = auth.uid()
  )
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY groups_select_admin ON public.groups FOR SELECT TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('tenant_admin','branch_manager','super_admin'))
);
CREATE POLICY groups_select_instructor ON public.groups FOR SELECT TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.instructors i
    WHERE i.user_id = auth.uid() AND i.id = public.groups.instructor_id
  )
);

ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_groups_select_for_tenant ON public.student_groups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.groups g WHERE g.id = public.student_groups.group_id AND g.tenant_id = public.get_current_user_tenant_id())
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY students_select_admin ON public.students FOR SELECT TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('tenant_admin','branch_manager','super_admin'))
);
CREATE POLICY students_select_instructor ON public.students FOR SELECT TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1
    FROM public.student_groups sg
    JOIN public.groups g ON g.id = sg.group_id
    JOIN public.instructors i ON i.id = g.instructor_id
    WHERE sg.student_id = public.students.id
      AND sg.status = 'active'
      AND i.user_id = auth.uid()
  )
);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY instructors_select_admin ON public.instructors FOR SELECT TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('tenant_admin','branch_manager','super_admin'))
);
CREATE POLICY instructors_select_self ON public.instructors FOR SELECT TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND user_id = auth.uid()
);
CREATE POLICY instructors_update_admin ON public.instructors FOR UPDATE TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('tenant_admin','branch_manager','super_admin'))
) WITH CHECK (
  tenant_id = public.get_current_user_tenant_id()
);

CREATE POLICY trainings_update_instructor ON public.trainings FOR UPDATE TO authenticated USING (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.instructors i
    WHERE i.user_id = auth.uid() AND i.id = public.trainings.instructor_id
  )
) WITH CHECK (
  tenant_id = public.get_current_user_tenant_id()
  AND EXISTS (
    SELECT 1 FROM public.instructors i
    WHERE i.user_id = auth.uid() AND i.id = public.trainings.instructor_id
  )
);
