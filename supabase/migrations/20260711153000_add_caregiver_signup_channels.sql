DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signup_channel_use_status') THEN
    CREATE TYPE signup_channel_use_status AS ENUM ('submitted', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.caregiver_signup_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  role app_role NOT NULL DEFAULT 'caregiver',
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  require_approval BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_email_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_caregiver_signup_channels_token_unique
  ON public.caregiver_signup_channels(token);

CREATE INDEX IF NOT EXISTS idx_caregiver_signup_channels_tenant_id
  ON public.caregiver_signup_channels(tenant_id);

CREATE INDEX IF NOT EXISTS idx_caregiver_signup_channels_active
  ON public.caregiver_signup_channels(active);

CREATE TABLE IF NOT EXISTS public.caregiver_signup_channel_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.caregiver_signup_channels(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  app_user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  status signup_channel_use_status NOT NULL DEFAULT 'submitted',
  approved_at TIMESTAMPTZ,
  approved_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_caregiver_signup_channel_uses_channel_id
  ON public.caregiver_signup_channel_uses(channel_id);

CREATE INDEX IF NOT EXISTS idx_caregiver_signup_channel_uses_tenant_id
  ON public.caregiver_signup_channel_uses(tenant_id);

CREATE INDEX IF NOT EXISTS idx_caregiver_signup_channel_uses_status
  ON public.caregiver_signup_channel_uses(status);

DROP TRIGGER IF EXISTS trg_caregiver_signup_channels_updated_at ON public.caregiver_signup_channels;
CREATE TRIGGER trg_caregiver_signup_channels_updated_at
  BEFORE UPDATE ON public.caregiver_signup_channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_caregiver_signup_channel_uses_updated_at ON public.caregiver_signup_channel_uses;
CREATE TRIGGER trg_caregiver_signup_channel_uses_updated_at
  BEFORE UPDATE ON public.caregiver_signup_channel_uses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
