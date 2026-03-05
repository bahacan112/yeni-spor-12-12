DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_email_key;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_phone_unique
  ON public.users (tenant_id, lower(email), phone)
  WHERE tenant_id IS NOT NULL;

