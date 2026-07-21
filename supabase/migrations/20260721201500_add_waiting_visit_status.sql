-- Adiciona o status 'waiting_visit' no enum seed_status de forma segura em transações
INSERT INTO pg_catalog.pg_enum (enumtypid, enumlabel, enumsortorder)
SELECT 'seed_status'::regtype, 'waiting_visit', (
  SELECT max(enumsortorder) + 1.0 FROM pg_catalog.pg_enum WHERE enumtypid = 'seed_status'::regtype
)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_catalog.pg_enum WHERE enumtypid = 'seed_status'::regtype AND enumlabel = 'waiting_visit'
);
