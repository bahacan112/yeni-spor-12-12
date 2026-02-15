CREATE OR REPLACE FUNCTION recompute_subscription_monthly_amount(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_sum numeric;
BEGIN
  BEGIN
    SELECT SUM(COALESCE(g.monthly_fee, 0)) INTO v_sum
    FROM public.student_groups sg
    JOIN public.groups g ON g.id = sg.group_id
    WHERE sg.student_id = p_student_id AND sg.status = 'active';
  EXCEPTION
    WHEN undefined_table THEN
      RETURN;
  END;
  RETURN;
END;
$$;

