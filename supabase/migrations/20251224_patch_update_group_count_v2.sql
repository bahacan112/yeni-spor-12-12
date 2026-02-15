CREATE OR REPLACE FUNCTION public.update_group_student_count_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.groups SET updated_at = NOW() WHERE id = NEW.group_id;
  END IF;
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE public.groups SET updated_at = NOW() WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_update_group_count'
      AND tgrelid = 'public.student_groups'::regclass
  ) THEN
    DROP TRIGGER trg_update_group_count ON public.student_groups;
  END IF;
  CREATE TRIGGER trg_update_group_count
  AFTER INSERT OR UPDATE OR DELETE ON public.student_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_group_student_count_v2();
END;
$$;

