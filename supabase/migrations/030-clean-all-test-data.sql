-- Migration: Clean all test data (tenants, branches, students, dues, etc.)
-- Platform-level tables (platform_plans, platform_settings) are preserved.

BEGIN;

-- 1. Leaf tables (student-related)
TRUNCATE public.attendance CASCADE;
TRUNCATE public.student_notes CASCADE;
TRUNCATE public.student_performance CASCADE;
TRUNCATE public.student_fee_overrides CASCADE;
TRUNCATE public.student_month_freezes CASCADE;
TRUNCATE public.student_subscriptions CASCADE;
TRUNCATE public.student_groups CASCADE;
TRUNCATE public.monthly_dues CASCADE;
TRUNCATE public.payments CASCADE;
TRUNCATE public.payment_plans CASCADE;

-- 2. Orders
TRUNCATE public.order_items CASCADE;
TRUNCATE public.orders CASCADE;

-- 3. Notifications & logs
TRUNCATE public.notification_logs CASCADE;
TRUNCATE public.notification_templates CASCADE;
TRUNCATE public.scheduled_notifications CASCADE;
TRUNCATE public.audit_logs CASCADE;
TRUNCATE public.announcements CASCADE;

-- 4. Applications & registration
TRUNCATE public.applications CASCADE;
TRUNCATE public.registration_links CASCADE;

-- 5. Trainings & venues
TRUNCATE public.trainings CASCADE;
TRUNCATE public.venues CASCADE;
TRUNCATE public.expenses CASCADE;

-- 6. Branch policies
TRUNCATE public.branch_fee_policies CASCADE;
TRUNCATE public.branch_fee_policy_meta CASCADE;

-- 7. Instructor relations
TRUNCATE public.instructor_branches CASCADE;
TRUNCATE public.instructor_credentials CASCADE;

-- 8. User-branch relations
TRUNCATE public.user_branches CASCADE;

-- 9. Groups
TRUNCATE public.groups CASCADE;

-- 10. Products
TRUNCATE public.product_variants CASCADE;
TRUNCATE public.products CASCADE;
TRUNCATE public.product_categories CASCADE;

-- 11. Core entities (order matters)
TRUNCATE public.students CASCADE;
TRUNCATE public.instructors CASCADE;
TRUNCATE public.branches CASCADE;
TRUNCATE public.sports CASCADE;
TRUNCATE public.website_pages CASCADE;

-- 12. Tenant-level
TRUNCATE public.tenant_payments CASCADE;
TRUNCATE public.tenant_subscriptions CASCADE;

-- 13. Auth-related (tokens/sessions)
TRUNCATE public.email_verification_tokens CASCADE;
TRUNCATE public.password_reset_tokens CASCADE;
TRUNCATE public.phone_verification_codes CASCADE;
TRUNCATE public.user_sessions CASCADE;

-- 14. Users & Tenants
TRUNCATE public.users CASCADE;
TRUNCATE public.tenants CASCADE;

COMMIT;
