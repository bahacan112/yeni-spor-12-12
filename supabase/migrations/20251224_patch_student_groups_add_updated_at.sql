DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'student_groups'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.student_groups
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.student_groups'::regclass
      AND tgname = 'set_student_groups_updated_at'
  ) THEN
    CREATE TRIGGER set_student_groups_updated_at
    BEFORE UPDATE ON public.student_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;
END;
$$;

