-- Adiciona campos de endereço estruturado à tabela members
-- Espelha os campos já presentes em seeds (migrations 20260707110000 e 20260707130000)

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS postal_code    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS street         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS neighborhood   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS state          TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_members_postal_code
  ON public.members(postal_code);
