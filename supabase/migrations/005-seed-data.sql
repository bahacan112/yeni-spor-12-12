-- =====================================================
-- SEED DATA - Comprehensive Test Data
-- =====================================================

-- Clear existing data (in correct order due to foreign keys)
TRUNCATE TABLE order_items, orders, payments, monthly_dues, attendance, trainings, 
  student_groups, student_guardians, applications, registration_links, 
  products, product_variants, product_categories, announcements, website_pages,
  expenses, student_subscriptions, payment_plans, venues, groups, 
  instructor_branches, instructors, students, user_branches, users, branches, 
  audit_logs, notification_logs, notification_templates, tenant_subscriptions, 
  platform_plans, tenants CASCADE;

-- =====================================================
-- PLATFORM PLANS (System-wide subscription plans)
-- =====================================================
INSERT INTO platform_plans (id, name, slug, description, monthly_price, yearly_price, max_students, max_groups, max_branches, max_instructors, features, is_active, sort_order) VALUES
  ('plan-basic', 'Başlangıç', 'baslangic', 'Küçük spor okulları için ideal başlangıç paketi', 499, 4990, 50, 5, 1, 3, '["Temel öğrenci yönetimi", "Aidat takibi", "Basit raporlar"]'::jsonb, true, 1),
  ('plan-pro', 'Profesyonel', 'profesyonel', 'Büyüyen spor akademileri için kapsamlı çözüm', 999, 9990, 200, 20, 3, 10, '["Gelişmiş öğrenci yönetimi", "Aidat takibi", "Detaylı raporlar", "SMS bildirimleri", "E-ticaret", "Özel web sitesi"]'::jsonb, true, 2),
  ('plan-enterprise', 'Kurumsal', 'kurumsal', 'Büyük spor kompleksleri için sınırsız çözüm', 1999, 19990, NULL, NULL, NULL, NULL, '["Sınırsız öğrenci", "Sınırsız grup", "Sınırsız şube", "Öncelikli destek", "API erişimi", "Özel entegrasyonlar"]'::jsonb, true, 3);

-- =====================================================
-- TENANTS (Sports Schools)
-- =====================================================
INSERT INTO tenants (id, name, slug, logo_url, primary_color, secondary_color, email, phone, website_enabled, subscription_plan, subscription_status, is_limited, max_students, max_groups) VALUES
  ('tenant-1', 'Yıldız Spor Akademi', 'yildiz-spor', '/sports-academy-logo.jpg', '#3b82f6', '#10b981', 'info@yildizsporakademi.com', '+90 212 555 1234', true, 'pro', 'active', false, NULL, NULL),
  ('tenant-2', 'Fenerbahçe Spor Okulu', 'fener-spor', NULL, '#FFD600', '#0D1E30', 'info@fenerspor.com', '+90 216 555 4567', true, 'enterprise', 'active', false, NULL, NULL),
  ('tenant-3', 'Kartal Spor Kulübü', 'kartal-spor', NULL, '#000000', '#FFFFFF', 'iletisim@kartalspor.com', '+90 216 555 7890', true, 'basic', 'active', false, NULL, NULL),
  ('tenant-4', 'Deneme Spor Okulu', 'deneme-spor', NULL, '#9333ea', '#f59e0b', 'test@denemespor.com', '+90 555 000 0000', false, 'basic', 'expired', true, 30, 2);

-- =====================================================
-- TENANT SUBSCRIPTIONS
-- =====================================================
INSERT INTO tenant_subscriptions (id, tenant_id, plan_id, status, billing_period, current_period_start, current_period_end, amount) VALUES
  ('sub-1', 'tenant-1', 'plan-pro', 'active', 'yearly', '2024-01-01', '2024-12-31', 9990),
  ('sub-2', 'tenant-2', 'plan-enterprise', 'active', 'yearly', '2024-01-01', '2024-12-31', 19990),
  ('sub-3', 'tenant-3', 'plan-basic', 'active', 'monthly', '2024-12-01', '2024-12-31', 499),
  ('sub-4', 'tenant-4', 'plan-basic', 'expired', 'monthly', '2024-10-01', '2024-10-31', 499);

-- =====================================================
-- BRANCHES (Şubeler)
-- =====================================================
INSERT INTO branches (id, tenant_id, name, address, city, district, phone, email, is_main, is_active) VALUES
  -- Yıldız Spor Akademi şubeleri
  ('branch-1', 'tenant-1', 'Merkez Şube', 'Bağdat Caddesi No: 123', 'İstanbul', 'Kadıköy', '+90 216 555 1001', 'merkez@yildizsporakademi.com', true, true),
  ('branch-2', 'tenant-1', 'Beşiktaş Şube', 'Barbaros Bulvarı No: 45', 'İstanbul', 'Beşiktaş', '+90 212 555 1002', 'besiktas@yildizsporakademi.com', false, true),
  ('branch-3', 'tenant-1', 'Ataşehir Şube', 'Ataşehir Bulvarı No: 78', 'İstanbul', 'Ataşehir', '+90 216 555 1003', 'atasehir@yildizsporakademi.com', false, true),
  -- Fenerbahçe şubeleri
  ('branch-4', 'tenant-2', 'Kadıköy Merkez', 'Fenerbahçe Stadyumu Yanı', 'İstanbul', 'Kadıköy', '+90 216 555 4001', 'kadikoy@fenerspor.com', true, true),
  ('branch-5', 'tenant-2', 'Ümraniye Şube', 'Ümraniye Spor Kompleksi', 'İstanbul', 'Ümraniye', '+90 216 555 4002', 'umraniye@fenerspor.com', false, true),
  -- Kartal Spor
  ('branch-6', 'tenant-3', 'Kartal Merkez', 'Kartal Sahil Yolu No: 12', 'İstanbul', 'Kartal', '+90 216 555 7001', 'merkez@kartalspor.com', true, true),
  -- Deneme (Limited)
  ('branch-7', 'tenant-4', 'Deneme Şube', 'Test Sokak No: 1', 'İstanbul', 'Şişli', '+90 555 000 0001', 'deneme@denemespor.com', true, true);

-- =====================================================
-- USERS (Sistem Kullanıcıları)
-- =====================================================
INSERT INTO users (id, tenant_id, email, password_hash, full_name, phone, role, is_active) VALUES
  -- Super Admin (Platform yöneticisi)
  ('user-super-1', NULL, 'admin@sportmanager.com', '$2b$10$hashedpassword1', 'Platform Admin', '+90 555 000 0000', 'super_admin', true),
  -- Yıldız Spor Akademi kullanıcıları
  ('user-1', 'tenant-1', 'admin@yildizsporakademi.com', '$2b$10$hashedpassword2', 'Ahmet Yılmaz', '+90 532 111 2233', 'tenant_admin', true),
  ('user-2', 'tenant-1', 'manager@yildizsporakademi.com', '$2b$10$hashedpassword3', 'Fatma Demir', '+90 533 222 3344', 'branch_manager', true),
  -- Fenerbahçe kullanıcıları
  ('user-3', 'tenant-2', 'admin@fenerspor.com', '$2b$10$hashedpassword4', 'Mehmet Kaya', '+90 534 333 4455', 'tenant_admin', true),
  -- Kartal Spor
  ('user-4', 'tenant-3', 'admin@kartalspor.com', '$2b$10$hashedpassword5', 'Ali Özkan', '+90 535 444 5566', 'tenant_admin', true),
  -- Deneme
  ('user-5', 'tenant-4', 'admin@denemespor.com', '$2b$10$hashedpassword6', 'Test Kullanıcı', '+90 555 000 0001', 'tenant_admin', true);

-- =====================================================
-- INSTRUCTORS (Eğitmenler)
-- =====================================================
INSERT INTO instructors (id, tenant_id, user_id, full_name, phone, email, specialization, bio, photo_url, hourly_rate, status) VALUES
  -- Yıldız Spor Akademi eğitmenleri
  ('ins-1', 'tenant-1', NULL, 'Kemal Sunal', '+90 536 111 0001', 'kemal@yildizsporakademi.com', 'Futbol', 'UEFA B lisanslı antrenör, 10 yıllık deneyim', '/male-coach-portrait.jpg', 250, 'active'),
  ('ins-2', 'tenant-1', NULL, 'Ayşe Kara', '+90 536 111 0002', 'ayse@yildizsporakademi.com', 'Basketbol', 'Eski milli takım oyuncusu, 8 yıllık antrenörlük deneyimi', '/basketball-coach.png', 300, 'active'),
  ('ins-3', 'tenant-1', NULL, 'Deniz Yılmaz', '+90 536 111 0003', 'deniz@yildizsporakademi.com', 'Yüzme', 'Profesyonel yüzücü, 5 yıllık eğitmenlik', '/female-swimming-coach.jpg', 350, 'active'),
  ('ins-4', 'tenant-1', NULL, 'Burak Özdemir', '+90 536 111 0004', 'burak@yildizsporakademi.com', 'Tenis', 'ITF sertifikalı antrenör', '/tennis-coach-male.jpg', 400, 'active'),
  ('ins-5', 'tenant-1', NULL, 'Seda Aktaş', '+90 536 111 0005', 'seda@yildizsporakademi.com', 'Jimnastik', 'Ritmik jimnastik uzmanı', '/gymnastics-coach.jpg', 280, 'active'),
  -- Fenerbahçe eğitmenleri
  ('ins-6', 'tenant-2', NULL, 'Volkan Demirel', '+90 537 222 0001', 'volkan@fenerspor.com', 'Futbol', 'Eski profesyonel kaleci', '/male-coach-portrait.jpg', 500, 'active'),
  ('ins-7', 'tenant-2', NULL, 'Nihat Kahveci', '+90 537 222 0002', 'nihat@fenerspor.com', 'Futbol', 'Eski milli takım golcüsü', '/basketball-coach.png', 450, 'active'),
  ('ins-8', 'tenant-2', NULL, 'Işıl Alben', '+90 537 222 0003', 'isil@fenerspor.com', 'Basketbol', 'Eski milli takım kaptanı', '/female-swimming-coach.jpg', 400, 'active'),
  -- Kartal Spor
  ('ins-9', 'tenant-3', NULL, 'Murat Yıldırım', '+90 538 333 0001', 'murat@kartalspor.com', 'Futbol', '15 yıllık antrenörlük tecrübesi', '/male-coach-portrait.jpg', 200, 'active'),
  ('ins-10', 'tenant-3', NULL, 'Zeynep Güneş', '+90 538 333 0002', 'zeynep@kartalspor.com', 'Voleybol', 'Voleybol federasyonu antrenörü', '/basketball-coach.png', 220, 'active');

-- =====================================================
-- INSTRUCTOR CREDENTIALS (Eğitmen giriş bilgileri)
-- =====================================================
INSERT INTO instructor_credentials (instructor_id, username, password_hash, is_active) VALUES
  ('ins-1', 'kemal.sunal', '$2b$10$instructorhash1', true),
  ('ins-2', 'ayse.kara', '$2b$10$instructorhash2', true),
  ('ins-3', 'deniz.yilmaz', '$2b$10$instructorhash3', true),
  ('ins-4', 'burak.ozdemir', '$2b$10$instructorhash4', true),
  ('ins-5', 'seda.aktas', '$2b$10$instructorhash5', true),
  ('ins-6', 'volkan.demirel', '$2b$10$instructorhash6', true),
  ('ins-7', 'nihat.kahveci', '$2b$10$instructorhash7', true),
  ('ins-8', 'isil.alben', '$2b$10$instructorhash8', true),
  ('ins-9', 'murat.yildirim', '$2b$10$instructorhash9', true),
  ('ins-10', 'zeynep.gunes', '$2b$10$instructorhash10', true);

-- =====================================================
-- INSTRUCTOR BRANCHES
-- =====================================================
INSERT INTO instructor_branches (instructor_id, branch_id) VALUES
  ('ins-1', 'branch-1'), ('ins-1', 'branch-2'),
  ('ins-2', 'branch-1'),
  ('ins-3', 'branch-1'), ('ins-3', 'branch-3'),
  ('ins-4', 'branch-2'),
  ('ins-5', 'branch-3'),
  ('ins-6', 'branch-4'),
  ('ins-7', 'branch-4'), ('ins-7', 'branch-5'),
  ('ins-8', 'branch-4'),
  ('ins-9', 'branch-6'),
  ('ins-10', 'branch-6');

-- =====================================================
-- VENUES (Sahalar)
-- =====================================================
INSERT INTO venues (id, tenant_id, branch_id, name, type, capacity, hourly_rate, description, is_active) VALUES
  -- Yıldız Spor Akademi
  ('venue-1', 'tenant-1', 'branch-1', 'Ana Futbol Sahası', 'outdoor', 30, 500, 'FIFA standartlarında sentetik çim saha', true),
  ('venue-2', 'tenant-1', 'branch-1', 'Mini Saha', 'outdoor', 14, 300, '5v5 halı saha', true),
  ('venue-3', 'tenant-1', 'branch-1', 'Kapalı Spor Salonu', 'indoor', 50, 400, 'Basketbol, voleybol için uygun kapalı salon', true),
  ('venue-4', 'tenant-1', 'branch-1', 'Yüzme Havuzu', 'pool', 20, 600, '25 metre yarı olimpik havuz', true),
  ('venue-5', 'tenant-1', 'branch-2', 'Beşiktaş Saha', 'outdoor', 22, 450, 'Sentetik çim saha', true),
  ('venue-6', 'tenant-1', 'branch-3', 'Ataşehir Salon', 'indoor', 40, 350, 'Çok amaçlı spor salonu', true),
  -- Fenerbahçe
  ('venue-7', 'tenant-2', 'branch-4', 'Fenerbahçe Antrenman Sahası', 'outdoor', 40, 800, 'Profesyonel antrenman sahası', true),
  ('venue-8', 'tenant-2', 'branch-4', 'Basketbol Salonu', 'indoor', 30, 600, 'Klimali kapalı salon', true),
  ('venue-9', 'tenant-2', 'branch-5', 'Ümraniye Saha', 'outdoor', 30, 500, 'Sentetik saha', true),
  -- Kartal Spor
  ('venue-10', 'tenant-3', 'branch-6', 'Kartal Sahası', 'outdoor', 24, 300, 'Standart futbol sahası', true),
  ('venue-11', 'tenant-3', 'branch-6', 'Voleybol Salonu', 'indoor', 20, 250, 'Voleybol salonu', true);

-- =====================================================
-- GROUPS (Gruplar)
-- =====================================================
INSERT INTO groups (id, tenant_id, branch_id, name, sport_type, age_group, capacity, monthly_fee, instructor_id, schedule, status) VALUES
  -- Yıldız Spor Akademi grupları
  ('grp-1', 'tenant-1', 'branch-1', 'Minikler Futbol A', 'Futbol', '6-8 yaş', 20, 1500, 'ins-1', '{"monday": ["16:00-17:30"], "wednesday": ["16:00-17:30"], "friday": ["16:00-17:30"]}'::jsonb, 'active'),
  ('grp-2', 'tenant-1', 'branch-1', 'Minikler Futbol B', 'Futbol', '6-8 yaş', 20, 1500, 'ins-1', '{"monday": ["17:30-19:00"], "wednesday": ["17:30-19:00"], "friday": ["17:30-19:00"]}'::jsonb, 'active'),
  ('grp-3', 'tenant-1', 'branch-1', 'Yıldızlar Futbol', 'Futbol', '9-12 yaş', 18, 1800, 'ins-1', '{"tuesday": ["17:00-19:00"], "thursday": ["17:00-19:00"], "saturday": ["10:00-12:00"]}'::jsonb, 'active'),
  ('grp-4', 'tenant-1', 'branch-1', 'Minikler Basketbol', 'Basketbol', '7-10 yaş', 15, 1600, 'ins-2', '{"monday": ["17:00-18:30"], "wednesday": ["17:00-18:30"]}'::jsonb, 'active'),
  ('grp-5', 'tenant-1', 'branch-1', 'Gençler Basketbol', 'Basketbol', '13-16 yaş', 12, 2000, 'ins-2', '{"tuesday": ["18:00-20:00"], "thursday": ["18:00-20:00"], "saturday": ["14:00-16:00"]}'::jsonb, 'active'),
  ('grp-6', 'tenant-1', 'branch-1', 'Yüzme Başlangıç', 'Yüzme', '6-10 yaş', 10, 2200, 'ins-3', '{"monday": ["14:00-15:00"], "wednesday": ["14:00-15:00"], "saturday": ["09:00-10:00"]}'::jsonb, 'active'),
  ('grp-7', 'tenant-1', 'branch-1', 'Yüzme İleri', 'Yüzme', '10-14 yaş', 8, 2500, 'ins-3', '{"monday": ["15:00-16:30"], "wednesday": ["15:00-16:30"], "saturday": ["10:00-11:30"]}'::jsonb, 'active'),
  ('grp-8', 'tenant-1', 'branch-2', 'Beşiktaş Futbol', 'Futbol', '8-12 yaş', 20, 1700, 'ins-1', '{"tuesday": ["16:00-18:00"], "thursday": ["16:00-18:00"]}'::jsonb, 'active'),
  ('grp-9', 'tenant-1', 'branch-2', 'Tenis Başlangıç', 'Tenis', '8-14 yaş', 8, 2800, 'ins-4', '{"monday": ["15:00-16:30"], "wednesday": ["15:00-16:30"]}'::jsonb, 'active'),
  ('grp-10', 'tenant-1', 'branch-3', 'Ataşehir Jimnastik', 'Jimnastik', '5-10 yaş', 12, 1900, 'ins-5', '{"tuesday": ["16:00-17:30"], "thursday": ["16:00-17:30"], "saturday": ["11:00-12:30"]}'::jsonb, 'active'),
  -- Fenerbahçe grupları
  ('grp-11', 'tenant-2', 'branch-4', 'FB Minikler Futbol', 'Futbol', '6-8 yaş', 25, 2500, 'ins-6', '{"monday": ["15:00-17:00"], "wednesday": ["15:00-17:00"], "friday": ["15:00-17:00"]}'::jsonb, 'active'),
  ('grp-12', 'tenant-2', 'branch-4', 'FB Yıldızlar Futbol', 'Futbol', '9-12 yaş', 22, 2800, 'ins-7', '{"tuesday": ["16:00-18:00"], "thursday": ["16:00-18:00"], "saturday": ["09:00-11:00"]}'::jsonb, 'active'),
  ('grp-13', 'tenant-2', 'branch-4', 'FB Basketbol', 'Basketbol', '10-14 yaş', 15, 2600, 'ins-8', '{"monday": ["17:00-19:00"], "wednesday": ["17:00-19:00"]}'::jsonb, 'active'),
  ('grp-14', 'tenant-2', 'branch-5', 'FB Ümraniye Futbol', 'Futbol', '7-11 yaş', 20, 2200, 'ins-7', '{"monday": ["16:00-18:00"], "friday": ["16:00-18:00"]}'::jsonb, 'active'),
  -- Kartal Spor grupları
  ('grp-15', 'tenant-3', 'branch-6', 'Kartal Futbol', 'Futbol', '8-14 yaş', 18, 1200, 'ins-9', '{"tuesday": ["17:00-19:00"], "thursday": ["17:00-19:00"]}'::jsonb, 'active'),
  ('grp-16', 'tenant-3', 'branch-6', 'Kartal Voleybol', 'Voleybol', '10-15 yaş', 14, 1100, 'ins-10', '{"monday": ["18:00-20:00"], "wednesday": ["18:00-20:00"]}'::jsonb, 'active');

-- =====================================================
-- STUDENTS (Öğrenciler) - 100+ öğrenci
-- =====================================================
INSERT INTO students (id, tenant_id, branch_id, student_no, full_name, birth_date, gender, phone, email, status, registration_date, photo_url) VALUES
  -- Yıldız Spor Akademi öğrencileri (60 öğrenci)
  ('std-1', 'tenant-1', 'branch-1', '2024-001', 'Arda Güler', '2015-03-15', 'male', '+90 530 001 0001', 'arda.guler@email.com', 'active', '2024-01-15', '/young-boy-athlete.jpg'),
  ('std-2', 'tenant-1', 'branch-1', '2024-002', 'Kerem Aktürkoğlu', '2014-07-22', 'male', '+90 530 001 0002', 'kerem.a@email.com', 'active', '2024-01-20', '/young-boy-athlete.jpg'),
  ('std-3', 'tenant-1', 'branch-1', '2024-003', 'Zeynep Yılmaz', '2015-11-08', 'female', '+90 530 001 0003', 'zeynep.y@email.com', 'active', '2024-02-01', '/young-girl-athlete.jpg'),
  ('std-4', 'tenant-1', 'branch-1', '2024-004', 'Mehmet Kaya', '2013-05-30', 'male', '+90 530 001 0004', 'mehmet.k@email.com', 'active', '2024-02-10', '/teenage-boy-sports.jpg'),
  ('std-5', 'tenant-1', 'branch-1', '2024-005', 'Elif Demir', '2016-01-25', 'female', '+90 530 001 0005', 'elif.d@email.com', 'active', '2024-02-15', '/young-girl-athlete.jpg'),
  ('std-6', 'tenant-1', 'branch-1', '2024-006', 'Can Özkan', '2015-09-12', 'male', '+90 530 001 0006', 'can.o@email.com', 'active', '2024-03-01', '/young-boy-athlete.jpg'),
  ('std-7', 'tenant-1', 'branch-1', '2024-007', 'Selin Arslan', '2014-04-18', 'female', '+90 530 001 0007', 'selin.a@email.com', 'active', '2024-03-05', '/young-girl-athlete.jpg'),
  ('std-8', 'tenant-1', 'branch-1', '2024-008', 'Burak Şahin', '2013-12-03', 'male', '+90 530 001 0008', 'burak.s@email.com', 'active', '2024-03-10', '/teenage-boy-sports.jpg'),
  ('std-9', 'tenant-1', 'branch-1', '2024-009', 'Ayşe Çelik', '2015-06-28', 'female', '+90 530 001 0009', 'ayse.c@email.com', 'active', '2024-03-15', '/young-girl-athlete.jpg'),
  ('std-10', 'tenant-1', 'branch-1', '2024-010', 'Emre Yıldız', '2014-08-14', 'male', '+90 530 001 0010', 'emre.y@email.com', 'active', '2024-03-20', '/young-boy-athlete.jpg'),
  ('std-11', 'tenant-1', 'branch-1', '2024-011', 'Deniz Kara', '2016-02-19', 'female', '+90 530 001 0011', 'deniz.k@email.com', 'active', '2024-04-01', '/young-girl-athlete.jpg'),
  ('std-12', 'tenant-1', 'branch-1', '2024-012', 'Yusuf Aydın', '2015-10-05', 'male', '+90 530 001 0012', 'yusuf.a@email.com', 'active', '2024-04-05', '/young-boy-athlete.jpg'),
  ('std-13', 'tenant-1', 'branch-1', '2024-013', 'Meryem Güneş', '2014-03-11', 'female', '+90 530 001 0013', 'meryem.g@email.com', 'active', '2024-04-10', '/young-girl-athlete.jpg'),
  ('std-14', 'tenant-1', 'branch-1', '2024-014', 'Ali Koç', '2013-07-27', 'male', '+90 530 001 0014', 'ali.k@email.com', 'active', '2024-04-15', '/teenage-boy-sports.jpg'),
  ('std-15', 'tenant-1', 'branch-1', '2024-015', 'Fatma Öztürk', '2015-01-08', 'female', '+90 530 001 0015', 'fatma.o@email.com', 'active', '2024-04-20', '/young-girl-athlete.jpg'),
  ('std-16', 'tenant-1', 'branch-1', '2024-016', 'Mustafa Eren', '2014-11-22', 'male', '+90 530 001 0016', 'mustafa.e@email.com', 'active', '2024-05-01', '/young-boy-athlete.jpg'),
  ('std-17', 'tenant-1', 'branch-1', '2024-017', 'Ceren Aksoy', '2015-05-16', 'female', '+90 530 001 0017', 'ceren.a@email.com', 'active', '2024-05-05', '/young-girl-athlete.jpg'),
  ('std-18', 'tenant-1', 'branch-1', '2024-018', 'Oğuz Polat', '2013-09-29', 'male', '+90 530 001 0018', 'oguz.p@email.com', 'active', '2024-05-10', '/teenage-boy-sports.jpg'),
  ('std-19', 'tenant-1', 'branch-1', '2024-019', 'İrem Yalçın', '2016-04-03', 'female', '+90 530 001 0019', 'irem.y@email.com', 'active', '2024-05-15', '/young-girl-athlete.jpg'),
  ('std-20', 'tenant-1', 'branch-1', '2024-020', 'Berk Tunç', '2014-12-17', 'male', '+90 530 001 0020', 'berk.t@email.com', 'active', '2024-05-20', '/young-boy-athlete.jpg'),
  -- Beşiktaş Şube öğrencileri
  ('std-21', 'tenant-1', 'branch-2', '2024-021', 'Efe Karaca', '2015-02-14', 'male', '+90 530 002 0001', 'efe.k@email.com', 'active', '2024-03-01', '/young-boy-athlete.jpg'),
  ('std-22', 'tenant-1', 'branch-2', '2024-022', 'Ela Şen', '2014-06-08', 'female', '+90 530 002 0002', 'ela.s@email.com', 'active', '2024-03-15', '/young-girl-athlete.jpg'),
  ('std-23', 'tenant-1', 'branch-2', '2024-023', 'Kaan Yılmaz', '2013-10-21', 'male', '+90 530 002 0003', 'kaan.y@email.com', 'active', '2024-04-01', '/teenage-boy-sports.jpg'),
  ('std-24', 'tenant-1', 'branch-2', '2024-024', 'Su Arslan', '2015-08-05', 'female', '+90 530 002 0004', 'su.a@email.com', 'active', '2024-04-15', '/young-girl-athlete.jpg'),
  ('std-25', 'tenant-1', 'branch-2', '2024-025', 'Doruk Özdemir', '2014-01-30', 'male', '+90 530 002 0005', 'doruk.o@email.com', 'active', '2024-05-01', '/young-boy-athlete.jpg'),
  ('std-26', 'tenant-1', 'branch-2', '2024-026', 'Defne Kaya', '2016-03-24', 'female', '+90 530 002 0006', 'defne.k@email.com', 'active', '2024-05-15', '/young-girl-athlete.jpg'),
  ('std-27', 'tenant-1', 'branch-2', '2024-027', 'Çınar Demir', '2013-07-18', 'male', '+90 530 002 0007', 'cinar.d@email.com', 'active', '2024-06-01', '/teenage-boy-sports.jpg'),
  ('std-28', 'tenant-1', 'branch-2', '2024-028', 'Ada Çetin', '2015-11-12', 'female', '+90 530 002 0008', 'ada.c@email.com', 'active', '2024-06-15', '/young-girl-athlete.jpg'),
  -- Ataşehir Şube öğrencileri
  ('std-29', 'tenant-1', 'branch-3', '2024-029', 'Mira Güler', '2017-01-06', 'female', '+90 530 003 0001', 'mira.g@email.com', 'active', '2024-04-01', '/young-girl-athlete.jpg'),
  ('std-30', 'tenant-1', 'branch-3', '2024-030', 'Rüzgar Tekin', '2016-05-20', 'male', '+90 530 003 0002', 'ruzgar.t@email.com', 'active', '2024-04-15', '/young-boy-athlete.jpg'),
  ('std-31', 'tenant-1', 'branch-3', '2024-031', 'Nil Acar', '2017-09-14', 'female', '+90 530 003 0003', 'nil.a@email.com', 'active', '2024-05-01', '/young-girl-athlete.jpg'),
  ('std-32', 'tenant-1', 'branch-3', '2024-032', 'Atlas Yıldırım', '2016-02-28', 'male', '+90 530 003 0004', 'atlas.y@email.com', 'active', '2024-05-15', '/young-boy-athlete.jpg'),
  -- Pasif öğrenciler
  ('std-33', 'tenant-1', 'branch-1', '2024-033', 'Onur Şimşek', '2014-04-09', 'male', '+90 530 001 0033', 'onur.s@email.com', 'passive', '2024-01-15', '/teenage-boy-sports.jpg'),
  ('std-34', 'tenant-1', 'branch-1', '2024-034', 'Lara Aydoğdu', '2015-08-23', 'female', '+90 530 001 0034', 'lara.a@email.com', 'passive', '2024-02-01', '/young-girl-athlete.jpg'),
  -- Fenerbahçe öğrencileri (30 öğrenci)
  ('std-35', 'tenant-2', 'branch-4', 'FB-001', 'Aras Bulut', '2016-02-11', 'male', '+90 531 001 0001', 'aras.b@email.com', 'active', '2024-01-10', '/young-boy-athlete.jpg'),
  ('std-36', 'tenant-2', 'branch-4', 'FB-002', 'Nehir Deniz', '2015-06-25', 'female', '+90 531 001 0002', 'nehir.d@email.com', 'active', '2024-01-15', '/young-girl-athlete.jpg'),
  ('std-37', 'tenant-2', 'branch-4', 'FB-003', 'Alp Kaplan', '2014-10-09', 'male', '+90 531 001 0003', 'alp.k@email.com', 'active', '2024-01-20', '/young-boy-athlete.jpg'),
  ('std-38', 'tenant-2', 'branch-4', 'FB-004', 'Maya Tan', '2015-03-03', 'female', '+90 531 001 0004', 'maya.t@email.com', 'active', '2024-02-01', '/young-girl-athlete.jpg'),
  ('std-39', 'tenant-2', 'branch-4', 'FB-005', 'Aslan Kurt', '2013-07-17', 'male', '+90 531 001 0005', 'aslan.k@email.com', 'active', '2024-02-10', '/teenage-boy-sports.jpg'),
  ('std-40', 'tenant-2', 'branch-4', 'FB-006', 'Lina Çakır', '2016-11-01', 'female', '+90 531 001 0006', 'lina.c@email.com', 'active', '2024-02-15', '/young-girl-athlete.jpg'),
  ('std-41', 'tenant-2', 'branch-4', 'FB-007', 'Toprak Yaman', '2015-04-25', 'male', '+90 531 001 0007', 'toprak.y@email.com', 'active', '2024-03-01', '/young-boy-athlete.jpg'),
  ('std-42', 'tenant-2', 'branch-4', 'FB-008', 'Azra Koç', '2014-08-19', 'female', '+90 531 001 0008', 'azra.k@email.com', 'active', '2024-03-05', '/young-girl-athlete.jpg'),
  ('std-43', 'tenant-2', 'branch-4', 'FB-009', 'Poyraz Eren', '2013-12-13', 'male', '+90 531 001 0009', 'poyraz.e@email.com', 'active', '2024-03-10', '/teenage-boy-sports.jpg'),
  ('std-44', 'tenant-2', 'branch-4', 'FB-010', 'Duru Sönmez', '2015-01-07', 'female', '+90 531 001 0010', 'duru.s@email.com', 'active', '2024-03-15', '/young-girl-athlete.jpg'),
  ('std-45', 'tenant-2', 'branch-5', 'FB-011', 'Eymen Polat', '2016-05-21', 'male', '+90 531 002 0001', 'eymen.p@email.com', 'active', '2024-04-01', '/young-boy-athlete.jpg'),
  ('std-46', 'tenant-2', 'branch-5', 'FB-012', 'Asya Güneş', '2015-09-15', 'female', '+90 531 002 0002', 'asya.g@email.com', 'active', '2024-04-10', '/young-girl-athlete.jpg'),
  ('std-47', 'tenant-2', 'branch-5', 'FB-013', 'Çağan Yıldız', '2014-01-29', 'male', '+90 531 002 0003', 'cagan.y@email.com', 'active', '2024-04-15', '/young-boy-athlete.jpg'),
  ('std-48', 'tenant-2', 'branch-5', 'FB-014', 'Zehra Aksoy', '2016-06-03', 'female', '+90 531 002 0004', 'zehra.a@email.com', 'active', '2024-05-01', '/young-girl-athlete.jpg'),
  -- Kartal Spor öğrencileri (15 öğrenci)
  ('std-49', 'tenant-3', 'branch-6', 'KS-001', 'Eren Çelik', '2014-03-17', 'male', '+90 532 001 0001', 'eren.c@email.com', 'active', '2024-02-01', '/young-boy-athlete.jpg'),
  ('std-50', 'tenant-3', 'branch-6', 'KS-002', 'Yağmur Öztürk', '2015-07-11', 'female', '+90 532 001 0002', 'yagmur.o@email.com', 'active', '2024-02-10', '/young-girl-athlete.jpg'),
  ('std-51', 'tenant-3', 'branch-6', 'KS-003', 'Barış Şahin', '2013-11-05', 'male', '+90 532 001 0003', 'baris.s@email.com', 'active', '2024-02-20', '/teenage-boy-sports.jpg'),
  ('std-52', 'tenant-3', 'branch-6', 'KS-004', 'Melis Kara', '2014-02-28', 'female', '+90 532 001 0004', 'melis.k@email.com', 'active', '2024-03-01', '/young-girl-athlete.jpg'),
  ('std-53', 'tenant-3', 'branch-6', 'KS-005', 'Umut Aydın', '2015-06-22', 'male', '+90 532 001 0005', 'umut.a@email.com', 'active', '2024-03-15', '/young-boy-athlete.jpg'),
  ('std-54', 'tenant-3', 'branch-6', 'KS-006', 'Beren Yılmaz', '2014-10-16', 'female', '+90 532 001 0006', 'beren.y@email.com', 'active', '2024-04-01', '/young-girl-athlete.jpg'),
  ('std-55', 'tenant-3', 'branch-6', 'KS-007', 'Koray Demir', '2013-01-10', 'male', '+90 532 001 0007', 'koray.d@email.com', 'active', '2024-04-15', '/teenage-boy-sports.jpg'),
  ('std-56', 'tenant-3', 'branch-6', 'KS-008', 'Simge Arslan', '2015-05-04', 'female', '+90 532 001 0008', 'simge.a@email.com', 'active', '2024-05-01', '/young-girl-athlete.jpg');

-- =====================================================
-- STUDENT GROUPS (Öğrenci-Grup İlişkileri)
-- =====================================================
INSERT INTO student_groups (student_id, group_id, joined_at, status) VALUES
  -- Minikler Futbol A
  ('std-1', 'grp-1', '2024-01-15', 'active'),
  ('std-5', 'grp-1', '2024-02-15', 'active'),
  ('std-6', 'grp-1', '2024-03-01', 'active'),
  ('std-9', 'grp-1', '2024-03-15', 'active'),
  ('std-11', 'grp-1', '2024-04-01', 'active'),
  ('std-12', 'grp-1', '2024-04-05', 'active'),
  -- Minikler Futbol B
  ('std-2', 'grp-2', '2024-01-20', 'active'),
  ('std-3', 'grp-2', '2024-02-01', 'active'),
  ('std-15', 'grp-2', '2024-04-20', 'active'),
  ('std-16', 'grp-2', '2024-05-01', 'active'),
  ('std-17', 'grp-2', '2024-05-05', 'active'),
  -- Yıldızlar Futbol
  ('std-4', 'grp-3', '2024-02-10', 'active'),
  ('std-8', 'grp-3', '2024-03-10', 'active'),
  ('std-14', 'grp-3', '2024-04-15', 'active'),
  ('std-18', 'grp-3', '2024-05-10', 'active'),
  -- Minikler Basketbol
  ('std-7', 'grp-4', '2024-03-05', 'active'),
  ('std-10', 'grp-4', '2024-03-20', 'active'),
  ('std-13', 'grp-4', '2024-04-10', 'active'),
  ('std-19', 'grp-4', '2024-05-15', 'active'),
  -- Gençler Basketbol
  ('std-20', 'grp-5', '2024-05-20', 'active'),
  -- Yüzme Başlangıç
  ('std-29', 'grp-6', '2024-04-01', 'active'),
  ('std-30', 'grp-6', '2024-04-15', 'active'),
  ('std-31', 'grp-6', '2024-05-01', 'active'),
  ('std-32', 'grp-6', '2024-05-15', 'active'),
  -- Beşiktaş Futbol
  ('std-21', 'grp-8', '2024-03-01', 'active'),
  ('std-22', 'grp-8', '2024-03-15', 'active'),
  ('std-23', 'grp-8', '2024-04-01', 'active'),
  ('std-24', 'grp-8', '2024-04-15', 'active'),
  ('std-25', 'grp-8', '2024-05-01', 'active'),
  ('std-26', 'grp-8', '2024-05-15', 'active'),
  ('std-27', 'grp-8', '2024-06-01', 'active'),
  ('std-28', 'grp-8', '2024-06-15', 'active'),
  -- Tenis Başlangıç
  ('std-22', 'grp-9', '2024-03-15', 'active'),
  ('std-24', 'grp-9', '2024-04-15', 'active'),
  -- Ataşehir Jimnastik
  ('std-29', 'grp-10', '2024-04-01', 'active'),
  ('std-31', 'grp-10', '2024-05-01', 'active'),
  -- Fenerbahçe grupları
  ('std-35', 'grp-11', '2024-01-10', 'active'),
  ('std-36', 'grp-11', '2024-01-15', 'active'),
  ('std-40', 'grp-11', '2024-02-15', 'active'),
  ('std-41', 'grp-11', '2024-03-01', 'active'),
  ('std-37', 'grp-12', '2024-01-20', 'active'),
  ('std-38', 'grp-12', '2024-02-01', 'active'),
  ('std-42', 'grp-12', '2024-03-05', 'active'),
  ('std-43', 'grp-12', '2024-03-10', 'active'),
  ('std-39', 'grp-13', '2024-02-10', 'active'),
  ('std-44', 'grp-13', '2024-03-15', 'active'),
  ('std-45', 'grp-14', '2024-04-01', 'active'),
  ('std-46', 'grp-14', '2024-04-10', 'active'),
  ('std-47', 'grp-14', '2024-04-15', 'active'),
  ('std-48', 'grp-14', '2024-05-01', 'active'),
  -- Kartal Spor grupları
  ('std-49', 'grp-15', '2024-02-01', 'active'),
  ('std-51', 'grp-15', '2024-02-20', 'active'),
  ('std-53', 'grp-15', '2024-03-15', 'active'),
  ('std-55', 'grp-15', '2024-04-15', 'active'),
  ('std-50', 'grp-16', '2024-02-10', 'active'),
  ('std-52', 'grp-16', '2024-03-01', 'active'),
  ('std-54', 'grp-16', '2024-04-01', 'active'),
  ('std-56', 'grp-16', '2024-05-01', 'active');

-- =====================================================
-- STUDENT GUARDIANS (Veli Bilgileri)
-- =====================================================
INSERT INTO student_guardians (student_id, full_name, relationship, phone, email, occupation, is_primary) VALUES
  ('std-1', 'Selçuk Güler', 'father', '+90 530 001 1001', 'selcuk.guler@email.com', 'Mühendis', true),
  ('std-1', 'Aylin Güler', 'mother', '+90 530 001 1002', 'aylin.guler@email.com', 'Öğretmen', false),
  ('std-2', 'Hakan Aktürkoğlu', 'father', '+90 530 001 2001', 'hakan.a@email.com', 'Doktor', true),
  ('std-3', 'Nermin Yılmaz', 'mother', '+90 530 001 3001', 'nermin.y@email.com', 'Avukat', true),
  ('std-4', 'Osman Kaya', 'father', '+90 530 001 4001', 'osman.k@email.com', 'İş Adamı', true),
  ('std-5', 'Gül Demir', 'mother', '+90 530 001 5001', 'gul.d@email.com', 'Hemşire', true);

-- =====================================================
-- PAYMENT PLANS
-- =====================================================
INSERT INTO payment_plans (id, tenant_id, name, description, amount, period, is_active) VALUES
  ('pp-1', 'tenant-1', 'Standart Aylık', 'Aylık aidat planı', 1500, 'monthly', true),
  ('pp-2', 'tenant-1', 'Premium Aylık', 'Premium aylık plan', 2000, 'monthly', true),
  ('pp-3', 'tenant-1', 'Yıllık Plan', '12 aylık ödeme', 15000, 'yearly', true),
  ('pp-4', 'tenant-2', 'FB Standart', 'Fenerbahçe standart plan', 2500, 'monthly', true),
  ('pp-5', 'tenant-2', 'FB Premium', 'Fenerbahçe premium plan', 3000, 'monthly', true),
  ('pp-6', 'tenant-3', 'Kartal Aylık', 'Kartal Spor aylık plan', 1200, 'monthly', true);

-- =====================================================
-- MONTHLY DUES (Aylık Aidatlar) - Son 3 ay
-- =====================================================
INSERT INTO monthly_dues (id, tenant_id, student_id, due_month, amount, paid_amount, due_date, status, paid_at) VALUES
  -- Ekim 2024
  ('due-oct-1', 'tenant-1', 'std-1', '2024-10-01', 1500, 1500, '2024-10-15', 'paid', '2024-10-10'),
  ('due-oct-2', 'tenant-1', 'std-2', '2024-10-01', 1500, 1500, '2024-10-15', 'paid', '2024-10-12'),
  ('due-oct-3', 'tenant-1', 'std-3', '2024-10-01', 1500, 1500, '2024-10-15', 'paid', '2024-10-08'),
  ('due-oct-4', 'tenant-1', 'std-4', '2024-10-01', 1800, 1800, '2024-10-15', 'paid', '2024-10-14'),
  ('due-oct-5', 'tenant-1', 'std-5', '2024-10-01', 1500, 1500, '2024-10-15', 'paid', '2024-10-11'),
  -- Kasım 2024
  ('due-nov-1', 'tenant-1', 'std-1', '2024-11-01', 1500, 1500, '2024-11-15', 'paid', '2024-11-10'),
  ('due-nov-2', 'tenant-1', 'std-2', '2024-11-01', 1500, 1500, '2024-11-15', 'paid', '2024-11-12'),
  ('due-nov-3', 'tenant-1', 'std-3', '2024-11-01', 1500, 1500, '2024-11-15', 'paid', '2024-11-08'),
  ('due-nov-4', 'tenant-1', 'std-4', '2024-11-01', 1800, 1800, '2024-11-15', 'paid', '2024-11-14'),
  ('due-nov-5', 'tenant-1', 'std-5', '2024-11-01', 1500, 0, '2024-11-15', 'overdue', NULL),
  ('due-nov-6', 'tenant-1', 'std-6', '2024-11-01', 1500, 750, '2024-11-15', 'partial', NULL),
  -- Aralık 2024
  ('due-dec-1', 'tenant-1', 'std-1', '2024-12-01', 1500, 1500, '2024-12-15', 'paid', '2024-12-05'),
  ('due-dec-2', 'tenant-1', 'std-2', '2024-12-01', 1500, 0, '2024-12-15', 'pending', NULL),
  ('due-dec-3', 'tenant-1', 'std-3', '2024-12-01', 1500, 0, '2024-12-15', 'pending', NULL),
  ('due-dec-4', 'tenant-1', 'std-4', '2024-12-01', 1800, 900, '2024-12-15', 'partial', NULL),
  ('due-dec-5', 'tenant-1', 'std-5', '2024-12-01', 1500, 0, '2024-12-15', 'pending', NULL),
  ('due-dec-6', 'tenant-1', 'std-6', '2024-12-01', 1500, 0, '2024-12-15', 'pending', NULL),
  ('due-dec-7', 'tenant-1', 'std-7', '2024-12-01', 1600, 1600, '2024-12-15', 'paid', '2024-12-03'),
  ('due-dec-8', 'tenant-1', 'std-8', '2024-12-01', 1800, 0, '2024-12-10', 'overdue', NULL),
  ('due-dec-9', 'tenant-1', 'std-9', '2024-12-01', 1500, 0, '2024-12-15', 'pending', NULL),
  ('due-dec-10', 'tenant-1', 'std-10', '2024-12-01', 1600, 0, '2024-12-15', 'pending', NULL),
  -- Fenerbahçe aidatları
  ('due-fb-1', 'tenant-2', 'std-35', '2024-12-01', 2500, 2500, '2024-12-15', 'paid', '2024-12-02'),
  ('due-fb-2', 'tenant-2', 'std-36', '2024-12-01', 2500, 0, '2024-12-15', 'pending', NULL),
  ('due-fb-3', 'tenant-2', 'std-37', '2024-12-01', 2800, 2800, '2024-12-15', 'paid', '2024-12-05'),
  ('due-fb-4', 'tenant-2', 'std-38', '2024-12-01', 2800, 0, '2024-12-15', 'pending', NULL),
  -- Kartal Spor aidatları
  ('due-ks-1', 'tenant-3', 'std-49', '2024-12-01', 1200, 1200, '2024-12-15', 'paid', '2024-12-01'),
  ('due-ks-2', 'tenant-3', 'std-50', '2024-12-01', 1100, 0, '2024-12-15', 'pending', NULL),
  ('due-ks-3', 'tenant-3', 'std-51', '2024-12-01', 1200, 0, '2024-12-10', 'overdue', NULL);

-- =====================================================
-- PAYMENTS (Ödeme İşlemleri)
-- =====================================================
INSERT INTO payments (id, tenant_id, branch_id, student_id, monthly_due_id, amount, payment_type, payment_method, description, payment_date) VALUES
  -- Ekim ödemeleri
  ('pay-oct-1', 'tenant-1', 'branch-1', 'std-1', 'due-oct-1', 1500, 'dues', 'credit_card', 'Ekim 2024 aidatı', '2024-10-10'),
  ('pay-oct-2', 'tenant-1', 'branch-1', 'std-2', 'due-oct-2', 1500, 'dues', 'cash', 'Ekim 2024 aidatı', '2024-10-12'),
  ('pay-oct-3', 'tenant-1', 'branch-1', 'std-3', 'due-oct-3', 1500, 'dues', 'bank_transfer', 'Ekim 2024 aidatı', '2024-10-08'),
  -- Kasım ödemeleri
  ('pay-nov-1', 'tenant-1', 'branch-1', 'std-1', 'due-nov-1', 1500, 'dues', 'credit_card', 'Kasım 2024 aidatı', '2024-11-10'),
  ('pay-nov-2', 'tenant-1', 'branch-1', 'std-2', 'due-nov-2', 1500, 'dues', 'cash', 'Kasım 2024 aidatı', '2024-11-12'),
  ('pay-nov-6', 'tenant-1', 'branch-1', 'std-6', 'due-nov-6', 750, 'dues', 'cash', 'Kasım 2024 kısmi ödeme', '2024-11-20'),
  -- Aralık ödemeleri
  ('pay-dec-1', 'tenant-1', 'branch-1', 'std-1', 'due-dec-1', 1500, 'dues', 'credit_card', 'Aralık 2024 aidatı', '2024-12-05'),
  ('pay-dec-4', 'tenant-1', 'branch-1', 'std-4', 'due-dec-4', 900, 'dues', 'cash', 'Aralık 2024 kısmi ödeme', '2024-12-08'),
  ('pay-dec-7', 'tenant-1', 'branch-1', 'std-7', 'due-dec-7', 1600, 'dues', 'bank_transfer', 'Aralık 2024 aidatı', '2024-12-03'),
  -- Fenerbahçe ödemeleri
  ('pay-fb-1', 'tenant-2', 'branch-4', 'std-35', 'due-fb-1', 2500, 'dues', 'credit_card', 'Aralık 2024 aidatı', '2024-12-02'),
  ('pay-fb-3', 'tenant-2', 'branch-4', 'std-37', 'due-fb-3', 2800, 'dues', 'credit_card', 'Aralık 2024 aidatı', '2024-12-05'),
  -- Kartal Spor ödemeleri
  ('pay-ks-1', 'tenant-3', 'branch-6', 'std-49', 'due-ks-1', 1200, 'dues', 'cash', 'Aralık 2024 aidatı', '2024-12-01');

-- =====================================================
-- TRAININGS (Antrenmanlar) - Bu hafta
-- =====================================================
INSERT INTO trainings (id, tenant_id, branch_id, group_id, instructor_id, venue_id, title, training_date, start_time, end_time, status) VALUES
  -- Pazartesi
  ('trn-1', 'tenant-1', 'branch-1', 'grp-1', 'ins-1', 'venue-1', 'Minikler Futbol A Antrenmanı', '2024-12-09', '16:00', '17:30', 'scheduled'),
  ('trn-2', 'tenant-1', 'branch-1', 'grp-2', 'ins-1', 'venue-1', 'Minikler Futbol B Antrenmanı', '2024-12-09', '17:30', '19:00', 'scheduled'),
  ('trn-3', 'tenant-1', 'branch-1', 'grp-4', 'ins-2', 'venue-3', 'Minikler Basketbol Antrenmanı', '2024-12-09', '17:00', '18:30', 'scheduled'),
  ('trn-4', 'tenant-1', 'branch-1', 'grp-6', 'ins-3', 'venue-4', 'Yüzme Başlangıç Dersi', '2024-12-09', '14:00', '15:00', 'scheduled'),
  ('trn-5', 'tenant-1', 'branch-1', 'grp-7', 'ins-3', 'venue-4', 'Yüzme İleri Dersi', '2024-12-09', '15:00', '16:30', 'scheduled'),
  ('trn-6', 'tenant-1', 'branch-2', 'grp-9', 'ins-4', 'venue-5', 'Tenis Başlangıç Dersi', '2024-12-09', '15:00', '16:30', 'scheduled'),
  -- Salı
  ('trn-7', 'tenant-1', 'branch-1', 'grp-3', 'ins-1', 'venue-1', 'Yıldızlar Futbol Antrenmanı', '2024-12-10', '17:00', '19:00', 'scheduled'),
  ('trn-8', 'tenant-1', 'branch-1', 'grp-5', 'ins-2', 'venue-3', 'Gençler Basketbol Antrenmanı', '2024-12-10', '18:00', '20:00', 'scheduled'),
  ('trn-9', 'tenant-1', 'branch-2', 'grp-8', 'ins-1', 'venue-5', 'Beşiktaş Futbol Antrenmanı', '2024-12-10', '16:00', '18:00', 'scheduled'),
  ('trn-10', 'tenant-1', 'branch-3', 'grp-10', 'ins-5', 'venue-6', 'Ataşehir Jimnastik Dersi', '2024-12-10', '16:00', '17:30', 'scheduled'),
  -- Fenerbahçe antrenmanları
  ('trn-11', 'tenant-2', 'branch-4', 'grp-11', 'ins-6', 'venue-7', 'FB Minikler Futbol', '2024-12-09', '15:00', '17:00', 'scheduled'),
  ('trn-12', 'tenant-2', 'branch-4', 'grp-13', 'ins-8', 'venue-8', 'FB Basketbol', '2024-12-09', '17:00', '19:00', 'scheduled'),
  ('trn-13', 'tenant-2', 'branch-4', 'grp-12', 'ins-7', 'venue-7', 'FB Yıldızlar Futbol', '2024-12-10', '16:00', '18:00', 'scheduled'),
  -- Kartal Spor antrenmanları
  ('trn-14', 'tenant-3', 'branch-6', 'grp-15', 'ins-9', 'venue-10', 'Kartal Futbol', '2024-12-10', '17:00', '19:00', 'scheduled'),
  ('trn-15', 'tenant-3', 'branch-6', 'grp-16', 'ins-10', 'venue-11', 'Kartal Voleybol', '2024-12-09', '18:00', '20:00', 'scheduled');

-- =====================================================
-- ATTENDANCE (Yoklama) - Geçmiş antrenmanlar için
-- =====================================================
INSERT INTO attendance (training_id, student_id, status, notes) VALUES
  -- Geçmiş bir antrenman için örnek yoklama
  ('trn-1', 'std-1', 'present', NULL),
  ('trn-1', 'std-5', 'present', NULL),
  ('trn-1', 'std-6', 'late', '10 dk geç geldi'),
  ('trn-1', 'std-9', 'absent', 'Hasta'),
  ('trn-1', 'std-11', 'present', NULL),
  ('trn-1', 'std-12', 'excused', 'İzinli');

-- =====================================================
-- APPLICATIONS (Başvurular)
-- =====================================================
INSERT INTO applications (id, tenant_id, branch_id, full_name, birth_date, phone, guardian_name, guardian_phone, preferred_group_id, message, status, created_at) VALUES
  ('app-1', 'tenant-1', 'branch-1', 'Yusuf Akın', '2016-08-20', '+90 540 001 0001', 'Mehmet Akın', '+90 540 001 0002', 'grp-1', 'Futbola çok ilgili', 'pending', '2024-12-08 10:00:00'),
  ('app-2', 'tenant-1', 'branch-1', 'Elif Sarı', '2015-04-15', '+90 540 002 0001', 'Ayşe Sarı', '+90 540 002 0002', 'grp-4', 'Basketbol oynamak istiyor', 'pending', '2024-12-07 14:30:00'),
  ('app-3', 'tenant-1', 'branch-1', 'Can Özdemir', '2017-01-10', '+90 540 003 0001', 'Ali Özdemir', '+90 540 003 0002', 'grp-6', NULL, 'contacted', '2024-12-06 09:00:00'),
  ('app-4', 'tenant-1', 'branch-2', 'Sude Kaya', '2014-09-25', '+90 540 004 0001', 'Fatma Kaya', '+90 540 004 0002', 'grp-8', 'Daha önce futbol oynadı', 'approved', '2024-12-05 11:00:00'),
  ('app-5', 'tenant-2', 'branch-4', 'Mert Yılmaz', '2015-06-12', '+90 541 001 0001', 'Hakan Yılmaz', '+90 541 001 0002', 'grp-11', 'Fenerbahçeli, takıma katılmak istiyor', 'pending', '2024-12-08 15:00:00'),
  ('app-6', 'tenant-3', 'branch-6', 'Ece Demir', '2014-03-08', '+90 542 001 0001', 'Selim Demir', '+90 542 001 0002', 'grp-16', NULL, 'pending', '2024-12-07 16:00:00');

-- =====================================================
-- REGISTRATION LINKS (Kayıt Linkleri)
-- =====================================================
INSERT INTO registration_links (id, tenant_id, branch_id, group_id, code, title, description, max_uses, used_count, is_active) VALUES
  ('link-1', 'tenant-1', 'branch-1', 'grp-1', 'FUTBOL2024', 'Minikler Futbol Kayıt', '2024 yılı minikler futbol grubu kayıt linki', 50, 15, true),
  ('link-2', 'tenant-1', 'branch-1', NULL, 'YILDIZ2024', 'Genel Kayıt Linki', 'Tüm gruplar için genel kayıt', NULL, 45, true),
  ('link-3', 'tenant-1', 'branch-1', 'grp-6', 'YUZME2024', 'Yüzme Kayıt Linki', 'Yüzme grupları için kayıt', 30, 8, true),
  ('link-4', 'tenant-2', 'branch-4', NULL, 'FENER2024', 'Fenerbahçe Genel Kayıt', 'Fenerbahçe Spor Okulu kayıt linki', 100, 32, true),
  ('link-5', 'tenant-3', 'branch-6', NULL, 'KARTAL2024', 'Kartal Spor Kayıt', 'Kartal Spor Kulübü kayıt linki', NULL, 18, true);

-- =====================================================
-- PRODUCT CATEGORIES
-- =====================================================
INSERT INTO product_categories (id, tenant_id, name, slug, sort_order, is_active) VALUES
  ('cat-1', 'tenant-1', 'Spor Giyim', 'spor-giyim', 1, true),
  ('cat-2', 'tenant-1', 'Ekipman', 'ekipman', 2, true),
  ('cat-3', 'tenant-1', 'Aksesuarlar', 'aksesuarlar', 3, true),
  ('cat-4', 'tenant-2', 'FB Koleksiyon', 'fb-koleksiyon', 1, true),
  ('cat-5', 'tenant-2', 'Antrenman Malzemeleri', 'antrenman-malzemeleri', 2, true);

-- =====================================================
-- PRODUCTS (Ürünler)
-- =====================================================
INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, compare_price, stock_quantity, images, is_active, is_featured) VALUES
  ('prod-1', 'tenant-1', 'cat-1', 'Yıldız Spor Forma', 'yildiz-spor-forma', 'Resmi Yıldız Spor Akademi forması, nefes alabilen kumaş', 350, 400, 50, '["https://placehold.co/400x400/3b82f6/white?text=Forma"]'::jsonb, true, true),
  ('prod-2', 'tenant-1', 'cat-1', 'Antrenman Şortu', 'antrenman-sortu', 'Rahat kesim antrenman şortu', 180, NULL, 80, '["https://placehold.co/400x400/1f2937/white?text=Sort"]'::jsonb, true, false),
  ('prod-3', 'tenant-1', 'cat-1', 'Eşofman Takımı', 'esofman-takimi', 'Kışlık eşofman takımı', 650, 750, 30, '["https://placehold.co/400x400/1e3a8a/white?text=Esofman"]'::jsonb, true, true),
  ('prod-4', 'tenant-1', 'cat-2', 'Futbol Topu', 'futbol-topu', 'Profesyonel antrenman topu, FIFA onaylı', 450, NULL, 25, '["https://placehold.co/400x400/ffffff/black?text=Top"]'::jsonb, true, true),
  ('prod-5', 'tenant-1', 'cat-2', 'Basketbol Topu', 'basketbol-topu', 'Indoor/outdoor basketbol topu', 380, NULL, 20, '["https://placehold.co/400x400/f97316/white?text=Basketbol"]'::jsonb, true, false),
  ('prod-6', 'tenant-1', 'cat-2', 'Yüzme Gözlüğü', 'yuzme-gozlugu', 'Anti-fog yüzme gözlüğü', 220, 280, 40, '["https://placehold.co/400x400/06b6d4/white?text=Gozluk"]'::jsonb, true, false),
  ('prod-7', 'tenant-1', 'cat-3', 'Spor Çantası', 'spor-cantasi', 'Geniş hacimli spor çantası', 280, NULL, 35, '["https://placehold.co/400x400/374151/white?text=Canta"]'::jsonb, true, false),
  ('prod-8', 'tenant-1', 'cat-3', 'Matara', 'matara', '750ml spor matarası', 120, NULL, 100, '["https://placehold.co/400x400/10b981/white?text=Matara"]'::jsonb, true, false),
  ('prod-9', 'tenant-2', 'cat-4', 'FB Forma 2024', 'fb-forma-2024', 'Fenerbahçe resmi sezon forması', 850, 950, 100, '["https://placehold.co/400x400/FFD600/0D1E30?text=FB+Forma"]'::jsonb, true, true),
  ('prod-10', 'tenant-2', 'cat-4', 'FB Antrenman Forması', 'fb-antrenman-formasi', 'Fenerbahçe antrenman forması', 450, NULL, 60, '["https://placehold.co/400x400/0D1E30/FFD600?text=FB+Antrenman"]'::jsonb, true, false),
  ('prod-11', 'tenant-2', 'cat-5', 'FB Antrenman Topu', 'fb-antrenman-topu', 'Fenerbahçe logolu antrenman topu', 550, NULL, 30, '["https://placehold.co/400x400/FFD600/0D1E30?text=FB+Top"]'::jsonb, true, true);

-- =====================================================
-- EXPENSES (Giderler)
-- =====================================================
INSERT INTO expenses (id, tenant_id, branch_id, category, description, amount, expense_date, vendor) VALUES
  ('exp-1', 'tenant-1', 'branch-1', 'rent', 'Aralık ayı kira', 25000, '2024-12-01', 'Bina Yönetimi'),
  ('exp-2', 'tenant-1', 'branch-1', 'utilities', 'Elektrik faturası', 4500, '2024-12-05', 'BEDAŞ'),
  ('exp-3', 'tenant-1', 'branch-1', 'utilities', 'Su faturası', 1200, '2024-12-05', 'İSKİ'),
  ('exp-4', 'tenant-1', 'branch-1', 'equipment', 'Yeni antrenman malzemeleri', 8500, '2024-12-03', 'Spor Malzemeleri A.Ş.'),
  ('exp-5', 'tenant-1', 'branch-1', 'salaries', 'Eğitmen maaşları', 45000, '2024-12-01', 'Personel'),
  ('exp-6', 'tenant-1', 'branch-2', 'rent', 'Beşiktaş şube kirası', 18000, '2024-12-01', 'Bina Sahibi'),
  ('exp-7', 'tenant-2', 'branch-4', 'rent', 'Aralık ayı kira', 50000, '2024-12-01', 'Fenerbahçe Spor Kulübü'),
  ('exp-8', 'tenant-2', 'branch-4', 'salaries', 'Eğitmen maaşları', 85000, '2024-12-01', 'Personel'),
  ('exp-9', 'tenant-3', 'branch-6', 'rent', 'Aralık ayı kira', 12000, '2024-12-01', 'Kartal Belediyesi');

-- =====================================================
-- NOTIFICATION TEMPLATES
-- =====================================================
INSERT INTO notification_templates (id, tenant_id, name, type, subject, content, variables, is_active, channel) VALUES
  ('tpl-1', 'tenant-1', 'Ödeme Hatırlatma', 'payment_reminder', 'Aidat Ödeme Hatırlatması', 'Sayın {{guardian_name}}, {{student_name}} adlı öğrencimizin {{month}} ayı aidatı henüz ödenmemiştir. Aidat tutarı: {{amount}} TL. Son ödeme tarihi: {{due_date}}', '["guardian_name", "student_name", "month", "amount", "due_date"]'::jsonb, true, 'email'),
  ('tpl-2', 'tenant-1', 'Antrenman Hatırlatma', 'training_reminder', 'Yarınki Antrenman', 'Sayın Veli, {{student_name}} adlı öğrencimizin yarın saat {{time}} antrenmanı bulunmaktadır. Yer: {{venue}}', '["student_name", "time", "venue"]'::jsonb, true, 'email'),
  ('tpl-3', 'tenant-1', 'Hoşgeldiniz', 'welcome', 'Yıldız Spor Ailesine Hoşgeldiniz', 'Sayın {{guardian_name}}, {{student_name}} adlı öğrencimizi ailemize kabul etmekten mutluluk duyuyoruz. {{group_name}} grubunda eğitimlerine başlayacaktır.', '["guardian_name", "student_name", "group_name"]'::jsonb, true, 'email'),
  ('tpl-4', NULL, 'Abonelik Bitiş Uyarısı', 'subscription_expiry', 'Aboneliğiniz Sona Eriyor', 'Sayın {{school_name}} yetkilisi, aboneliğiniz {{expiry_date}} tarihinde sona erecektir. Kesintisiz hizmet için lütfen yenileyin.', '["school_name", "expiry_date"]'::jsonb, true, 'email');

-- =====================================================
-- WEBSITE PAGES
-- =====================================================
INSERT INTO website_pages (id, tenant_id, title, slug, content, meta_title, meta_description, is_published, sort_order) VALUES
  ('page-1', 'tenant-1', 'Hakkımızda', 'hakkimizda', 'Yıldız Spor Akademi, 2010 yılından bu yana İstanbul''da çocuk ve gençlere profesyonel spor eğitimi vermektedir. Deneyimli eğitmen kadromuz ve modern tesislerimizle sporcularımızın gelişimini destekliyoruz.', 'Yıldız Spor Akademi Hakkında', 'Yıldız Spor Akademi hakkında bilgi edinin', true, 1),
  ('page-2', 'tenant-1', 'İletişim', 'iletisim', 'Bize ulaşmak için aşağıdaki iletişim kanallarını kullanabilirsiniz.', 'İletişim - Yıldız Spor Akademi', 'Yıldız Spor Akademi iletişim bilgileri', true, 2),
  ('page-3', 'tenant-2', 'Hakkımızda', 'hakkimizda', 'Fenerbahçe Spor Okulu, Fenerbahçe Spor Kulübü''nün altyapı yetiştirme programıdır.', 'Fenerbahçe Spor Okulu Hakkında', 'Fenerbahçe Spor Okulu hakkında bilgi', true, 1);

-- =====================================================
-- ANNOUNCEMENTS
-- =====================================================
INSERT INTO announcements (id, tenant_id, title, content, is_published, published_at) VALUES
  ('ann-1', 'tenant-1', 'Yılbaşı Tatili Duyurusu', '25 Aralık - 2 Ocak tarihleri arasında yılbaşı tatili nedeniyle antrenmanlar yapılmayacaktır. Herkese iyi tatiller!', true, '2024-12-15'),
  ('ann-2', 'tenant-1', 'Yeni Yüzme Havuzu Açıldı!', 'Merkez şubemizde yeni yarı olimpik yüzme havuzumuz hizmete açılmıştır. Kayıtlar başlamıştır.', true, '2024-12-01'),
  ('ann-3', 'tenant-2', 'Fenerbahçe Futbol Kampı', 'Kış kampımız 15-20 Ocak tarihleri arasında Antalya''da gerçekleştirilecektir. Başvurular açıktır.', true, '2024-12-10');

-- =====================================================
-- AUDIT LOGS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION LOGS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  recipient_type VARCHAR(50), -- student, guardian, instructor
  recipient_id UUID,
  channel VARCHAR(20), -- sms, email, push
  recipient_contact VARCHAR(255),
  subject VARCHAR(255),
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant ON notification_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Seed complete message
SELECT 'Seed data inserted successfully!' as message;
