CREATE OR REPLACE FUNCTION public.validate_student_group_membership_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_birth_date DATE;
  v_is_licensed BOOLEAN;
  v_from DATE;
  v_to DATE;
  v_license_req TEXT;
BEGIN
  BEGIN
    SELECT birth_date, is_licensed INTO v_birth_date, v_is_licensed
    FROM public.students
    WHERE id = NEW.student_id;

    SELECT birth_date_from, birth_date_to, license_requirement
    INTO v_from, v_to, v_license_req
    FROM public.groups
    WHERE id = NEW.group_id;
  EXCEPTION
    WHEN undefined_table THEN
      RETURN NEW;
  END;

  IF v_birth_date IS NOT NULL THEN
    IF v_from IS NOT NULL AND v_birth_date < v_from THEN
      RAISE EXCEPTION 'Student birth_date (%) is before group lower bound (%)', v_birth_date, v_from;
    END IF;
    IF v_to IS NOT NULL AND v_birth_date > v_to THEN
      RAISE EXCEPTION 'Student birth_date (%) is after group upper bound (%)', v_birth_date, v_to;
    END IF;
  END IF;

  IF v_license_req = 'licensed' AND NOT v_is_licensed THEN
    RAISE EXCEPTION 'Group requires licensed students';
  ELSIF v_license_req = 'unlicensed' AND v_is_licensed THEN
    RAISE EXCEPTION 'Group requires unlicensed students';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_validate_student_group_membership'
      AND tgrelid = 'public.student_groups'::regclass
  ) THEN
    DROP TRIGGER trg_validate_student_group_membership ON public.student_groups;
  END IF;
  CREATE TRIGGER trg_validate_student_group_membership
  BEFORE INSERT OR UPDATE ON public.student_groups
  FOR EACH ROW EXECUTE FUNCTION public.validate_student_group_membership_v2();
END;
$$;

