-- Seed data for testing

-- Insert demo tenant
INSERT INTO tenants (id, name, slug, email, phone, primary_color, secondary_color)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Spor Akademi',
  'spor-akademi',
  'info@sporakademi.com',
  '+90 555 123 4567',
  '#3b82f6',
  '#10b981'
);

-- Insert branches
INSERT INTO branches (id, tenant_id, name, address, city, district, is_main)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Merkez Şube', 'Atatürk Cad. No: 123', 'İstanbul', 'Kadıköy', true),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Beşiktaş Şube', 'Barbaros Bulvarı No: 45', 'İstanbul', 'Beşiktaş', false);

-- Insert admin user
INSERT INTO users (id, tenant_id, email, password_hash, full_name, phone, role)
VALUES (
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@sporakademi.com',
  '$2b$10$example_hash_here', -- bcrypt hash
  'Admin Kullanıcı',
  '+90 555 111 2222',
  'tenant_admin'
);

-- Insert instructors
INSERT INTO instructors (tenant_id, full_name, phone, email, specialization)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Ahmet Yılmaz', '+90 555 222 3333', 'ahmet@sporakademi.com', 'Futbol'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Mehmet Demir', '+90 555 333 4444', 'mehmet@sporakademi.com', 'Basketbol'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Ayşe Kaya', '+90 555 444 5555', 'ayse@sporakademi.com', 'Yüzme');

-- Insert venues
INSERT INTO venues (tenant_id, branch_id, name, type, capacity)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'Ana Saha', 'outdoor', 30),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 'Kapalı Salon', 'indoor', 20),
  ('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440002', 'Yüzme Havuzu', 'pool', 15);

-- Insert payment plans
INSERT INTO payment_plans (tenant_id, name, amount, period)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Aylık Standart', 1500.00, 'monthly'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Aylık Premium', 2500.00, 'monthly'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Yıllık Paket', 15000.00, 'yearly');

-- Insert product categories
INSERT INTO product_categories (tenant_id, name, slug)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Spor Giyim', 'spor-giyim'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Ekipman', 'ekipman'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Aksesuarlar', 'aksesuarlar');
