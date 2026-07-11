-- Tabela de tokens para redefinição de senha
-- O token bruto é enviado ao usuário por e-mail.
-- Apenas o SHA-256 do token é armazenado — se o banco vazar, os hashes são inúteis.

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,          -- NULL = ainda não utilizado
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
  ON public.password_reset_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_app_user_id
  ON public.password_reset_tokens(app_user_id);
