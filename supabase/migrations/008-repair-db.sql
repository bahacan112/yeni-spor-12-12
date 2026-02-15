-- =====================================================
-- REPAIR SCRIPT
-- 1. Insert missing 'trial' plan and English plan slugs
-- 2. Sync missing users from auth.users to public.users
-- 3. Add RLS policy for users to view their own record
-- 4. FIX: Remove or update RLS policies relying on app.current_tenant_id
-- =====================================================

-- 1. Insert missing plans if they don't exist
INSERT INTO platform_plans (name, slug, description, monthly_price, yearly_price, max_students, max_groups, max_branches, max_instructors, features, sort_order) VALUES
('Deneme', 'trial', 'Ücretsiz deneme paketi', 0, 0, 30, 2, 1, 2, '["basic_features"]', 0),
('Başlangıç', 'starter', 'Küçük spor okulları için ideal', 999, 9990, 100, 5, 1, 5, '["basic_features", "email_support"]', 1),
('Profesyonel', 'professional', 'Büyüyen spor okulları için', 1999, 19990, 500, 20, 3, 15, '["basic_features", "email_support", "sms_notifications", "website", "ecommerce"]', 2),
('Kurumsal', 'enterprise', 'Büyük kurumlar için sınırsız', 4999, 49990, NULL, NULL, NULL, NULL, '["basic_features", "email_support", "sms_notifications", "website", "ecommerce", "priority_support", "custom_domain", "api_access"]', 3)
ON CONFLICT (slug) DO NOTHING;

-- 2. Add RLS policy for users

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    CREATE POLICY "Users can update own profile" ON users
        FOR UPDATE USING (auth.uid() = id);

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user policies: %', SQLERRM;
END $$;

-- Attendance RLS policy based on training's tenant
DO $$
BEGIN
  DROP POLICY IF EXISTS tenant_isolation_attendance ON attendance;
  CREATE POLICY tenant_isolation_attendance ON attendance
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM trainings t
        WHERE t.id = attendance.training_id
          AND t.tenant_id = get_current_user_tenant_id()
      )
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating attendance policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TABLE venues ALTER COLUMN branch_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'alter venues branch_id failed: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TABLE monthly_dues ADD COLUMN IF NOT EXISTS branch_id UUID;
  UPDATE monthly_dues md SET branch_id = s.branch_id FROM students s WHERE md.student_id = s.id AND md.branch_id IS NULL;
  ALTER TABLE monthly_dues ALTER COLUMN branch_id SET NOT NULL;
  ALTER TABLE monthly_dues ADD CONSTRAINT fk_monthly_dues_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'update monthly_dues branch_id failed: %', SQLERRM;
END $$;
CREATE INDEX IF NOT EXISTS idx_monthly_dues_branch ON monthly_dues(branch_id);

DO $$
BEGIN
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS branch_id UUID;
  UPDATE payments p SET branch_id = md.branch_id FROM monthly_dues md WHERE p.monthly_due_id = md.id AND p.branch_id IS NULL;
  UPDATE payments p SET branch_id = s.branch_id FROM students s WHERE p.student_id = s.id AND p.branch_id IS NULL;
  UPDATE payments p SET branch_id = b.id FROM branches b WHERE b.tenant_id = p.tenant_id AND b.is_main = true AND p.branch_id IS NULL;
  ALTER TABLE payments ALTER COLUMN branch_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'update payments branch_id failed: %', SQLERRM;
END $$;
CREATE INDEX IF NOT EXISTS idx_payments_branch ON payments(branch_id);

DO $$
BEGIN
  UPDATE expenses e SET branch_id = b.id FROM branches b WHERE e.branch_id IS NULL AND b.tenant_id = e.tenant_id AND b.is_main = true;
  ALTER TABLE expenses ALTER COLUMN branch_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'update expenses branch_id failed: %', SQLERRM;
END $$;
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);

DO $$
BEGIN
  UPDATE orders o SET branch_id = s.branch_id FROM students s WHERE o.student_id = s.id AND o.branch_id IS NULL;
  UPDATE orders o SET branch_id = b.id FROM branches b WHERE o.branch_id IS NULL AND b.tenant_id = o.tenant_id AND b.is_main = true;
  ALTER TABLE orders ALTER COLUMN branch_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'update orders branch_id failed: %', SQLERRM;
END $$;
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);

-- 3. Fix "unrecognized configuration parameter" error
-- The previous RLS policies used `current_setting('app.current_tenant_id')` which requires setting this config variable in every transaction.
-- Since we are not setting this variable in our Next.js middleware/api calls yet, we should use a JOIN-based policy or a simpler check.
-- For now, let's allow users to see data related to their tenant_id found in their public.users record.

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Policies to use the function instead of config param
DO $$
BEGIN
    -- Students Policy
    DROP POLICY IF EXISTS tenant_isolation_students ON students;
    CREATE POLICY tenant_isolation_students ON students
        FOR ALL USING (tenant_id = get_current_user_tenant_id());

    -- Groups Policy
    DROP POLICY IF EXISTS tenant_isolation_groups ON groups;
    CREATE POLICY tenant_isolation_groups ON groups
        FOR ALL USING (tenant_id = get_current_user_tenant_id());

    -- Payments Policy
    DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
    CREATE POLICY tenant_isolation_payments ON payments
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
        
    -- Instructors Policy (missing in original schema)
    DROP POLICY IF EXISTS tenant_isolation_instructors ON instructors;
    CREATE POLICY tenant_isolation_instructors ON instructors
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
        
    -- Trainings Policy (missing in original schema)
    DROP POLICY IF EXISTS tenant_isolation_trainings ON trainings;
    CREATE POLICY tenant_isolation_trainings ON trainings
        FOR ALL USING (tenant_id = get_current_user_tenant_id());
        
    -- Monthly Dues Policy
    DROP POLICY IF EXISTS tenant_isolation_monthly_dues ON monthly_dues;
    CREATE POLICY tenant_isolation_monthly_dues ON monthly_dues
        FOR ALL USING (tenant_id = get_current_user_tenant_id())
        WITH CHECK (tenant_id = get_current_user_tenant_id());

    -- Tenants Policy (Fix for settings page error)
    DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
    CREATE POLICY tenant_isolation_tenants ON tenants
        FOR SELECT USING (id = get_current_user_tenant_id());

    DROP POLICY IF EXISTS tenant_update_tenants ON tenants;
    CREATE POLICY tenant_update_tenants ON tenants
        FOR UPDATE USING (id = get_current_user_tenant_id())
        WITH CHECK (id = get_current_user_tenant_id());

    -- Branches Policy
    DROP POLICY IF EXISTS tenant_isolation_branches ON branches;
    CREATE POLICY tenant_isolation_branches ON branches
        FOR ALL USING (tenant_id = get_current_user_tenant_id());

    -- Venues Policy (missing): allow read/write within tenant
    DROP POLICY IF EXISTS tenant_isolation_venues ON venues;
    CREATE POLICY tenant_isolation_venues ON venues
        FOR ALL USING (tenant_id = get_current_user_tenant_id())
        WITH CHECK (tenant_id = get_current_user_tenant_id());

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating tenant policies: %', SQLERRM;
END $$;


-- 4. Fix users table (Sync from auth.users if missing)
DO $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, password_hash, created_at, updated_at)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Kullanıcı'),
    COALESCE(au.raw_user_meta_data->>'role', 'student'),
    'auth-managed',
    au.created_at,
    au.updated_at
  FROM auth.users au
  LEFT JOIN public.users pu ON pu.id = au.id
  WHERE pu.id IS NULL;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error syncing users: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS tenant_isolation_branch_fee_policies ON public.branch_fee_policies;
  CREATE POLICY tenant_isolation_branch_fee_policies ON public.branch_fee_policies
    FOR ALL USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());

  DROP POLICY IF EXISTS tenant_isolation_student_month_freezes ON public.student_month_freezes;
  CREATE POLICY tenant_isolation_student_month_freezes ON public.student_month_freezes
    FOR ALL USING (tenant_id = public.get_current_user_tenant_id())
    WITH CHECK (tenant_id = public.get_current_user_tenant_id());
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing branch fee RLS policies: %', SQLERRM;
END $$;

-- Clean wrong monthly_dues rows where due_month is not first day of month
DO $$
BEGIN
  WITH norm AS (
    SELECT id, student_id,
           date_trunc('month', due_month)::date AS nm,
           created_at
    FROM public.monthly_dues
  ), dup AS (
    SELECT student_id, nm, array_agg(id ORDER BY created_at DESC) AS ids
    FROM norm
    GROUP BY student_id, nm
    HAVING COUNT(*) > 1
  ), to_delete AS (
    SELECT unnest(ids[2:]) AS id FROM dup
  )
  DELETE FROM public.monthly_dues WHERE id IN (SELECT id FROM to_delete);

  UPDATE public.monthly_dues
  SET due_month = date_trunc('month', due_month)::date,
      due_date = (date_trunc('month', due_month) + INTERVAL '1 month' - INTERVAL '1 day')::date
  WHERE due_month <> date_trunc('month', due_month);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error cleaning monthly_dues normalization: %', SQLERRM;
END $$;

-- Add overdue updater and schedule for existing DBs (idempotent)
CREATE OR REPLACE FUNCTION public.update_overdue_status_pending_only()
RETURNS VOID AS $$
BEGIN
  UPDATE public.monthly_dues
    SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < (now() AT TIME ZONE 'Europe/Istanbul')::date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX IF NOT EXISTS idx_monthly_dues_pending_due_date
  ON public.monthly_dues (due_date)
  WHERE status = 'pending';

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update_overdue_status_daily') THEN
    PERFORM cron.schedule(
      'update_overdue_status_daily',
      'TZ=Europe/Istanbul 0 3 * * *',
      'SELECT public.update_overdue_status_pending_only();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error scheduling overdue job: %', SQLERRM;
END $$;

DO $$
BEGIN
  CREATE OR REPLACE FUNCTION create_monthly_due_on_group_join()
  RETURNS TRIGGER AS $func$
  DECLARE
    v_due_month DATE := date_trunc('month', CURRENT_DATE);
    v_due_date DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date;
    v_amount NUMERIC;
    v_branch_id UUID;
    v_tenant_id UUID;
  BEGIN
    SELECT g.monthly_fee, s.branch_id, s.tenant_id
      INTO v_amount, v_branch_id, v_tenant_id
      FROM public.groups g
      JOIN public.students s ON s.id = NEW.student_id
      WHERE g.id = NEW.group_id;

    IF v_amount IS NULL THEN
      v_amount := 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.monthly_dues md
       WHERE md.student_id = NEW.student_id
         AND md.due_month = v_due_month
    ) THEN
      INSERT INTO public.monthly_dues (
        tenant_id, branch_id, student_id, subscription_id,
        due_month, amount, paid_amount, due_date, status, notes
      ) VALUES (
        v_tenant_id, v_branch_id, NEW.student_id, NULL,
        v_due_month, v_amount, 0, v_due_date, 'pending', NULL
      );
    END IF;

    RETURN NEW;
  END;
  $func$ LANGUAGE plpgsql SECURITY DEFINER;

  DROP TRIGGER IF EXISTS trg_monthly_due_on_student_group_insert ON public.student_groups;
  CREATE TRIGGER trg_monthly_due_on_student_group_insert
    AFTER INSERT ON public.student_groups
    FOR EACH ROW EXECUTE FUNCTION create_monthly_due_on_group_join();

  -- Mevcutta varsa güncelleme tetikleyicisini kaldır
  DROP TRIGGER IF EXISTS trg_monthly_due_on_student_group_update ON public.student_groups;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating monthly due triggers: %', SQLERRM;
END $$;
