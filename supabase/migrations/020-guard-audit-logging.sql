-- Harden audit logging functions/triggers to avoid runtime errors when audit_logs is missing
-- Ensures student insert/update/delete does not fail if audit_logs table is absent

CREATE OR REPLACE FUNCTION public.log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
  IF to_regclass('public.audit_logs') IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (tenant_id, action, entity_type, entity_id, old_values)
    VALUES (OLD.tenant_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSE
    INSERT INTO public.audit_logs (tenant_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.tenant_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to ensure it points to latest function
DROP TRIGGER IF EXISTS audit_students ON public.students;
CREATE TRIGGER audit_students
AFTER INSERT OR UPDATE OR DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- Guard inside recompute_subscription_monthly_amount for missing audit_logs
CREATE OR REPLACE FUNCTION public.recompute_subscription_monthly_amount(p_student_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sum DECIMAL(10,2);
  v_existing_sub RECORD;
  v_tenant UUID;
  v_plan UUID;
BEGIN
  SELECT SUM(COALESCE(g.monthly_fee, 0)) INTO v_sum
  FROM public.student_groups sg
  JOIN public.groups g ON g.id = sg.group_id
  WHERE sg.student_id = p_student_id AND sg.status = 'active';

  v_sum := COALESCE(v_sum, 0);

  SELECT * INTO v_existing_sub
  FROM public.student_subscriptions
  WHERE student_id = p_student_id AND status = 'active'
  ORDER BY start_date DESC LIMIT 1;

  IF v_existing_sub IS NOT NULL THEN
    UPDATE public.student_subscriptions
    SET monthly_amount = v_sum,
        updated_at = NOW()
    WHERE id = v_existing_sub.id;
  ELSE
    SELECT tenant_id INTO v_tenant FROM public.students WHERE id = p_student_id;
    SELECT id INTO v_plan FROM public.payment_plans
    WHERE tenant_id = v_tenant AND is_active = true AND period = 'monthly'
    ORDER BY amount ASC LIMIT 1;

    IF v_plan IS NULL THEN
      IF to_regclass('public.audit_logs') IS NOT NULL THEN
        INSERT INTO public.audit_logs (tenant_id, action, entity_type, entity_id, new_values)
        VALUES (
          v_tenant,
          'SUBSCRIPTION_SKIPPED_NO_PLAN',
          'students',
          p_student_id,
          jsonb_build_object('student_id', p_student_id, 'monthly_sum', v_sum)
        );
      END IF;
      RETURN;
    END IF;

    INSERT INTO public.student_subscriptions (student_id, payment_plan_id, start_date, monthly_amount, payment_day, status, created_at, updated_at)
    VALUES (p_student_id, v_plan, CURRENT_DATE, v_sum, 1, 'active', NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;
