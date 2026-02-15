-- Fee Policies and Freeze Support (Branch-based)
-- =====================================================

-- Branch Fee Policies
CREATE TABLE IF NOT EXISTS branch_fee_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  fee_model VARCHAR(32) NOT NULL DEFAULT 'fixed', -- fixed | first_month_remaining | min_participation
  freeze_enabled BOOLEAN NOT NULL DEFAULT false,
  freeze_before_month_start_only BOOLEAN NOT NULL DEFAULT true,
  yearly_freeze_limit INTEGER DEFAULT 0,
  freeze_fee_policy VARCHAR(32) DEFAULT 'free', -- free | percent50 | justified_only_free
  planned_lessons_per_month INTEGER,
  min_full_attendance INTEGER,
  discount_range_min INTEGER,
  discount_range_max INTEGER,
  discount_fee_percent INTEGER, -- 0..100
  free_range_max INTEGER,
  conflict_priority VARCHAR(32) NOT NULL DEFAULT 'freeze_first', -- freeze_first | attendance_first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, branch_id)
);

-- Monthly freezes per student
CREATE TABLE IF NOT EXISTS student_month_freezes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  due_month DATE NOT NULL, -- first day of the month
  reason TEXT,
  justified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, due_month)
);

-- Extend monthly_dues with calculation metadata
ALTER TABLE monthly_dues
  ADD COLUMN IF NOT EXISTS policy_model_applied VARCHAR(64),
  ADD COLUMN IF NOT EXISTS participation_count INTEGER,
  ADD COLUMN IF NOT EXISTS freeze_applied BOOLEAN,
  ADD COLUMN IF NOT EXISTS applied_discount_percent INTEGER,
  ADD COLUMN IF NOT EXISTS computed_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS calculation_notes TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_branch_fee_policies_branch ON branch_fee_policies(branch_id);
CREATE INDEX IF NOT EXISTS idx_student_month_freezes_branch_month ON student_month_freezes(branch_id, due_month);
CREATE INDEX IF NOT EXISTS idx_student_month_freezes_student_month ON student_month_freezes(student_id, due_month);
CREATE INDEX IF NOT EXISTS idx_monthly_dues_branch_month ON monthly_dues(branch_id, due_month);

-- Row Level Security
ALTER TABLE branch_fee_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_month_freezes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_branch_fee_policies ON branch_fee_policies;
CREATE POLICY tenant_isolation_branch_fee_policies ON branch_fee_policies
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS tenant_isolation_student_month_freezes ON student_month_freezes;
CREATE POLICY tenant_isolation_student_month_freezes ON student_month_freezes
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Utility: get student subscription monthly amount
CREATE OR REPLACE FUNCTION get_student_monthly_amount(p_student_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_amt DECIMAL;
  v_sum DECIMAL;
BEGIN
  SELECT ss.monthly_amount INTO v_amt
  FROM student_subscriptions ss
  WHERE ss.student_id = p_student_id AND ss.status = 'active'
  ORDER BY ss.start_date DESC LIMIT 1;

  SELECT SUM(COALESCE(g.monthly_fee, 0)) INTO v_sum
  FROM student_groups sg
  JOIN groups g ON g.id = sg.group_id
  WHERE sg.student_id = p_student_id AND sg.status = 'active';

  RETURN COALESCE(v_amt, v_sum, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_student_monthly_amount_for_branch(p_student_id UUID, p_branch_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_sum DECIMAL;
BEGIN
  SELECT SUM(COALESCE(g.monthly_fee, 0)) INTO v_sum
  FROM student_groups sg
  JOIN groups g ON g.id = sg.group_id
  WHERE sg.student_id = p_student_id AND sg.status = 'active' AND g.branch_id = p_branch_id;

  RETURN COALESCE(v_sum, 0);
END;
$$ LANGUAGE plpgsql;

-- Compute monthly due according to branch policy
CREATE OR REPLACE FUNCTION compute_monthly_due(
  p_tenant_id UUID,
  p_branch_id UUID,
  p_student_id UUID,
  p_due_month DATE
)
RETURNS VOID AS $$
DECLARE
  v_policy RECORD;
  v_base_amount DECIMAL(10,2);
  v_attendance_count INTEGER := 0;
  v_freeze RECORD;
  v_is_first_month BOOLEAN := false;
  v_registration_date DATE;
  v_month_start DATE := DATE_TRUNC('month', p_due_month);
  v_month_end DATE := (DATE_TRUNC('month', p_due_month) + INTERVAL '1 month' - INTERVAL '1 day');
  v_original DECIMAL(10,2);
  v_computed DECIMAL(10,2);
  v_discount INT := NULL;
  v_notes TEXT := '';
  v_remaining_lessons INT := 0;
  v_fee_model TEXT := 'fixed';
BEGIN
  -- Load policy
  SELECT * INTO v_policy
  FROM branch_fee_policies
  WHERE tenant_id = p_tenant_id AND branch_id = p_branch_id;

  v_base_amount := COALESCE(
    get_student_monthly_amount_for_branch(p_student_id, p_branch_id),
    get_student_monthly_amount(p_student_id),
    0
  );
  v_original := v_base_amount;

  -- Registration date
  SELECT registration_date INTO v_registration_date FROM students WHERE id = p_student_id;
  v_is_first_month := v_registration_date IS NOT NULL AND DATE_TRUNC('month', v_registration_date) = v_month_start;

  -- Attendance count in month
  SELECT COUNT(*) INTO v_attendance_count
  FROM attendance a
  JOIN trainings t ON t.id = a.training_id
  WHERE a.student_id = p_student_id
    AND t.branch_id = p_branch_id
    AND t.training_date BETWEEN v_month_start AND v_month_end
    AND a.status IN ('present','late');

  -- Freeze record
  SELECT * INTO v_freeze
  FROM student_month_freezes f
  WHERE f.student_id = p_student_id AND f.due_month = v_month_start;

  -- Default: fixed model
  v_computed := v_base_amount;

  IF v_policy IS NULL THEN
    v_notes := 'No policy: fixed';
  ELSE
    -- fee model cache
    v_fee_model := COALESCE(v_policy.fee_model, 'fixed');
    -- Dondurma kontrolü
    IF v_policy.freeze_enabled AND v_freeze IS NOT NULL THEN
      IF v_policy.conflict_priority = 'freeze_first' THEN
        IF v_policy.freeze_fee_policy = 'free' OR (v_policy.freeze_fee_policy = 'justified_only_free' AND v_freeze.justified) THEN
          v_computed := 0;
          v_discount := 100;
          v_notes := 'Freeze applied: free';
        ELSIF v_policy.freeze_fee_policy = 'percent50' THEN
          v_computed := ROUND(v_base_amount * 0.5, 2);
          v_discount := 50;
          v_notes := 'Freeze applied: 50%';
        ELSE
          v_notes := 'Freeze applied: no discount';
        END IF;
      END IF;
    END IF;

    -- Minimum katılım veya ilk ay mantığı
    IF v_computed = v_base_amount THEN
      IF v_is_first_month AND v_policy.fee_model = 'first_month_remaining' THEN
        -- Kalan dersler: bu ay kayıt tarihinden sonra planlanan antrenman sayısı
        -- Basit yaklaşım: şubedeki tüm trainings (öğrencinin grup eşleşmesi yoksa şube geneli)
        SELECT COUNT(*) INTO v_remaining_lessons
        FROM trainings t
        WHERE t.branch_id = p_branch_id
          AND t.training_date BETWEEN v_registration_date AND v_month_end;
        v_computed := ROUND(COALESCE(v_remaining_lessons,0) * (v_base_amount / NULLIF(v_policy.planned_lessons_per_month,0)), 2);
        v_notes := CONCAT('First month remaining lessons: ', v_remaining_lessons);
      ELSIF v_policy.fee_model = 'min_participation' THEN
        IF v_policy.min_full_attendance IS NOT NULL AND v_attendance_count >= v_policy.min_full_attendance THEN
          v_computed := v_base_amount;
          v_discount := 0;
          v_notes := CONCAT('Attendance full: ', v_attendance_count);
        ELSIF v_policy.discount_range_min IS NOT NULL AND v_policy.discount_range_max IS NOT NULL AND v_attendance_count BETWEEN v_policy.discount_range_min AND v_policy.discount_range_max THEN
          v_discount := COALESCE(v_policy.discount_fee_percent, 0);
          v_computed := ROUND(v_base_amount * (1 - (COALESCE(v_policy.discount_fee_percent,0) / 100.0)), 2);
          v_notes := CONCAT('Attendance discounted: ', v_attendance_count, ' (-', COALESCE(v_policy.discount_fee_percent,0), '%)');
        ELSIF v_policy.free_range_max IS NOT NULL AND v_attendance_count <= v_policy.free_range_max THEN
          v_computed := 0;
          v_discount := 100;
          v_notes := CONCAT('Attendance free: ', v_attendance_count);
        ELSE
          v_notes := CONCAT('Attendance default: ', v_attendance_count);
        END IF;
      ELSE
        v_notes := 'Fixed model';
      END IF;
    END IF;

    -- Attendance-first öncelik durumu: varsa dondurma kaydı ve öncelik katılım ise katılım kurallarını uygula
    IF v_policy.freeze_enabled AND v_freeze IS NOT NULL AND v_policy.conflict_priority = 'attendance_first' THEN
      -- Katılım kuralı baskın; yukarıdaki min_participation/first_month hesaplaması v_computed'ı ayarladı
      v_notes := CONCAT(v_notes, '; conflict: attendance_first');
    END IF;
  END IF;

  -- Update monthly_dues row
  UPDATE monthly_dues
  SET 
    amount = v_computed,
    original_amount = v_original,
    computed_amount = v_computed,
    participation_count = v_attendance_count,
    freeze_applied = (v_freeze IS NOT NULL),
    applied_discount_percent = v_discount,
    policy_model_applied = v_fee_model,
    calculation_notes = v_notes,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND branch_id = p_branch_id
    AND student_id = p_student_id
    AND due_month = v_month_start;
END;
$$ LANGUAGE plpgsql;

-- Generate monthly dues for all active students in a branch and compute amounts
CREATE OR REPLACE FUNCTION generate_monthly_dues_v2(
  p_tenant_id UUID,
  p_branch_id UUID,
  p_due_month DATE
)
RETURNS VOID AS $$
DECLARE
  v_student RECORD;
  v_due_day INTEGER := 1;
  v_month_start DATE := DATE_TRUNC('month', p_due_month);
  v_due_date DATE := v_month_start + ((v_due_day - 1) || ' days')::INTERVAL;
BEGIN
  FOR v_student IN
    SELECT s.id AS student_id
    FROM students s
    WHERE s.tenant_id = p_tenant_id AND s.branch_id = p_branch_id AND s.status = 'active'
  LOOP
    INSERT INTO monthly_dues (tenant_id, branch_id, student_id, due_month, amount, paid_amount, due_date, status)
    VALUES (
      p_tenant_id,
      p_branch_id,
      v_student.student_id,
      v_month_start,
      COALESCE(
        get_student_monthly_amount_for_branch(v_student.student_id, p_branch_id),
        get_student_monthly_amount(v_student.student_id),
        0
      ),
      0,
      v_due_date,
      'pending'
    )
    ON CONFLICT (student_id, due_month) DO NOTHING;

    PERFORM compute_monthly_due(p_tenant_id, p_branch_id, v_student.student_id, v_month_start);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
