# Database Guide

Este projeto usa PostgreSQL no monolito em Next.js.

Em producao, a recomendacao e conectar o banco pela integracao de Postgres da Vercel Marketplace, como Neon.

## Estrutura atual

- `supabase/migrations/` — migrations SQL versionadas do projeto
- `supabase/seed.sql` — dados iniciais do MVP

O nome da pasta `supabase/` foi mantido apenas para preservar o historico do repositório durante a migracao. Ela agora funciona como pasta de SQL versionado do projeto.

## Migrations ativas

- `20260702220000_create_mvp_monolith_schema.sql` — novo schema do MVP do monolito

## Como aplicar

Voce pode aplicar as migrations por qualquer fluxo que aceite SQL PostgreSQL:

1. via editor SQL do provedor
2. via CLI do provedor
3. via ferramenta de migrations adotada pelo time

## Ordem recomendada

1. aplicar a migration do schema do MVP
2. aplicar o `seed.sql` se quiser dados iniciais
3. configurar as variaveis de ambiente do banco na Vercel

## Variaveis de ambiente aceitas pelo app

- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_URL`
- `DATABASE_URL`

O app usa a primeira disponivel nessa ordem.

## Arquivos legados

Os arquivos abaixo foram mantidos apenas como historico:

- `docs/database/supabase-schema.sql`
- `supabase/migrations/20260218120000_create_central_acolhimento_schema.sql`
