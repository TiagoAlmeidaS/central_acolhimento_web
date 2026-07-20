-- Central de Acolhimento - Church members and attendance module

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'church_membership_status') THEN
    CREATE TYPE church_membership_status AS ENUM ('active', 'inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'church_recurrence_kind') THEN
    CREATE TYPE church_recurrence_kind AS ENUM ('none', 'weekly');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'church_occurrence_status') THEN
    CREATE TYPE church_occurrence_status AS ENUM ('scheduled', 'completed', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'church_attendance_status') THEN
    CREATE TYPE church_attendance_status AS ENUM ('unmarked', 'present', 'absent', 'justified');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.church_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status church_membership_status NOT NULL DEFAULT 'active',
  started_at DATE,
  ended_at DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT church_memberships_unique_member UNIQUE (tenant_id, member_id),
  CONSTRAINT church_memberships_dates_order CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE IF NOT EXISTS public.church_meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#2D7FF9',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  recurrence_kind church_recurrence_kind NOT NULL DEFAULT 'none',
  weekday INT,
  starts_at TIME,
  ends_at TIME,
  recurrence_starts_on DATE,
  recurrence_ends_on DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT church_meeting_types_weekday_required CHECK (recurrence_kind <> 'weekly' OR weekday BETWEEN 0 AND 6),
  CONSTRAINT church_meeting_types_weekday_none CHECK (weekday IS NULL OR weekday BETWEEN 0 AND 6),
  CONSTRAINT church_meeting_types_time_order CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CONSTRAINT church_meeting_types_recurrence_order CHECK (recurrence_ends_on IS NULL OR recurrence_starts_on IS NULL OR recurrence_ends_on >= recurrence_starts_on)
);

CREATE UNIQUE INDEX IF NOT EXISTS church_meeting_types_active_name_unique
  ON public.church_meeting_types (tenant_id, lower(name))
  WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS public.church_meeting_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  meeting_type_id UUID NOT NULL REFERENCES public.church_meeting_types(id) ON DELETE CASCADE,
  occurs_on DATE NOT NULL,
  starts_at TIME,
  ends_at TIME,
  status church_occurrence_status NOT NULL DEFAULT 'scheduled',
  attendance_closed_at TIMESTAMPTZ,
  attendance_closed_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT church_meeting_occurrences_unique_day UNIQUE (meeting_type_id, occurs_on),
  CONSTRAINT church_meeting_occurrences_time_order CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CONSTRAINT church_meeting_occurrences_cancelled_open CHECK (status <> 'cancelled' OR attendance_closed_at IS NULL)
);

CREATE TABLE IF NOT EXISTS public.church_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  occurrence_id UUID NOT NULL REFERENCES public.church_meeting_occurrences(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status church_attendance_status NOT NULL DEFAULT 'unmarked',
  notes TEXT NOT NULL DEFAULT '',
  marked_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT church_attendance_records_unique_member UNIQUE (occurrence_id, member_id),
  CONSTRAINT church_attendance_records_marked_at CHECK (status = 'unmarked' OR marked_at IS NOT NULL)
);

DROP TRIGGER IF EXISTS trg_church_memberships_updated_at ON public.church_memberships;
CREATE TRIGGER trg_church_memberships_updated_at
  BEFORE UPDATE ON public.church_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_church_meeting_types_updated_at ON public.church_meeting_types;
CREATE TRIGGER trg_church_meeting_types_updated_at
  BEFORE UPDATE ON public.church_meeting_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_church_meeting_occurrences_updated_at ON public.church_meeting_occurrences;
CREATE TRIGGER trg_church_meeting_occurrences_updated_at
  BEFORE UPDATE ON public.church_meeting_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_church_attendance_records_updated_at ON public.church_attendance_records;
CREATE TRIGGER trg_church_attendance_records_updated_at
  BEFORE UPDATE ON public.church_attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_church_memberships_tenant_status ON public.church_memberships(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_church_memberships_tenant_member ON public.church_memberships(tenant_id, member_id);
CREATE INDEX IF NOT EXISTS idx_church_meeting_types_tenant_active ON public.church_meeting_types(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_church_meeting_occurrences_tenant_day_status ON public.church_meeting_occurrences(tenant_id, occurs_on, status);
CREATE INDEX IF NOT EXISTS idx_church_attendance_records_occurrence_status ON public.church_attendance_records(occurrence_id, status);
CREATE INDEX IF NOT EXISTS idx_church_attendance_records_member_occurrence ON public.church_attendance_records(member_id, occurrence_id);
