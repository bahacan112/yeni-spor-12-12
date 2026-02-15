-- Enable pg_cron if available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add snapshot_state column to monthly_dues
ALTER TABLE public.monthly_dues
ADD COLUMN IF NOT EXISTS snapshot_state text;

-- Helper: first or last business day for a given month
CREATE OR REPLACE FUNCTION public.first_business_day(p_month date)
RETURNS date
LANGUAGE sql
AS $$
SELECT CASE
  WHEN EXTRACT(DOW FROM date_trunc('month', p_month)) IN (6, 0) -- Sat=6, Sun=0
    THEN date_trunc('month', p_month)::date + (8 - EXTRACT(DOW FROM date_trunc('month', p_month))::int)
  ELSE date_trunc('month', p_month)::date
END;
$$;

CREATE OR REPLACE FUNCTION public.last_business_day(p_month date)
RETURNS date
LANGUAGE sql
AS $$
WITH last_day AS (
  SELECT (date_trunc('month', p_month) + INTERVAL '1 month - 1 day')::date AS d
)
SELECT CASE
  WHEN EXTRACT(DOW FROM d) IN (6, 0)
    THEN d - INTERVAL '1 day' * (EXTRACT(DOW FROM d)::int - 5)
  ELSE d
END::date
FROM last_day;
$$;

-- Compute due_date for a branch based on meta policy
CREATE OR REPLACE FUNCTION public.fn_due_date_for_branch(p_tenant uuid, p_branch uuid, p_month date)
RETURNS date
LANGUAGE plpgsql
AS $$
DECLARE
  pol text;
  day int;
  res date;
BEGIN
  SELECT due_date_policy, due_date_day
  INTO pol, day
  FROM public.branch_fee_policy_meta
  WHERE tenant_id = p_tenant AND branch_id = p_branch;

  IF pol IS NULL THEN
    RETURN date_trunc('month', p_month)::date;
  END IF;

  IF pol = 'FIRST_DAY' THEN
    res := date_trunc('month', p_month)::date;
  ELSIF pol = 'FIXED_DAY' THEN
    res := make_date(EXTRACT(YEAR FROM p_month)::int, EXTRACT(MONTH FROM p_month)::int, GREATEST(1, LEAST(31, COALESCE(day, 1))));
  ELSIF pol = 'FIRST_BUSINESS_DAY' THEN
    res := public.first_business_day(p_month);
  ELSIF pol = 'LAST_BUSINESS_DAY' THEN
    res := public.last_business_day(p_month);
  ELSE
    res := date_trunc('month', p_month)::date;
  END IF;
  RETURN res;
END;
$$;

DROP FUNCTION IF EXISTS public.generate_monthly_dues_v3(uuid, uuid, date);
DROP FUNCTION IF EXISTS public.compute_monthly_due_v3(uuid, uuid, uuid, date);

CREATE OR REPLACE FUNCTION public.generate_monthly_dues_v3(p_tenant_id uuid, p_branch_id uuid, p_due_month text)
RETURNS integer
LANGUAGE plpgsql
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
      SELECT g.monthly_fee
      INTO amnt
      FROM public.student_groups sg
      JOIN public.groups g ON g.id = sg.group_id
      WHERE sg.student_id = s.id AND sg.status = 'active'
      ORDER BY sg.created_at
      LIMIT 1;
      IF amnt IS NULL THEN
        amnt := 0;
      END IF;
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

CREATE OR REPLACE FUNCTION public.compute_monthly_due_v3(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_student_id uuid,
  p_due_month text
)
RETURNS integer
LANGUAGE plpgsql
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
    SELECT g.monthly_fee
    INTO base_amount
    FROM public.student_groups sg
    JOIN public.groups g ON g.id = sg.group_id
    WHERE sg.student_id = p_student_id AND sg.status = 'active'
    ORDER BY sg.created_at
    LIMIT 1;
    IF base_amount IS NULL THEN base_amount := 0; END IF;
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
      SELECT g.monthly_fee
      INTO base_amount
      FROM public.student_groups sg
      JOIN public.groups g ON g.id = sg.group_id
      WHERE sg.student_id = p_student_id AND sg.status = 'active'
      ORDER BY sg.created_at
      LIMIT 1;
      IF base_amount IS NULL THEN base_amount := 0; END IF;
    END IF;
    eff_due := existing.due_date;
    IF eff_due IS NULL OR eff_due::date = target_month THEN
      eff_due := public.fn_due_date_for_branch(p_tenant_id, p_branch_id, target_month);
    END IF;
    UPDATE public.monthly_dues
    SET
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

-- Monthly dues generator: calls existing RPC per branch and sets due_date for new rows
CREATE OR REPLACE PROCEDURE public.cron_generate_monthly_dues()
LANGUAGE plpgsql
AS $$
DECLARE
  t RECORD;
  b RECORD;
  target_month date := date_trunc('month', now())::date;
BEGIN
  FOR t IN SELECT id FROM public.tenants LOOP
    FOR b IN SELECT id FROM public.branches WHERE tenant_id = t.id AND is_active = true LOOP
      PERFORM public.generate_monthly_dues_v3(t.id, b.id, target_month::text);
      UPDATE public.monthly_dues md
      SET due_date = public.fn_due_date_for_branch(t.id, b.id, target_month)
      WHERE md.tenant_id = t.id
        AND md.branch_id = b.id
        AND md.due_month = target_month
        AND (md.due_date IS NULL OR md.due_date::date = target_month);
    END LOOP;
  END LOOP;
END;
$$;

-- Daily snapshot updater
CREATE OR REPLACE PROCEDURE public.cron_snapshot_monthly_dues_states()
LANGUAGE plpgsql
AS $$
BEGIN
  -- paid rows
  UPDATE public.monthly_dues
  SET snapshot_state = 'paid'
  WHERE status = 'paid';

  -- due today
  UPDATE public.monthly_dues
  SET snapshot_state = 'due_today'
  WHERE status <> 'paid'
    AND due_date::date = now()::date;

  -- overdue
  UPDATE public.monthly_dues
  SET snapshot_state = 'overdue'
  WHERE status <> 'paid'
    AND due_date::date < now()::date;

  -- upcoming 1/2/3
  UPDATE public.monthly_dues
  SET snapshot_state = 'upcoming_1'
  WHERE status <> 'paid'
    AND due_date::date = (now()::date + 1);

  UPDATE public.monthly_dues
  SET snapshot_state = 'upcoming_2'
  WHERE status <> 'paid'
    AND due_date::date = (now()::date + 2);

  UPDATE public.monthly_dues
  SET snapshot_state = 'upcoming_3'
  WHERE status <> 'paid'
    AND due_date::date = (now()::date + 3);

  -- default pending snapshot for others
  UPDATE public.monthly_dues
  SET snapshot_state = 'pending'
  WHERE status <> 'paid'
    AND due_date::date > (now()::date + 3);
END;
$$;

-- RPC-friendly function wrapper for snapshot (returns affected count)
CREATE OR REPLACE FUNCTION public.fn_snapshot_monthly_dues_states()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  affected int := 0;
BEGIN
  -- paid rows
  UPDATE public.monthly_dues
  SET snapshot_state = 'paid'
  WHERE status = 'paid';

  -- due today
  UPDATE public.monthly_dues
  SET snapshot_state = 'due_today'
  WHERE status <> 'paid'
    AND due_date::date = now()::date;

  -- overdue
  UPDATE public.monthly_dues
  SET snapshot_state = 'overdue'
  WHERE status <> 'paid'
    AND due_date::date < now()::date;

  -- upcoming 1/2/3
  UPDATE public.monthly_dues
  SET snapshot_state = 'upcoming_1'
  WHERE status <> 'paid'
    AND due_date::date = (now()::date + 1);

  UPDATE public.monthly_dues
  SET snapshot_state = 'upcoming_2'
  WHERE status <> 'paid'
    AND due_date::date = (now()::date + 2);

  UPDATE public.monthly_dues
  SET snapshot_state = 'upcoming_3'
  WHERE status <> 'paid'
    AND due_date::date = (now()::date + 3);

  -- default pending snapshot for others
  UPDATE public.monthly_dues
  SET snapshot_state = 'pending'
  WHERE status <> 'paid'
    AND due_date::date > (now()::date + 3);

  SELECT COUNT(*) INTO affected FROM public.monthly_dues WHERE snapshot_state IS NOT NULL;
  RETURN affected;
END;
$$;

-- Notification dispatcher (logs only; dedup per month)
CREATE OR REPLACE PROCEDURE public.cron_dispatch_notifications()
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  month_start date := date_trunc('month', now())::date;
BEGIN
  FOR r IN
    SELECT md.tenant_id, md.student_id, md.snapshot_state, md.due_date, s.phone AS recipient_contact
    FROM public.monthly_dues md
    JOIN public.students s ON s.id = md.student_id
    WHERE md.snapshot_state IN ('overdue', 'due_today', 'upcoming_1', 'upcoming_2', 'upcoming_3')
      AND md.status <> 'paid'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notification_logs nl
      WHERE nl.tenant_id = r.tenant_id
        AND COALESCE(nl.recipient_contact, '') = COALESCE(r.recipient_contact, '')
        AND date_trunc('month', nl.created_at)::date = month_start
        AND nl.subject = CASE
          WHEN r.snapshot_state = 'overdue' THEN 'Gecikmiş Ödeme'
          WHEN r.snapshot_state = 'due_today' THEN 'Bugün Son Ödeme Günü'
          ELSE 'Ödeme Hatırlatma'
        END
    ) THEN
      INSERT INTO public.notification_logs(
        tenant_id, recipient_type, recipient_contact,
        channel, subject, content, status, created_at
      )
      VALUES(
        r.tenant_id,
        'student',
        r.recipient_contact,
        'sms',
        CASE
          WHEN r.snapshot_state = 'overdue' THEN 'Gecikmiş Ödeme'
          WHEN r.snapshot_state = 'due_today' THEN 'Bugün Son Ödeme Günü'
          ELSE 'Ödeme Hatırlatma'
        END,
        'Aidat ödemesi hakkında hatırlatma.',
        'pending',
        now()
      );
    END IF;
  END LOOP;
END;
$$;

-- RPC-friendly function wrapper for notifications (returns inserted count)
CREATE OR REPLACE FUNCTION public.fn_dispatch_notifications()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  month_start date := date_trunc('month', now())::date;
  inserted int := 0;
BEGIN
  FOR r IN
    SELECT md.tenant_id, md.student_id, md.snapshot_state, md.due_date, s.phone AS recipient_contact
    FROM public.monthly_dues md
    JOIN public.students s ON s.id = md.student_id
    WHERE md.snapshot_state IN ('overdue', 'due_today', 'upcoming_1', 'upcoming_2', 'upcoming_3')
      AND md.status <> 'paid'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notification_logs nl
      WHERE nl.tenant_id = r.tenant_id
        AND COALESCE(nl.recipient_contact, '') = COALESCE(r.recipient_contact, '')
        AND date_trunc('month', nl.created_at)::date = month_start
        AND nl.subject = CASE
          WHEN r.snapshot_state = 'overdue' THEN 'Gecikmiş Ödeme'
          WHEN r.snapshot_state = 'due_today' THEN 'Bugün Son Ödeme Günü'
          ELSE 'Ödeme Hatırlatma'
        END
    ) THEN
      INSERT INTO public.notification_logs(
        tenant_id, recipient_type, recipient_contact,
        channel, subject, content, status, created_at
      )
      VALUES(
        r.tenant_id,
        'student',
        r.recipient_contact,
        'sms',
        CASE
          WHEN r.snapshot_state = 'overdue' THEN 'Gecikmiş Ödeme'
          WHEN r.snapshot_state = 'due_today' THEN 'Bugün Son Ödeme Günü'
          ELSE 'Ödeme Hatırlatma'
        END,
        'Aidat ödemesi hakkında hatırlatma.',
        'pending',
        now()
      );
      inserted := inserted + 1;
    END IF;
  END LOOP;
  RETURN inserted;
END;
$$;

-- Schedule crons
SELECT cron.schedule('monthly_dues_generate', '0 1 1 * *', $$CALL public.cron_generate_monthly_dues();$$);

SELECT cron.schedule('daily_snapshot', '0 8 * * *', $$CALL public.cron_snapshot_monthly_dues_states();$$);

SELECT cron.schedule('daily_notifications', '0 12 * * *', $$CALL public.cron_dispatch_notifications();$$);
