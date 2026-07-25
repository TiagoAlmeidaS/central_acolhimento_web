-- Central de Acolhimento - Spiritual Temperature
-- Adiciona o campo espiritual_temperature a tabela members

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'spiritual_temperature') THEN
    CREATE TYPE spiritual_temperature AS ENUM ('cold', 'warm', 'hot');
  END IF;
END $$;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS spiritual_temperature spiritual_temperature;
