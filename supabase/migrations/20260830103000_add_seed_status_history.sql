CREATE TABLE IF NOT EXISTS public.seed_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  seed_id UUID NOT NULL REFERENCES public.seeds(id) ON DELETE CASCADE,
  previous_status seed_status,
  new_status seed_status NOT NULL,
  changed_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seed_status_history_tenant_changed_at
  ON public.seed_status_history (tenant_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_seed_status_history_seed_changed_at
  ON public.seed_status_history (seed_id, changed_at DESC);
