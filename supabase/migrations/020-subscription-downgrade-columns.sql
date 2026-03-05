ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS pending_downgrade_plan_id UUID REFERENCES public.platform_plans(id),
  ADD COLUMN IF NOT EXISTS pending_downgrade_effective_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tenant_sub_pending_effective
  ON public.tenant_subscriptions(pending_downgrade_effective_at)
  WHERE pending_downgrade_plan_id IS NOT NULL;
