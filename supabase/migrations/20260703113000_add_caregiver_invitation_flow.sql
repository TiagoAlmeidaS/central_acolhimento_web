-- Caregiver invitation flow
-- Introduz contas locais do app e convites por tenant para cuidadores.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_email_unique
  ON public.app_users (LOWER(email));

ALTER TABLE public.tenant_users
  ADD COLUMN IF NOT EXISTS app_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tenant_users_app_user_id
  ON public.tenant_users(app_user_id);

CREATE TABLE IF NOT EXISTS public.caregiver_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  accepted_app_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  role app_role NOT NULL DEFAULT 'caregiver',
  email TEXT,
  token TEXT NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_caregiver_invitations_token_unique
  ON public.caregiver_invitations(token);

CREATE INDEX IF NOT EXISTS idx_caregiver_invitations_tenant_id
  ON public.caregiver_invitations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_caregiver_invitations_status
  ON public.caregiver_invitations(status);

DROP TRIGGER IF EXISTS trg_app_users_updated_at ON public.app_users;
CREATE TRIGGER trg_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_caregiver_invitations_updated_at ON public.caregiver_invitations;
CREATE TRIGGER trg_caregiver_invitations_updated_at
  BEFORE UPDATE ON public.caregiver_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
