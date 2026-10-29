-- Central de Acolhimento - Taxonomia fechada de origem do contato
-- Cria o enum seed_origin_channel, adiciona origin_channel / origin_detail /
-- registered_by_tenant_user_id em public.seeds e faz o backfill a partir de
-- outing_event_id e do texto livre em source (sem adivinhar canal).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seed_origin_channel') THEN
    CREATE TYPE seed_origin_channel AS ENUM (
      'outing',
      'referral',
      'church_service',
      'public_link',
      'whatsapp',
      'manual',
      'import',
      'other'
    );
  END IF;
END $$;

DO $$
DECLARE
  needs_backfill BOOLEAN;
BEGIN
  needs_backfill := NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'seeds'
       AND column_name = 'origin_channel'
  );

  ALTER TABLE public.seeds
    ADD COLUMN IF NOT EXISTS origin_channel seed_origin_channel NOT NULL DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS origin_detail TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS registered_by_tenant_user_id UUID REFERENCES public.tenant_users(id) ON DELETE SET NULL;

  IF needs_backfill THEN
    -- Contato gerado por saida: canal confiavel.
    UPDATE public.seeds
       SET origin_channel = 'outing'
     WHERE outing_event_id IS NOT NULL;

    -- Detalhe da saida quando ainda nao houver detalhe preenchido.
    UPDATE public.seeds AS s
       SET origin_detail = o.name
      FROM public.outing_events AS o
     WHERE s.outing_event_id = o.id
       AND btrim(s.origin_detail) = ''
       AND btrim(COALESCE(o.name, '')) <> '';

    -- Demais contatos: preserva o texto livre como detalhe e deixa o canal em
    -- 'other'. A fila de reclassificacao e intencional.
    UPDATE public.seeds
       SET origin_detail = btrim(source)
     WHERE outing_event_id IS NULL
       AND btrim(origin_detail) = ''
       AND btrim(COALESCE(source, '')) <> '';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_seeds_tenant_origin_channel_created
  ON public.seeds (tenant_id, origin_channel, created_at);
