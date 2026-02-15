-- Create sports table for tenant-level branches (sports disciplines)
CREATE TABLE IF NOT EXISTS public.sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index to prevent duplicates per tenant (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS sports_tenant_name_unique
ON public.sports (tenant_id, lower(name));

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sports_updated_at ON public.sports;
CREATE TRIGGER trg_sports_updated_at
BEFORE UPDATE ON public.sports
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

-- Allow read for same-tenant roles
DROP POLICY IF EXISTS sports_select_same_tenant_roles ON public.sports;
CREATE POLICY sports_select_same_tenant_roles
ON public.sports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.tenant_id = sports.tenant_id
      AND u.role IN ('tenant_admin','branch_manager','instructor','super_admin')
  )
);

-- Allow insert/update/delete for admins and managers of same tenant
DROP POLICY IF EXISTS sports_modify_admin_manager ON public.sports;
CREATE POLICY sports_modify_admin_manager
ON public.sports FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.tenant_id = sports.tenant_id
      AND u.role IN ('tenant_admin','branch_manager','super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.tenant_id = sports.tenant_id
      AND u.role IN ('tenant_admin','branch_manager','super_admin')
  )
);

-- Seed defaults for existing tenants
INSERT INTO public.sports (tenant_id, name, slug, sort_order, is_active)
SELECT t.id, s.name, s.slug, s.sort_order, TRUE
FROM public.tenants t
CROSS JOIN (
  VALUES
    ('Futbol','futbol',1),
    ('Basketbol','basketbol',2),
    ('Yüzme','yuzme',3),
    ('Tenis','tenis',4)
) AS s(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sports sp
  WHERE sp.tenant_id = t.id AND lower(sp.name) = lower(s.name)
);

-- Also migrate distinct group.sport_type into sports per tenant
INSERT INTO public.sports (tenant_id, name, slug, sort_order, is_active)
SELECT g.tenant_id,
       g.sport_type,
       NULL,
       100,
       TRUE
FROM public.groups g
WHERE g.sport_type IS NOT NULL
GROUP BY g.tenant_id, g.sport_type
HAVING NOT EXISTS (
  SELECT 1 FROM public.sports sp
  WHERE sp.tenant_id = g.tenant_id AND lower(sp.name) = lower(g.sport_type)
);

-- Trigger to seed defaults on new tenant creation
CREATE OR REPLACE FUNCTION public.seed_default_sports_for_tenant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sports (tenant_id, name, slug, sort_order, is_active)
  VALUES
    (NEW.id, 'Futbol', 'futbol', 1, TRUE),
    (NEW.id, 'Basketbol', 'basketbol', 2, TRUE),
    (NEW.id, 'Yüzme', 'yuzme', 3, TRUE),
    (NEW.id, 'Tenis', 'tenis', 4, TRUE)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_seed_sports ON public.tenants;
CREATE TRIGGER trg_tenants_seed_sports
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.seed_default_sports_for_tenant();
