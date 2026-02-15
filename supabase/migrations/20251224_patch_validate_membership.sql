CREATE OR REPLACE FUNCTION validate_student_group_membership()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

