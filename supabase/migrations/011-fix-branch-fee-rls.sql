-- Fix RLS policies relying on current_setting('app.current_tenant_id')
-- Replace with get_current_user_tenant_id() helper used across the project

DO $$
BEGIN
  -- branch_fee_policies
  DROP POLICY IF EXISTS tenant_isolation_branch_fee_policies ON public.branch_fee_policies;
  CREATE POLICY tenant_isolation_branch_fee_policies ON public.branch_fee_policies
    FOR ALL
    USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());

  -- student_month_freezes
  DROP POLICY IF EXISTS tenant_isolation_student_month_freezes ON public.student_month_freezes;
  CREATE POLICY tenant_isolation_student_month_freezes ON public.student_month_freezes
    FOR ALL
    USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing branch fee RLS policies: %', SQLERRM;
END $$;

