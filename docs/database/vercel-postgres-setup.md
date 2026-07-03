# Postgres Setup on Vercel

## Contexto

Em 2026, o caminho oficial da Vercel para Postgres e usar uma integracao do Marketplace, como Neon.

O projeto foi preparado para funcionar com:

- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_URL`
- `DATABASE_URL`

## Ordem de resolucao

O backend do monolito tenta conectar nesta ordem:

1. `POSTGRES_URL_NON_POOLING`
2. `POSTGRES_URL`
3. `DATABASE_URL`

## Recomendacao pratica

- use `POSTGRES_URL_NON_POOLING` para operacoes de migration e scripts
- use `POSTGRES_URL` ou a conexao provida pela integracao da Vercel para o runtime do app

## Passo a passo resumido

1. Conectar um banco Postgres via Vercel Marketplace
2. Confirmar que as variaveis foram injetadas no projeto
3. Aplicar a migration do schema do MVP
4. Aplicar o seed inicial, se desejado
5. Publicar o app

## Validacao local

Crie um `.env.local` com uma das strings de conexao suportadas e rode:

```bash
npm run dev
```

## Observacao sobre autenticacao

Nesta etapa, a autenticacao foi simplificada para modo local temporario. O banco ja esta pronto para o dominio do MVP, mas o provedor definitivo de login ainda pode ser escolhido depois.
