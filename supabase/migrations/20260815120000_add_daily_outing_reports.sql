-- Daily outing reports: configurable types, execution completion and contact origin.

CREATE TABLE IF NOT EXISTS public.outing_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS outing_types_active_name_unique
  ON public.outing_types (tenant_id, lower(name))
  WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_outing_types_tenant_active
  ON public.outing_types (tenant_id, active);

DROP TRIGGER IF EXISTS trg_outing_types_updated_at ON public.outing_types;
CREATE TRIGGER trg_outing_types_updated_at
  BEFORE UPDATE ON public.outing_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.outing_events
  ADD COLUMN IF NOT EXISTS outing_type_id UUID REFERENCES public.outing_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_outing_events_tenant_completed
  ON public.outing_events (tenant_id, completed_at);

ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS outing_event_id UUID REFERENCES public.outing_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_seeds_tenant_outing_created
  ON public.seeds (tenant_id, outing_event_id, created_at);
