-- migrate:disable-transaction
-- Adiciona o status 'waiting_visit' no enum seed_status
ALTER TYPE seed_status ADD VALUE IF NOT EXISTS 'waiting_visit';
