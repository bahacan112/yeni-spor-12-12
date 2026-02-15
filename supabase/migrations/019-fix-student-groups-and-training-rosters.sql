-- 1) Fix duplicate FK relationships causing PostgREST PGRST201 ambiguity
ALTER TABLE public.student_groups DROP CONSTRAINT IF EXISTS fk_student_groups_student;
ALTER TABLE public.student_groups DROP CONSTRAINT IF EXISTS fk_student_groups_group;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_groups_student_id_fkey'
  ) THEN
    ALTER TABLE public.student_groups
      ADD CONSTRAINT student_groups_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_groups_group_id_fkey'
  ) THEN
    ALTER TABLE public.student_groups
      ADD CONSTRAINT student_groups_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 2) Create training_rosters table to snapshot group members for each training
CREATE TABLE IF NOT EXISTS public.training_rosters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_training_rosters_training ON public.training_rosters(training_id);
CREATE INDEX IF NOT EXISTS idx_training_rosters_student ON public.training_rosters(student_id);

-- 3) RLS policies for tenant isolation
ALTER TABLE public.training_rosters ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_rosters TO anon, authenticated;

DROP POLICY IF EXISTS select_training_rosters_for_tenant ON public.training_rosters;
CREATE POLICY select_training_rosters_for_tenant
ON public.training_rosters
FOR SELECT
TO anon, authenticated
USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS insert_training_rosters_for_tenant ON public.training_rosters;
CREATE POLICY insert_training_rosters_for_tenant
ON public.training_rosters
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS update_training_rosters_for_tenant ON public.training_rosters;
CREATE POLICY update_training_rosters_for_tenant
ON public.training_rosters
FOR UPDATE
TO authenticated
USING (tenant_id = public.current_tenant_id())
WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS delete_training_rosters_for_tenant ON public.training_rosters;
CREATE POLICY delete_training_rosters_for_tenant
ON public.training_rosters
FOR DELETE
TO authenticated
USING (tenant_id = public.current_tenant_id());

-- 4) Trigger to auto-populate training_rosters when a training is created
CREATE OR REPLACE FUNCTION public.populate_training_roster()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO public.training_rosters (tenant_id, training_id, group_id, student_id)
    SELECT NEW.tenant_id, NEW.id, NEW.group_id, sg.student_id
    FROM public.student_groups sg
    WHERE sg.group_id = NEW.group_id
      AND sg.status = 'active'
    ON CONFLICT (training_id, student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.trainings'::regclass
      AND tgname = 'populate_training_roster_after_insert'
  ) THEN
    CREATE TRIGGER populate_training_roster_after_insert
    AFTER INSERT ON public.trainings
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_training_roster();
  END IF;
END$$;

