-- Super Admin Panel & Subscription System Schema
-- =====================================================

-- Platform subscription plans for tenants (okullar için paketler)
CREATE TABLE IF NOT EXISTS platform_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10, 2) NOT NULL,
  yearly_price DECIMAL(10, 2) NOT NULL,
  max_students INTEGER, -- NULL = unlimited
  max_groups INTEGER,
  max_branches INTEGER,
  max_instructors INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  trial_enabled BOOLEAN DEFAULT false,
  trial_default_days INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant subscriptions (okul abonelikleri)
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES platform_plans(id),
  billing_period VARCHAR(20) NOT NULL, -- 'monthly' or 'yearly'
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, cancelled, suspended
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50), -- credit_card, bank_transfer
  auto_renew BOOLEAN DEFAULT true,
  is_trial BOOLEAN DEFAULT false,
  trial_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant subscription payments (okul ödeme geçmişi)
CREATE TABLE IF NOT EXISTS tenant_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, refunded
  invoice_no VARCHAR(50),
  description TEXT,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification templates (bildirim şablonları)
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for platform-wide
  type VARCHAR(50) NOT NULL, -- payment_reminder, welcome, subscription_expiry, etc.
  channel VARCHAR(20) NOT NULL, -- sms, email, push
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255), -- for email
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- available variables
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- system templates can't be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs (gönderilen bildirimler)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  recipient_type VARCHAR(50) NOT NULL, -- student, guardian, tenant_admin
  recipient_id UUID, -- student_id, user_id, etc.
  recipient_contact VARCHAR(255) NOT NULL, -- phone or email
  channel VARCHAR(20) NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, delivered
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled notifications (zamanlanmış bildirimler)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES notification_templates(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL, -- days_before_due, days_after_due, subscription_expiry
  trigger_days INTEGER NOT NULL, -- e.g., 3 days before
  target_audience VARCHAR(50) NOT NULL, -- all_pending, overdue, expiring_subscriptions
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform settings (platform ayarları)
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System audit logs (sistem denetim kayıtları)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subscription fields to tenants if not exists
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_limited BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_students INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_groups INTEGER;

-- Trial support columns for existing tables
ALTER TABLE platform_plans ADD COLUMN IF NOT EXISTS trial_enabled BOOLEAN DEFAULT false;
ALTER TABLE platform_plans ADD COLUMN IF NOT EXISTS trial_default_days INTEGER;
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS trial_days INTEGER;

-- Insert default platform plans
INSERT INTO platform_plans (name, slug, description, monthly_price, yearly_price, max_students, max_groups, max_branches, max_instructors, features, sort_order) VALUES
('Deneme', 'trial', 'Ücretsiz deneme paketi', 0, 0, 30, 2, 1, 2, '["basic_features"]', 0),
('Başlangıç', 'starter', 'Küçük spor okulları için ideal', 999, 9990, 100, 5, 1, 5, '["basic_features", "email_support"]', 1),
('Profesyonel', 'professional', 'Büyüyen spor okulları için', 1999, 19990, 500, 20, 3, 15, '["basic_features", "email_support", "sms_notifications", "website", "ecommerce"]', 2),
('Kurumsal', 'enterprise', 'Büyük kurumlar için sınırsız', 4999, 49990, NULL, NULL, NULL, NULL, '["basic_features", "email_support", "sms_notifications", "website", "ecommerce", "priority_support", "custom_domain", "api_access"]', 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert default notification templates
INSERT INTO notification_templates (type, channel, name, subject, content, variables, is_system) VALUES
('payment_reminder', 'sms', 'Ödeme Hatırlatması (SMS)', NULL, 'Sayın {guardian_name}, {student_name} adlı öğrencinizin {month} ayı aidatı ({amount} TL) ödeme tarihi yaklaşmaktadır. Son ödeme tarihi: {due_date}', '["guardian_name", "student_name", "month", "amount", "due_date"]', true),
('payment_reminder', 'email', 'Ödeme Hatırlatması (E-posta)', 'Aidat Ödeme Hatırlatması', '<p>Sayın {guardian_name},</p><p>{student_name} adlı öğrencinizin {month} ayı aidatı ({amount} TL) ödeme tarihi yaklaşmaktadır.</p><p>Son ödeme tarihi: {due_date}</p>', '["guardian_name", "student_name", "month", "amount", "due_date"]', true),
('payment_overdue', 'sms', 'Gecikmiş Ödeme (SMS)', NULL, 'Sayın {guardian_name}, {student_name} adlı öğrencinizin {month} ayı aidatı ({amount} TL) gecikmiştir. Lütfen en kısa sürede ödemenizi yapınız.', '["guardian_name", "student_name", "month", "amount"]', true),
('welcome', 'email', 'Hoş Geldiniz', 'Spor Akademimize Hoş Geldiniz!', '<p>Sayın {guardian_name},</p><p>{student_name} adlı öğrencinizin kaydı başarıyla tamamlanmıştır. Spor ailemize hoş geldiniz!</p>', '["guardian_name", "student_name"]', true),
('subscription_expiry', 'email', 'Abonelik Süresi Dolacak', 'Abonelik Süreniz Dolmak Üzere', '<p>Sayın {tenant_name},</p><p>Platform aboneliğinizin süresi {expiry_date} tarihinde dolacaktır. Kesintisiz hizmet için lütfen aboneliğinizi yenileyin.</p>', '["tenant_name", "expiry_date"]', true)
ON CONFLICT DO NOTHING;

-- Insert default platform settings
INSERT INTO platform_settings (key, value, type, description) VALUES
('platform_name', 'Spor Akademi Yönetim Sistemi', 'string', 'Platform adı'),
('support_email', 'destek@sporakademi.com', 'string', 'Destek e-posta adresi'),
('sms_enabled', 'true', 'boolean', 'SMS bildirimleri aktif mi'),
('email_enabled', 'true', 'boolean', 'E-posta bildirimleri aktif mi'),
('trial_days', '14', 'number', 'Deneme süresi (gün)'),
('expired_tenant_max_students', '30', 'number', 'Süresi dolan okul max öğrenci'),
('expired_tenant_max_groups', '2', 'number', 'Süresi dolan okul max grup')
ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant ON notification_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
