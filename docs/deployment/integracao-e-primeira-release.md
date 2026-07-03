# Primeira Release do Monolito

Este documento resume o que precisa estar pronto para publicar a primeira versao do monolito.

## Checklist

| Item | Onde | Observacao |
|------|------|------------|
| Banco Postgres conectado | Vercel Marketplace | Recomendado usar Neon |
| Variaveis de ambiente do banco | Projeto web | `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL` ou `DATABASE_URL` |
| Migration automatica configurada | Build | `prebuild` roda `npm run migrate` antes do `next build` |
| Seed aplicado | Banco | Opcional, mas ajuda na demo |
| Build do Next validado | Projeto web | `npm run build` |
| Autenticacao local ativa | Projeto web | Temporaria nesta fase |

## Sequencia recomendada

1. Conectar o banco no projeto
2. Validar `npm run migrate`
3. Aplicar seed se quiser dados de demo
4. Validar localmente
5. Publicar na Vercel

## Como funciona no deploy

- O script [migrate.mjs](D:/projects/igreja/central_acolhimento_web/scripts/migrate.mjs:1) roda automaticamente no `prebuild`.
- Ele cria a tabela `public.schema_migrations` se necessario.
- Cada arquivo SQL aplicado fica registrado com nome e checksum.
- Se uma migration antiga for alterada depois de ja executada, o build falha para evitar drift silencioso.
- Somente migrations do monolito atual entram no fluxo automatico. Os arquivos legados do schema antigo continuam versionados, mas nao sao executados no deploy.

## Git

Na pasta do projeto:

```bash
git status
git add .
git commit -m "chore: preparar monolito next com postgres"
git push -u origin main
```

## Observacao

Os guias antigos de `central_ms`, JWT do Supabase e integracao Web ↔ MS ficaram obsoletos para a arquitetura atual e foram mantidos apenas como historico.
