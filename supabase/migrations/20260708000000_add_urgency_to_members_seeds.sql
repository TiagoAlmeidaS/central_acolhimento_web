-- Migration: Add is_urgent column to seeds and members
ALTER TABLE public.seeds ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT FALSE;
