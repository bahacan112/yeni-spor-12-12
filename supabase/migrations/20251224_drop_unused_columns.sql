DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'ip_address') THEN
    ALTER TABLE public.audit_logs DROP COLUMN ip_address;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'user_agent') THEN
    ALTER TABLE public.audit_logs DROP COLUMN user_agent;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_verification_tokens' AND column_name = 'verified_at') THEN
    ALTER TABLE public.email_verification_tokens DROP COLUMN verified_at;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'instructor_credentials' AND column_name = 'login_count') THEN
    ALTER TABLE public.instructor_credentials DROP COLUMN login_count;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'password_reset_tokens' AND column_name = 'used_at') THEN
    ALTER TABLE public.password_reset_tokens DROP COLUMN used_at;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'phone_verification_codes' AND column_name = 'attempts') THEN
    ALTER TABLE public.phone_verification_codes DROP COLUMN attempts;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'phone_verification_codes' AND column_name = 'verified_at') THEN
    ALTER TABLE public.phone_verification_codes DROP COLUMN verified_at;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_fee_overrides' AND column_name = 'locked') THEN
    ALTER TABLE public.student_fee_overrides DROP COLUMN locked;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_notes' AND column_name = 'is_private') THEN
    ALTER TABLE public.student_notes DROP COLUMN is_private;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_performance' AND column_name = 'evaluation_date') THEN
    ALTER TABLE public.student_performance DROP COLUMN evaluation_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_performance' AND column_name = 'score') THEN
    ALTER TABLE public.student_performance DROP COLUMN score;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_subscriptions' AND column_name = 'end_date') THEN
    ALTER TABLE public.student_subscriptions DROP COLUMN end_date;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_sessions' AND column_name = 'device_info') THEN
    ALTER TABLE public.user_sessions DROP COLUMN device_info;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_sessions' AND column_name = 'ip_address') THEN
    ALTER TABLE public.user_sessions DROP COLUMN ip_address;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_sessions' AND column_name = 'last_activity_at') THEN
    ALTER TABLE public.user_sessions DROP COLUMN last_activity_at;
  END IF;
END;
$$;
