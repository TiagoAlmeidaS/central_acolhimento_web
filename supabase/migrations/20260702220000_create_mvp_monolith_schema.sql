-- Central de Acolhimento - MVP Monolith Schema
-- Objetivo: introduzir o novo dominio do MVP sem remover o schema legado.
-- Tabelas novas: tenants, tenant_users, caregivers, seeds, members, followups

-- 1. ENUMs do MVP
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_status') THEN
    CREATE TYPE tenant_status AS ENUM ('active', 'inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('coordinator', 'caregiver');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
    CREATE TYPE member_status AS ENUM ('new', 'in_progress', 'consolidated', 'inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seed_status') THEN
    CREATE TYPE seed_status AS ENUM ('new', 'contacted', 'in_progress', 'consolidated', 'inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'followup_type') THEN
    CREATE TYPE followup_type AS ENUM ('visit', 'call', 'message', 'prayer', 'other');
  END IF;
END $$;

-- 2. TENANTS
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  status tenant_status NOT NULL DEFAULT 'active',
  coordinator_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TENANT_USERS
-- Representa a participacao de um usuario autenticado dentro de um tenant.
-- auth_user_id fica neutro em relacao ao provedor de autenticacao.
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  auth_user_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  role app_role NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenant_users_unique_auth_per_tenant UNIQUE NULLS NOT DISTINCT (tenant_id, auth_user_id)
);

-- 4. CAREGIVERS
CREATE TABLE IF NOT EXISTS public.caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SEEDS
CREATE TABLE IF NOT EXISTS public.seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reference_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  status seed_status NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  first_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MEMBERS
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES public.caregivers(id) ON DELETE SET NULL,
  seed_id UUID REFERENCES public.seeds(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  status member_status NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FOLLOWUPS
CREATE TABLE IF NOT EXISTS public.followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES public.caregivers(id) ON DELETE SET NULL,
  type followup_type NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT NOT NULL DEFAULT '',
  next_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. UPDATED_AT helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON public.tenants;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tenant_users_updated_at ON public.tenant_users;
CREATE TRIGGER trg_tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_caregivers_updated_at ON public.caregivers;
CREATE TRIGGER trg_caregivers_updated_at
  BEFORE UPDATE ON public.caregivers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_seeds_updated_at ON public.seeds;
CREATE TRIGGER trg_seeds_updated_at
  BEFORE UPDATE ON public.seeds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_members_updated_at ON public.members;
CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_auth_user_id ON public.tenant_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_tenant_id ON public.caregivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_tenant_user_id ON public.caregivers(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON public.members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_members_caregiver_id ON public.members(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_members_seed_id ON public.members(seed_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_seeds_tenant_id ON public.seeds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seeds_status ON public.seeds(status);
CREATE INDEX IF NOT EXISTS idx_followups_tenant_id ON public.followups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_followups_member_id ON public.followups(member_id);
CREATE INDEX IF NOT EXISTS idx_followups_caregiver_id ON public.followups(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_followups_next_action_at ON public.followups(next_action_at);
