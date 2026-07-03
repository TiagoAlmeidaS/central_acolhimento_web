# SQL Versionado do Projeto

Esta pasta guarda os arquivos SQL versionados do monolito.

O nome `supabase/` foi mantido apenas para preservar o historico do repositório durante a migracao. A pasta agora deve ser lida como:

- `migrations/` — schema versionado do projeto
- `seed.sql` — dados iniciais para ambiente local/demo

## Arquivos ativos

- `migrations/20260702220000_create_mvp_monolith_schema.sql`
- `seed.sql`

## Arquivos legados

- `migrations/20260218120000_create_central_acolhimento_schema.sql`

Esse arquivo legado existe apenas como contexto da fase anterior baseada em Supabase.
