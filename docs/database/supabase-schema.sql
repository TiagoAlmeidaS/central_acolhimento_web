-- =============================================================================
-- Central de Acolhimento - Schema Supabase (PostgreSQL)
-- Executar no SQL Editor do Supabase (Project Settings > SQL Editor).
-- Ordem: 1) enums, 2) profiles, 3) membros, 4) contatos_tci, 5) interacoes_cuidado, 6) triggers/funções
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENUMs (valores numéricos alinhados ao .NET: 0, 1, 2, ...)
-- -----------------------------------------------------------------------------
CREATE TYPE perfil_servico AS ENUM ('CasaAberta', 'RedeOracao', 'Coordenador');
CREATE TYPE status_vida AS ENUM ('Novo', 'Visitado', 'FrequentaReuniao', 'Consolidado');
CREATE TYPE tipo_interacao AS ENUM ('VisitaPresencial', 'Mensagem', 'Oracao');

-- -----------------------------------------------------------------------------
-- 2. PROFILES (perfil do usuário logado - sincronizado com auth.users)
-- Ref.: docs/architecture/auth-design.md
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  igreja TEXT,
  estado TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: ao inserir/atualizar em auth.users, sincroniza para public.profiles
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, igreja, estado, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'igreja',
    NEW.raw_user_meta_data->>'estado',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = COALESCE(EXCLUDED.nome, public.profiles.nome),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    igreja = COALESCE(EXCLUDED.igreja, public.profiles.igreja),
    estado = COALESCE(EXCLUDED.estado, public.profiles.estado),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_sync_profile ON auth.users;
CREATE TRIGGER on_auth_user_sync_profile
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth();

-- -----------------------------------------------------------------------------
-- 3. MEMBROS (Rede de Cuidado)
-- Ref.: docs/architecture/system-design-document.md
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  bairro TEXT NOT NULL DEFAULT '',
  perfil_servico perfil_servico NOT NULL DEFAULT 'CasaAberta',
  limite_acolhimento INT NOT NULL DEFAULT 3,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 4. CONTATOS_TCI (Convidados)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contatos_tci (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  status_vida status_vida NOT NULL DEFAULT 'Novo',
  responsavel_id UUID REFERENCES public.membros(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 5. INTERACOES_CUIDADO (Logs de cuidado)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interacoes_cuidado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID NOT NULL REFERENCES public.contatos_tci(id) ON DELETE CASCADE,
  membro_id UUID NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
  tipo tipo_interacao NOT NULL,
  relato_metabolico TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_membros_bairro ON public.membros(bairro);
CREATE INDEX IF NOT EXISTS idx_membros_user_id ON public.membros(user_id);
CREATE INDEX IF NOT EXISTS idx_contatos_tci_responsavel ON public.contatos_tci(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_contatos_tci_status ON public.contatos_tci(status_vida);
CREATE INDEX IF NOT EXISTS idx_interacoes_contato ON public.interacoes_cuidado(contato_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_membro ON public.interacoes_cuidado(membro_id);

-- RLS (opcional): habilitar Row Level Security e políticas conforme necessidade
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.contatos_tci ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.interacoes_cuidado ENABLE ROW LEVEL SECURITY;
