CREATE TABLE IF NOT EXISTS student_fee_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  override_amount DECIMAL(10,2),
  discount_percent INTEGER,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, student_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_student_fee_overrides_student_branch ON student_fee_overrides(student_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_overrides_effective ON student_fee_overrides(effective_from, effective_to);

ALTER TABLE student_fee_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_student_fee_overrides ON student_fee_overrides;
CREATE POLICY tenant_isolation_student_fee_overrides ON student_fee_overrides
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION get_student_monthly_amount_for_month(
  p_student_id UUID,
  p_branch_id UUID,
  p_due_month DATE
)
RETURNS DECIMAL AS $$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', p_due_month);
  v_month_end DATE := (DATE_TRUNC('month', p_due_month) + INTERVAL '1 month' - INTERVAL '1 day');
  v_group_base DECIMAL(10,2);
  v_base DECIMAL(10,2);
  v_override RECORD;
BEGIN
  v_group_base := COALESCE(
    get_student_monthly_amount_for_branch(p_student_id, p_branch_id),
    get_student_monthly_amount(p_student_id),
    0
  );

  SELECT * INTO v_override
  FROM student_fee_overrides o
  WHERE o.student_id = p_student_id
    AND o.branch_id = p_branch_id
    AND (o.effective_from IS NULL OR o.effective_from <= v_month_end)
    AND (o.effective_to IS NULL OR o.effective_to >= v_month_start)
  ORDER BY o.effective_from DESC
  LIMIT 1;

  IF v_override IS NOT NULL AND v_override.override_amount IS NOT NULL THEN
    v_base := v_override.override_amount;
  ELSIF v_override IS NOT NULL AND v_override.discount_percent IS NOT NULL THEN
    v_base := ROUND(v_group_base * (1 - (v_override.discount_percent / 100.0)), 2);
  ELSE
    v_base := v_group_base;
  END IF;

  RETURN COALESCE(v_base, 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION compute_monthly_due_v3(
  p_tenant_id UUID,
  p_branch_id UUID,
  p_student_id UUID,
  p_due_month DATE
)
RETURNS VOID AS $$
DECLARE
  v_policy RECORD;
  v_group_base DECIMAL(10,2);
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
  v_override RECORD;
BEGIN
  SELECT * INTO v_policy
  FROM branch_fee_policies
  WHERE tenant_id = p_tenant_id AND branch_id = p_branch_id;

  v_group_base := COALESCE(
    get_student_monthly_amount_for_branch(p_student_id, p_branch_id),
    get_student_monthly_amount(p_student_id),
    0
  );
  v_base_amount := get_student_monthly_amount_for_month(p_student_id, p_branch_id, p_due_month);
  v_original := v_group_base;

  SELECT * INTO v_override
  FROM student_fee_overrides o
  WHERE o.student_id = p_student_id
    AND o.branch_id = p_branch_id
    AND (o.effective_from IS NULL OR o.effective_from <= v_month_end)
    AND (o.effective_to IS NULL OR o.effective_to >= v_month_start)
  ORDER BY o.effective_from DESC
  LIMIT 1;

  SELECT registration_date INTO v_registration_date FROM students WHERE id = p_student_id;
  v_is_first_month := v_registration_date IS NOT NULL AND DATE_TRUNC('month', v_registration_date) = v_month_start;

  SELECT COUNT(*) INTO v_attendance_count
  FROM attendance a
  JOIN trainings t ON t.id = a.training_id
  WHERE a.student_id = p_student_id
    AND t.branch_id = p_branch_id
    AND t.training_date BETWEEN v_month_start AND v_month_end
    AND a.status IN ('present','late');

  SELECT * INTO v_freeze
  FROM student_month_freezes f
  WHERE f.student_id = p_student_id AND f.due_month = v_month_start;

  v_computed := v_base_amount;

  IF v_policy IS NULL THEN
    v_notes := 'No policy: fixed';
  ELSE
    v_fee_model := COALESCE(v_policy.fee_model, 'fixed');
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

    IF v_computed = v_base_amount THEN
      IF v_is_first_month AND v_policy.fee_model = 'first_month_remaining' THEN
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

    IF v_policy.freeze_enabled AND v_freeze IS NOT NULL AND v_policy.conflict_priority = 'attendance_first' THEN
      v_notes := CONCAT(v_notes, '; conflict: attendance_first');
    END IF;
  END IF;

  IF v_override IS NOT NULL AND v_override.override_amount IS NOT NULL THEN
    v_notes := CONCAT(v_notes, '; override: fixed');
  ELSIF v_override IS NOT NULL AND v_override.discount_percent IS NOT NULL THEN
    v_notes := CONCAT(v_notes, '; override: -', v_override.discount_percent, '%');
  END IF;

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

CREATE OR REPLACE FUNCTION generate_monthly_dues_v3(
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
  v_base DECIMAL(10,2);
BEGIN
  FOR v_student IN
    SELECT s.id AS student_id
    FROM students s
    WHERE s.tenant_id = p_tenant_id AND s.branch_id = p_branch_id AND s.status = 'active'
  LOOP
    v_base := get_student_monthly_amount_for_month(v_student.student_id, p_branch_id, v_month_start);

    INSERT INTO monthly_dues (tenant_id, branch_id, student_id, due_month, amount, paid_amount, due_date, status)
    VALUES (
      p_tenant_id,
      p_branch_id,
      v_student.student_id,
      v_month_start,
      COALESCE(v_base, 0),
      0,
      v_due_date,
      'pending'
    )
    ON CONFLICT (student_id, due_month) DO NOTHING;

    PERFORM compute_monthly_due_v3(p_tenant_id, p_branch_id, v_student.student_id, v_month_start);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
