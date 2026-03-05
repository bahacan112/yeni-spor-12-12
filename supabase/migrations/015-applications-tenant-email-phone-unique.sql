DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.applications
    WHERE tenant_id IS NOT NULL
      AND email IS NOT NULL
      AND phone IS NOT NULL
    GROUP BY tenant_id, lower(email), phone
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'applications tablosunda aynı tenant+email+phone için birden fazla kayıt var. Önce duplicate başvuruları temizleyin.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS applications_tenant_email_phone_unique
  ON public.applications (tenant_id, lower(email), phone)
  WHERE tenant_id IS NOT NULL AND email IS NOT NULL AND phone IS NOT NULL;

