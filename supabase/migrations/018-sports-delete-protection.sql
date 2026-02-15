ALTER TABLE public.groups
  DROP CONSTRAINT IF EXISTS groups_sport_id_fkey;
ALTER TABLE public.groups
  ADD CONSTRAINT fk_groups_sport_id_restrict
  FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE RESTRICT;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_sport_id_fkey;
ALTER TABLE public.applications
  ADD CONSTRAINT fk_applications_sport_id_restrict
  FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.prevent_delete_sport_if_in_use()
RETURNS TRIGGER AS $$
DECLARE
  groups_usage INTEGER;
  applications_usage INTEGER;
BEGIN
  SELECT COUNT(*) INTO groups_usage FROM public.groups g WHERE g.sport_id = OLD.id;
  SELECT COUNT(*) INTO applications_usage FROM public.applications a WHERE a.sport_id = OLD.id;
  IF (groups_usage + applications_usage) > 0 THEN
    RAISE EXCEPTION 'Bu branş (%), % kullanımla ilişkili. Lütfen önce Yeniden Ata işlemi yapın.', OLD.name, (groups_usage + applications_usage)
      USING ERRCODE = 'raise_exception';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sports_guard_delete ON public.sports;
CREATE TRIGGER trg_sports_guard_delete
BEFORE DELETE ON public.sports
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_sport_if_in_use();
