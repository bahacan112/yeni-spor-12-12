-- Complete Schema with Triggers, Views, Functions
-- =====================================================

-- =====================================================
-- ADDITIONAL TABLES
-- =====================================================

-- Instructor credentials for login (eğitmen giriş bilgileri)
CREATE TABLE IF NOT EXISTS instructor_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phone verification codes
CREATE TABLE IF NOT EXISTS phone_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student performance tracking
CREATE TABLE IF NOT EXISTS student_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
  evaluation_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL, -- technique, strength, endurance, teamwork
  score INTEGER CHECK (score >= 1 AND score <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student notes by instructors
CREATE TABLE IF NOT EXISTS student_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Active students with payment status
CREATE OR REPLACE VIEW v_student_payment_status AS
SELECT 
  s.id as student_id,
  s.tenant_id,
  s.branch_id,
  s.full_name,
  s.phone,
  s.email,
  s.status as student_status,
  COALESCE(
    (SELECT COUNT(*) FROM monthly_dues md WHERE md.student_id = s.id AND md.status = 'overdue'),
    0
  ) as overdue_count,
  COALESCE(
    (SELECT SUM(amount - paid_amount) FROM monthly_dues md WHERE md.student_id = s.id AND md.status IN ('pending', 'overdue', 'partial')),
    0
  ) as total_debt,
  (SELECT md.due_date FROM monthly_dues md WHERE md.student_id = s.id AND md.status IN ('pending', 'overdue') ORDER BY md.due_date LIMIT 1) as next_due_date
FROM students s
WHERE s.status = 'active';

-- View: Instructor dashboard summary
CREATE OR REPLACE VIEW v_instructor_summary AS
SELECT 
  i.id as instructor_id,
  i.tenant_id,
  i.full_name,
  i.specialization,
  COUNT(DISTINCT g.id) as group_count,
  COUNT(DISTINCT sg.student_id) as student_count,
  COUNT(DISTINCT CASE WHEN t.training_date = CURRENT_DATE THEN t.id END) as today_trainings,
  COUNT(DISTINCT CASE WHEN t.training_date >= CURRENT_DATE AND t.training_date < CURRENT_DATE + INTERVAL '7 days' THEN t.id END) as week_trainings
FROM instructors i
LEFT JOIN groups g ON g.instructor_id = i.id AND g.status = 'active'
LEFT JOIN student_groups sg ON sg.group_id = g.id AND sg.status = 'active'
LEFT JOIN trainings t ON t.instructor_id = i.id AND t.status = 'scheduled'
WHERE i.status = 'active'
GROUP BY i.id;

-- View: Tenant statistics
CREATE OR REPLACE VIEW v_tenant_stats AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.subscription_status,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_students,
  COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'active') as active_groups,
  COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'active') as active_instructors,
  COUNT(DISTINCT b.id) FILTER (WHERE b.is_active = true) as active_branches,
  COALESCE(SUM(p.amount) FILTER (WHERE p.payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) as monthly_revenue
FROM tenants t
LEFT JOIN students s ON s.tenant_id = t.id
LEFT JOIN groups g ON g.tenant_id = t.id
LEFT JOIN instructors i ON i.tenant_id = t.id
LEFT JOIN branches b ON b.tenant_id = t.id
LEFT JOIN payments p ON p.tenant_id = t.id
GROUP BY t.id;

-- View: Monthly revenue report
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT 
  tenant_id,
  DATE_TRUNC('month', payment_date) as month,
  payment_type,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count
FROM payments
GROUP BY tenant_id, DATE_TRUNC('month', payment_date), payment_type
ORDER BY month DESC;

-- View: Attendance summary
CREATE OR REPLACE VIEW v_attendance_summary AS
SELECT 
  t.tenant_id,
  t.group_id,
  g.name as group_name,
  t.training_date,
  COUNT(*) as total_students,
  COUNT(*) FILTER (WHERE a.status = 'present') as present_count,
  COUNT(*) FILTER (WHERE a.status = 'absent') as absent_count,
  COUNT(*) FILTER (WHERE a.status = 'late') as late_count,
  ROUND(COUNT(*) FILTER (WHERE a.status = 'present')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as attendance_rate
FROM trainings t
JOIN groups g ON g.id = t.group_id
LEFT JOIN attendance a ON a.training_id = t.id
GROUP BY t.tenant_id, t.group_id, g.name, t.id, t.training_date;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Generate monthly dues for a student
CREATE OR REPLACE FUNCTION generate_monthly_dues(
  p_tenant_id UUID,
  p_student_id UUID,
  p_amount DECIMAL,
  p_due_day INTEGER,
  p_months INTEGER DEFAULT 12
)
RETURNS void AS $$
DECLARE
  v_month DATE;
  v_due_date DATE;
BEGIN
  FOR i IN 0..(p_months - 1) LOOP
    v_month := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
    v_due_date := v_month + ((p_due_day - 1) || ' days')::INTERVAL;
    
    INSERT INTO monthly_dues (tenant_id, student_id, due_month, amount, due_date, status)
    VALUES (p_tenant_id, p_student_id, v_month, p_amount, v_due_date, 'pending')
    ON CONFLICT (student_id, due_month) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Validate student-group membership by birth date and license
CREATE OR REPLACE FUNCTION validate_student_group_membership()
RETURNS TRIGGER AS $$
DECLARE
  v_birth_date DATE;
  v_is_licensed BOOLEAN;
  v_from DATE;
  v_to DATE;
  v_license_req VARCHAR(20);
BEGIN
  SELECT birth_date, is_licensed INTO v_birth_date, v_is_licensed FROM students WHERE id = NEW.student_id;
  SELECT birth_date_from, birth_date_to, license_requirement INTO v_from, v_to, v_license_req FROM groups WHERE id = NEW.group_id;

  -- Birth date range check (NULL means unbounded)
  IF v_birth_date IS NOT NULL THEN
    IF v_from IS NOT NULL AND v_birth_date < v_from THEN
      RAISE EXCEPTION 'Student birth_date (%) is before group lower bound (%)', v_birth_date, v_from;
    END IF;
    IF v_to IS NOT NULL AND v_birth_date > v_to THEN
      RAISE EXCEPTION 'Student birth_date (%) is after group upper bound (%)', v_birth_date, v_to;
    END IF;
  END IF;

  -- License requirement check
  IF v_license_req = 'licensed' AND NOT v_is_licensed THEN
    RAISE EXCEPTION 'Group requires licensed students';
  ELSIF v_license_req = 'unlicensed' AND v_is_licensed THEN
    RAISE EXCEPTION 'Group requires unlicensed students';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update monthly due status based on date
CREATE OR REPLACE FUNCTION update_overdue_status()
RETURNS void AS $$
BEGIN
  UPDATE monthly_dues
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function: Check tenant limits
CREATE OR REPLACE FUNCTION check_tenant_limits(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_subscription RECORD;
  v_plan RECORD;
  v_student_count INTEGER;
  v_group_count INTEGER;
BEGIN
  -- Get current subscription
  SELECT * INTO v_subscription
  FROM tenant_subscriptions
  WHERE tenant_id = p_tenant_id AND status = 'active'
  ORDER BY created_at DESC LIMIT 1;
  
  IF v_subscription IS NULL THEN
    -- Check if tenant is limited
    SELECT max_students, max_groups INTO v_plan
    FROM tenants WHERE id = p_tenant_id;
    
    SELECT COUNT(*) INTO v_student_count FROM students WHERE tenant_id = p_tenant_id AND status = 'active';
    SELECT COUNT(*) INTO v_group_count FROM groups WHERE tenant_id = p_tenant_id AND status = 'active';
    
    v_result := jsonb_build_object(
      'is_limited', true,
      'max_students', COALESCE(v_plan.max_students, 30),
      'max_groups', COALESCE(v_plan.max_groups, 2),
      'current_students', v_student_count,
      'current_groups', v_group_count,
      'can_add_student', v_student_count < COALESCE(v_plan.max_students, 30),
      'can_add_group', v_group_count < COALESCE(v_plan.max_groups, 2)
    );
  ELSE
    SELECT * INTO v_plan FROM platform_plans WHERE id = v_subscription.plan_id;
    
    SELECT COUNT(*) INTO v_student_count FROM students WHERE tenant_id = p_tenant_id AND status = 'active';
    SELECT COUNT(*) INTO v_group_count FROM groups WHERE tenant_id = p_tenant_id AND status = 'active';
    
    v_result := jsonb_build_object(
      'is_limited', false,
      'max_students', v_plan.max_students,
      'max_groups', v_plan.max_groups,
      'current_students', v_student_count,
      'current_groups', v_group_count,
      'can_add_student', v_plan.max_students IS NULL OR v_student_count < v_plan.max_students,
      'can_add_group', v_plan.max_groups IS NULL OR v_group_count < v_plan.max_groups
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate student attendance rate
CREATE OR REPLACE FUNCTION get_student_attendance_rate(p_student_id UUID, p_months INTEGER DEFAULT 3)
RETURNS DECIMAL AS $$
DECLARE
  v_total INTEGER;
  v_present INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE a.status IN ('present', 'late'))
  INTO v_total, v_present
  FROM attendance a
  JOIN trainings t ON t.id = a.training_id
  WHERE a.student_id = p_student_id
    AND t.training_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL;
    
  IF v_total = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((v_present::DECIMAL / v_total) * 100, 1);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Auto-update student count in groups
CREATE OR REPLACE FUNCTION update_group_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE groups SET updated_at = NOW() WHERE id = NEW.group_id;
  END IF;
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE groups SET updated_at = NOW() WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_group_count ON student_groups;
CREATE TRIGGER trg_update_group_count
AFTER INSERT OR UPDATE OR DELETE ON student_groups
FOR EACH ROW EXECUTE FUNCTION update_group_student_count();

-- Enforce membership rules on student_groups
DROP TRIGGER IF EXISTS trg_validate_student_group_membership ON student_groups;
CREATE TRIGGER trg_validate_student_group_membership
BEFORE INSERT OR UPDATE ON student_groups
FOR EACH ROW EXECUTE FUNCTION validate_student_group_membership();

CREATE OR REPLACE FUNCTION recompute_subscription_monthly_amount(p_student_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sum DECIMAL(10,2);
  v_existing_sub RECORD;
  v_tenant UUID;
  v_plan UUID;
BEGIN
  SELECT SUM(COALESCE(g.monthly_fee, 0)) INTO v_sum
  FROM student_groups sg
  JOIN groups g ON g.id = sg.group_id
  WHERE sg.student_id = p_student_id AND sg.status = 'active';

  v_sum := COALESCE(v_sum, 0);

  SELECT * INTO v_existing_sub
  FROM student_subscriptions
  WHERE student_id = p_student_id AND status = 'active'
  ORDER BY start_date DESC LIMIT 1;

  IF v_existing_sub IS NOT NULL THEN
    UPDATE student_subscriptions
    SET monthly_amount = v_sum,
        updated_at = NOW()
    WHERE id = v_existing_sub.id;
  ELSE
    SELECT tenant_id INTO v_tenant FROM students WHERE id = p_student_id;
    SELECT id INTO v_plan FROM payment_plans
    WHERE tenant_id = v_tenant AND is_active = true AND period = 'monthly'
    ORDER BY amount ASC LIMIT 1;

    IF v_plan IS NULL THEN
      INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, new_values)
      VALUES (v_tenant, 'SUBSCRIPTION_SKIPPED_NO_PLAN', 'students', p_student_id, jsonb_build_object('student_id', p_student_id, 'monthly_sum', v_sum));
      RETURN;
    END IF;

    INSERT INTO student_subscriptions (student_id, payment_plan_id, start_date, monthly_amount, payment_day, status, created_at, updated_at)
    VALUES (p_student_id, v_plan, CURRENT_DATE, v_sum, 1, 'active', NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_subscription_with_group()
RETURNS TRIGGER AS $$
DECLARE
  v_student UUID;
BEGIN
  v_student := COALESCE(NEW.student_id, OLD.student_id);
  PERFORM recompute_subscription_monthly_amount(v_student);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_subscription_with_group ON student_groups;
CREATE TRIGGER trg_sync_subscription_with_group
AFTER INSERT OR UPDATE OR DELETE ON student_groups
FOR EACH ROW EXECUTE FUNCTION sync_subscription_with_group();

CREATE OR REPLACE FUNCTION sync_subscription_on_group_fee_update()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT student_id FROM student_groups WHERE group_id = NEW.id AND status = 'active' LOOP
    PERFORM recompute_subscription_monthly_amount(r.student_id);
  END LOOP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_subscription_on_group_fee_update ON groups;
CREATE TRIGGER trg_sync_subscription_on_group_fee_update
AFTER UPDATE OF monthly_fee ON groups
FOR EACH ROW EXECUTE FUNCTION sync_subscription_on_group_fee_update();

-- Trigger: Auto-update registration link used count
CREATE OR REPLACE FUNCTION update_registration_link_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_link_id IS NOT NULL THEN
    UPDATE registration_links 
    SET used_count = used_count + 1 
    WHERE id = NEW.registration_link_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reg_link_count ON applications;
CREATE TRIGGER trg_update_reg_link_count
AFTER INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION update_registration_link_count();

-- Trigger: Auto-update payment status after payment
CREATE OR REPLACE FUNCTION update_due_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.monthly_due_id IS NOT NULL THEN
    UPDATE monthly_dues
    SET 
      paid_amount = paid_amount + NEW.amount,
      status = CASE 
        WHEN paid_amount + NEW.amount >= amount THEN 'paid'
        ELSE 'partial'
      END,
      paid_at = CASE 
        WHEN paid_amount + NEW.amount >= amount THEN NOW()
        ELSE paid_at
      END,
      updated_at = NOW()
    WHERE id = NEW.monthly_due_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_due_after_payment ON payments;
CREATE TRIGGER trg_update_due_after_payment
AFTER INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION update_due_after_payment();

-- Trigger: Update tenant subscription status
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_period_end < NOW() AND NEW.status = 'active' THEN
    NEW.status := 'expired';
    
    -- Update tenant to limited mode
    UPDATE tenants
    SET 
      subscription_status = 'expired',
      is_limited = true,
      max_students = 30,
      max_groups = 2,
      updated_at = NOW()
    WHERE id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_subscription ON tenant_subscriptions;
CREATE TRIGGER trg_check_subscription
BEFORE UPDATE ON tenant_subscriptions
FOR EACH ROW EXECUTE FUNCTION check_subscription_expiry();

-- Trigger: Log important actions
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, old_values)
    VALUES (OLD.tenant_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSE
    INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.tenant_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to important tables
DROP TRIGGER IF EXISTS audit_students ON students;
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS audit_payments ON payments;
CREATE TRIGGER audit_payments AFTER INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION log_audit_action();

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_instructor_credentials_instructor ON instructor_credentials(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_credentials_username ON instructor_credentials(username);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_student_performance_student ON student_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_student ON student_notes(student_id);
