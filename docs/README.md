# Documentacao - Central de Acolhimento (Monolito)

Este repositório contém a aplicacao **central_acolhimento_web** no formato de monolito em Next.js, com frontend e backend no mesmo projeto.

## Documentacao ativa

- [Next Monolith Notes](architecture/next-monolith-implementation-notes.md) — estado atual da migracao para o monolito.
- [Next Migration Assessment](architecture/next-migration-assessment.md) — diagnostico da base antiga e racional da migracao.
- [Next + Vercel Migration Spec](architecture/next-vercel-migration-spec.md) — estrategia de migracao e publicacao.
- [Database Guide](database/README.md) — uso de migrations e seed para o schema atual.
- [MVP Monolith Schema](database/mvp-monolith-schema.md) — entidades ativas do MVP (`tenants`, `caregivers`, `members`, `followups`, `seeds`).
- [Igreja: membros e presenca em reunioes](architecture/church-members-attendance-spec.md) — modulo Igreja, recorrencia, chamadas e base para metricas pastorais.
- [Dashboard da Igreja: frequencia e acoes de cuidado](architecture/church-dashboard-care-analysis-spec.md) — analises por dia, semana e mes, sinais de atencao e fluxo de cuidado.
- [Relatorio diario de saidas e novos contatos](architecture/daily-outing-report-spec.md) — tipos de saida, conclusao operacional, vinculo de contatos, casas abertas, mapa e PDF diario.
- [Postgres Setup on Vercel](database/vercel-postgres-setup.md) — variaveis e fluxo recomendado para conectar o banco na Vercel.
- [Mapeamento das Telas Stitch](telas-stitch-mapping.md) — referencia visual usada para portar as telas.

## Documentacao legada

Os arquivos abaixo foram mantidos apenas como contexto historico da fase anterior e podem ser arquivados no futuro:

- `architecture/auth-design.md`
- `architecture/auth-implementation.md`
- `architecture/system-design-document.md`
- `deployment/integracao-e-primeira-release.md`
- `database/supabase-schema.sql`

## Estrutura futura

- `components/` — catalogo de componentes e modulos do front-end
- `apis/` — contratos e endpoints do monolito
- `adr/` — decisoes arquiteturais formais
