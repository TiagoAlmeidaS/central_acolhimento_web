# Supabase – Migrations

Esta pasta é usada pelo **Supabase CLI** para migrations do banco de dados.

- **`migrations/`** — arquivos SQL versionados, aplicados em ordem com `supabase db push`.

Documentação completa: [docs/database/README.md](../docs/database/README.md).

Comandos úteis:

```bash
supabase init          # primeira vez (cria config se não existir)
supabase link          # vincular ao projeto no Dashboard
supabase db push       # aplicar migrations ao projeto remoto
supabase migration new <nome>   # criar nova migration
```
