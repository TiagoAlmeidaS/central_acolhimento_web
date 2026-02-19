# Scripts de banco de dados (Supabase)

Scripts SQL para criar e evoluir o schema no **Supabase** (PostgreSQL), alinhados ao [System Design Document](../architecture/system-design-document.md) e ao [Design de Autenticação](../architecture/auth-design.md).

Há **duas formas** de aplicar o schema:

---

## Opção 1: Migrations (recomendado)

Use o **Supabase CLI** para versionar e aplicar alterações via migrations. Ideal para CI/CD e para manter histórico de mudanças no banco.

### Pré-requisitos

- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) instalado
- Projeto criado no [Dashboard Supabase](https://supabase.com/dashboard)

### Fluxo

1. **Inicializar (uma vez)** — na raiz do repositório (onde está a pasta `supabase/`):
   ```bash
   supabase init
   ```
   (Se a pasta `supabase/` já existir com `migrations/`, pode pular.)

2. **Vincular ao projeto remoto** — associe o CLI ao projeto no Dashboard:
   ```bash
   supabase login
   supabase link --project-ref <seu-project-ref>
   ```
   O `project-ref` aparece na URL do projeto no Dashboard (ex.: `https://supabase.com/dashboard/project/abcdefgh` → ref é `abcdefgh`).

3. **Aplicar as migrations** — envia as migrations pendentes para o banco remoto:
   ```bash
   supabase db push
   ```

4. **Criar novas migrations** — ao alterar o schema no futuro:
   ```bash
   supabase migration new nome_da_alteracao
   ```
   Edite o arquivo gerado em `supabase/migrations/` e depois rode `supabase db push` de novo.

### Estrutura

- **`supabase/migrations/`** — arquivos SQL com timestamp no nome (ex.: `20260218120000_create_central_acolhimento_schema.sql`). São aplicados em ordem e versionados no Supabase.

### Desenvolvimento local (opcional)

Com Docker, você pode subir um Supabase local e testar as migrations sem tocar no projeto remoto:

```bash
supabase start
supabase db reset   # aplica todas as migrations + seed (se houver supabase/seed.sql)
```

---

## Opção 2: Script SQL único (manual)

Se não quiser usar o CLI, execute o script único no SQL Editor do Dashboard:

1. Abra o [Dashboard do Supabase](https://supabase.com/dashboard) e selecione o projeto.
2. Vá em **SQL Editor** e crie uma nova query.
3. Cole o conteúdo de **`docs/database/supabase-schema.sql`** e execute.

Use esta opção para um setup rápido ou quando não for usar migrations.

---

## Conteúdo do schema

| Artefato | Descrição |
|----------|-----------|
| **Enums** | `perfil_servico`, `status_vida`, `tipo_interacao` (valores textuais alinhados ao .NET). |
| **profiles** | Perfil do usuário (id, nome, email, igreja, estado, avatar_url). Sincronizado com `auth.users` via trigger. |
| **membros** | Rede de Cuidado (nome, whatsapp, bairro, perfil_servico, limite_acolhimento, user_id → profiles). |
| **contatos_tci** | Convidados (nome, whatsapp, status_vida, responsavel_id → membros). |
| **interacoes_cuidado** | Logs de cuidado (contato_id, membro_id, tipo, relato_metabolico). |

O trigger `on_auth_user_sync_profile` preenche/atualiza `public.profiles` sempre que um usuário é inserido ou atualizado em `auth.users`.
