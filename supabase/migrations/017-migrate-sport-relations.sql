ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS sport_id UUID REFERENCES public.sports(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_groups_sport_id ON public.groups(sport_id);

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS sport_id UUID REFERENCES public.sports(id) ON DELETE SET NULL;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS sport_name TEXT;
CREATE INDEX IF NOT EXISTS idx_applications_sport_id ON public.applications(sport_id);

UPDATE public.groups g
SET sport_id = s.id
FROM public.sports s
WHERE g.sport_type IS NOT NULL
  AND s.tenant_id = g.tenant_id
  AND lower(s.name) = lower(g.sport_type)
  AND (g.sport_id IS NULL OR g.sport_id <> s.id);

UPDATE public.applications a
SET sport_name = COALESCE(a.sport_name, substring(a.message from E'\\[SPORT:([^]]+)\\]'))
WHERE a.message ~ E'\\[SPORT:';

UPDATE public.applications a
SET sport_id = s.id
FROM public.sports s
WHERE a.sport_id IS NULL
  AND a.sport_name IS NOT NULL
  AND s.tenant_id = a.tenant_id
  AND lower(s.name) = lower(a.sport_name);

UPDATE public.applications a
SET sport_id = g.sport_id
FROM public.registration_links rl
JOIN public.groups g ON g.id = rl.group_id
WHERE a.sport_id IS NULL
  AND a.registration_link_id = rl.id;
