-- Migration: Fix generate_monthly_dues_v3 to use get_student_monthly_amount_for_month
-- Problem: generate_monthly_dues_v3 only looked at student_groups.monthly_fee,
--          ignoring student_fee_overrides and student_subscriptions.
--          Students without an active group got 0 TL dues.

-- Step 1: Replace generate_monthly_dues_v3 with fixed version
CREATE OR REPLACE FUNCTION public.generate_monthly_dues_v3(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_due_month text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
  target_month date := date_trunc('month', p_due_month::date)::date;
  cnt int := 0;
  amnt numeric;
  due date;
BEGIN
  FOR s IN
    SELECT id
    FROM public.students
    WHERE tenant_id = p_tenant_id AND branch_id = p_branch_id AND status = 'active'
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.monthly_dues
      WHERE tenant_id = p_tenant_id AND branch_id = p_branch_id AND student_id = s.id AND due_month = p_due_month::date
    ) THEN
      -- FIX: Use get_student_monthly_amount_for_month which checks:
      --   1. student_fee_overrides (override_amount)
      --   2. student_fee_overrides (discount_percent)
      --   3. student_subscriptions (monthly_amount)
      --   4. groups.monthly_fee (fallback)
      amnt := public.get_student_monthly_amount_for_month(s.id, p_branch_id, target_month);

      due := public.fn_due_date_for_branch(p_tenant_id, p_branch_id, target_month);
      INSERT INTO public.monthly_dues(
        tenant_id, branch_id, student_id, due_month, due_date, amount, paid_amount, status, created_at
      )
      VALUES (
        p_tenant_id, p_branch_id, s.id, p_due_month::date, due, amnt, 0, 'pending', now()
      );
      cnt := cnt + 1;
    END IF;
  END LOOP;
  RETURN cnt;
END;
$$;

-- Step 2: Also fix compute_monthly_due_v3 (same problem)
CREATE OR REPLACE FUNCTION public.compute_monthly_due_v3(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_student_id uuid,
  p_due_month text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy RECORD;
  base_amount numeric := 0;
  existing RECORD;
  target_month date := date_trunc('month', p_due_month::date)::date;
  eff_due date;
BEGIN
  SELECT *
  INTO policy
  FROM public.branch_fee_policies
  WHERE tenant_id = p_tenant_id AND branch_id = p_branch_id;

  SELECT *
  INTO existing
  FROM public.monthly_dues
  WHERE tenant_id = p_tenant_id
    AND branch_id = p_branch_id
    AND student_id = p_student_id
    AND due_month = p_due_month::date
  LIMIT 1;

  IF existing IS NULL THEN
    -- FIX: Use get_student_monthly_amount_for_month instead of direct group query
    base_amount := public.get_student_monthly_amount_for_month(p_student_id, p_branch_id, target_month);

    eff_due := public.fn_due_date_for_branch(p_tenant_id, p_branch_id, target_month);
    INSERT INTO public.monthly_dues(
      tenant_id, branch_id, student_id, due_month, due_date,
      amount, paid_amount, status, policy_model_applied,
      original_amount, computed_amount, created_at
    )
    VALUES(
      p_tenant_id, p_branch_id, p_student_id, p_due_month::date, eff_due,
      base_amount, 0, 'pending', COALESCE(policy.fee_model, 'fixed'),
      base_amount, base_amount, now()
    );
    RETURN 1;
  ELSE
    base_amount := COALESCE(existing.amount, 0);
    IF base_amount = 0 THEN
      -- FIX: Use get_student_monthly_amount_for_month instead of direct group query
      base_amount := public.get_student_monthly_amount_for_month(p_student_id, p_branch_id, target_month);
    END IF;
    eff_due := existing.due_date;
    IF eff_due IS NULL OR eff_due::date = target_month THEN
      eff_due := public.fn_due_date_for_branch(p_tenant_id, p_branch_id, target_month);
    END IF;
    UPDATE public.monthly_dues
    SET
      amount = CASE WHEN existing.amount = 0 THEN base_amount ELSE existing.amount END,
      due_date = eff_due,
      original_amount = base_amount,
      computed_amount = base_amount,
      policy_model_applied = COALESCE(policy.fee_model, 'fixed'),
      updated_at = now()
    WHERE id = existing.id;
    RETURN 1;
  END IF;
END;
$$;

-- Step 3: Fix existing March 2026 dues that have 0 TL
-- Update each 0 TL record with the correct amount from get_student_monthly_amount_for_month
UPDATE public.monthly_dues md
SET
  amount = public.get_student_monthly_amount_for_month(md.student_id, md.branch_id, md.due_month),
  updated_at = now()
WHERE md.due_month = '2026-03-01'::date
  AND md.amount = 0
  AND md.status = 'pending';
