# central_acolhimento_web

Monolito em Next.js para a Central de Acolhimento, unificando frontend e backend no mesmo projeto.

## Stack atual

- Next.js App Router
- React
- Tailwind CSS
- PostgreSQL via Vercel Marketplace
- Route Handlers para o backend do monolito

## Rodando localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie seu arquivo `.env.local` a partir de `.env.example`.
3. Preencha uma das variaveis de conexao Postgres aceitas pelo projeto.

4. Rode o projeto:

```bash
npm run dev
```

## Migrations automaticas

- O projeto roda `npm run migrate` automaticamente antes de cada `npm run build`.
- Em deploy na Vercel, isso significa que o schema e atualizado antes da nova versao ser publicada.
- O controle de execucao fica na tabela `public.schema_migrations`.
- Apenas as migrations do monolito atual sao aplicadas automaticamente. Os arquivos legados do schema anterior ficam fora desse fluxo.

Comandos uteis:

```bash
npm run migrate
npm run build
```

## Estrutura nova

- `src/app` rotas web e API do monolito
- `src/auth` autenticacao local temporaria
- `src/server` dados e logica server-side inicial
- `src/server/repositories` repositorios do novo dominio MVP
- `src/ui` componentes da nova interface

## Legado preservado

Os diretorios antigos do app Vite foram mantidos apenas como referencia de portabilidade durante a migracao.
