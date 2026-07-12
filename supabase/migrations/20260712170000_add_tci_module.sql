DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tci_session_status') THEN
    CREATE TYPE tci_session_status AS ENUM ('draft', 'scheduled', 'confirmed', 'completed', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tci_chambers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  capacity INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tci_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scheduled_date DATE NOT NULL,
  starts_at TIME NOT NULL,
  ends_at TIME NOT NULL,
  chamber_id UUID NOT NULL REFERENCES public.tci_chambers(id) ON DELETE RESTRICT,
  status tci_session_status NOT NULL DEFAULT 'draft',
  notes TEXT NOT NULL DEFAULT '',
  created_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tci_session_caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tci_session_id UUID NOT NULL REFERENCES public.tci_sessions(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE RESTRICT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tci_session_caregivers_unique UNIQUE (tci_session_id, caregiver_id)
);

CREATE INDEX IF NOT EXISTS idx_tci_chambers_tenant_id
  ON public.tci_chambers(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tci_chambers_active
  ON public.tci_chambers(active);

CREATE INDEX IF NOT EXISTS idx_tci_sessions_tenant_id
  ON public.tci_sessions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tci_sessions_scheduled_date
  ON public.tci_sessions(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_tci_sessions_chamber_id
  ON public.tci_sessions(chamber_id);

CREATE INDEX IF NOT EXISTS idx_tci_sessions_status
  ON public.tci_sessions(status);

CREATE INDEX IF NOT EXISTS idx_tci_session_caregivers_session_id
  ON public.tci_session_caregivers(tci_session_id);

CREATE INDEX IF NOT EXISTS idx_tci_session_caregivers_caregiver_id
  ON public.tci_session_caregivers(caregiver_id);

DROP TRIGGER IF EXISTS trg_tci_chambers_updated_at ON public.tci_chambers;
CREATE TRIGGER trg_tci_chambers_updated_at
  BEFORE UPDATE ON public.tci_chambers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tci_sessions_updated_at ON public.tci_sessions;
CREATE TRIGGER trg_tci_sessions_updated_at
  BEFORE UPDATE ON public.tci_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
