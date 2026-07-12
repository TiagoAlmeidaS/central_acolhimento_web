DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outing_status') THEN
    CREATE TYPE outing_status AS ENUM ('draft', 'generated', 'confirmed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outing_participant_type') THEN
    CREATE TYPE outing_participant_type AS ENUM ('caregiver', 'member', 'guest');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outing_constraint_type') THEN
    CREATE TYPE outing_constraint_type AS ENUM ('must_stay_together');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outing_assignment_source') THEN
    CREATE TYPE outing_assignment_source AS ENUM ('system', 'manual');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.outing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scheduled_for TIMESTAMPTZ,
  target_group_size INTEGER NOT NULL DEFAULT 4,
  allow_groups_without_car BOOLEAN NOT NULL DEFAULT FALSE,
  status outing_status NOT NULL DEFAULT 'draft',
  created_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outing_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outing_event_id UUID NOT NULL REFERENCES public.outing_events(id) ON DELETE CASCADE,
  participant_type outing_participant_type NOT NULL,
  participant_id UUID,
  display_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  has_car BOOLEAN NOT NULL DEFAULT FALSE,
  car_seats INTEGER NOT NULL DEFAULT 0,
  is_driver BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outing_constraint_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outing_event_id UUID NOT NULL REFERENCES public.outing_events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  constraint_type outing_constraint_type NOT NULL DEFAULT 'must_stay_together',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outing_constraint_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constraint_group_id UUID NOT NULL REFERENCES public.outing_constraint_groups(id) ON DELETE CASCADE,
  outing_participant_id UUID NOT NULL REFERENCES public.outing_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outing_constraint_member_unique UNIQUE (constraint_group_id, outing_participant_id)
);

CREATE TABLE IF NOT EXISTS public.outing_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outing_event_id UUID NOT NULL REFERENCES public.outing_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  driver_participant_id UUID REFERENCES public.outing_participants(id) ON DELETE SET NULL,
  car_capacity_total INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outing_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outing_group_id UUID NOT NULL REFERENCES public.outing_groups(id) ON DELETE CASCADE,
  outing_participant_id UUID NOT NULL REFERENCES public.outing_participants(id) ON DELETE CASCADE,
  assigned_by outing_assignment_source NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outing_group_assignment_unique UNIQUE (outing_group_id, outing_participant_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outing_participants_origin_unique
  ON public.outing_participants(outing_event_id, participant_type, participant_id)
  WHERE participant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outing_events_tenant_id
  ON public.outing_events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_outing_events_status
  ON public.outing_events(status);

CREATE INDEX IF NOT EXISTS idx_outing_participants_outing_event_id
  ON public.outing_participants(outing_event_id);

CREATE INDEX IF NOT EXISTS idx_outing_constraint_groups_outing_event_id
  ON public.outing_constraint_groups(outing_event_id);

CREATE INDEX IF NOT EXISTS idx_outing_constraint_group_members_group_id
  ON public.outing_constraint_group_members(constraint_group_id);

CREATE INDEX IF NOT EXISTS idx_outing_groups_outing_event_id
  ON public.outing_groups(outing_event_id);

CREATE INDEX IF NOT EXISTS idx_outing_group_assignments_group_id
  ON public.outing_group_assignments(outing_group_id);

DROP TRIGGER IF EXISTS trg_outing_events_updated_at ON public.outing_events;
CREATE TRIGGER trg_outing_events_updated_at
  BEFORE UPDATE ON public.outing_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
