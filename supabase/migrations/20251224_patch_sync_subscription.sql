CREATE OR REPLACE FUNCTION public.sync_subscription_with_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student UUID;
BEGIN
  v_student := COALESCE(NEW.student_id, OLD.student_id);
  PERFORM public.recompute_subscription_monthly_amount(v_student);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_subscription_on_group_fee_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT student_id FROM public.student_groups WHERE group_id = NEW.id AND status = 'active' LOOP
    PERFORM public.recompute_subscription_monthly_amount(r.student_id);
  END LOOP;
  RETURN NULL;
END;
$$;

