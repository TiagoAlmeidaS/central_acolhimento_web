-- Expand seeds to support the "new contacts" intake flow used by caregivers.

ALTER TABLE public.seeds
  ADD COLUMN IF NOT EXISTS caregiver_id UUID REFERENCES public.caregivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_seeds_caregiver_id
  ON public.seeds(caregiver_id);
