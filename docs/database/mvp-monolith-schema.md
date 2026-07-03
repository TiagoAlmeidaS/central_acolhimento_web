# MVP Monolith Schema

## Objetivo

Este schema introduz o novo dominio do MVP do monolito em Next.js sem remover o legado anterior.

O foco agora e:

- `tenants`
- `tenant_users`
- `caregivers`
- `seeds`
- `members`
- `followups`

## Decisao importante

Foi usada a tabela `tenant_users` em vez de `users` para evitar ambiguidade com futuros provedores de autenticacao e com nomenclatura de usuarios do banco.

## Entidades

### tenants

- representa a cidade/unidade da Central de Acolhimento;
- e o topo do escopo multi-tenant.

Campos principais:

- `name`
- `city`
- `state`
- `status`
- `coordinator_name`

### tenant_users

- representa o usuario no contexto de um tenant;
- fica desacoplado de qualquer provedor especifico de autenticacao.

Campos principais:

- `tenant_id`
- `auth_user_id`
- `name`
- `email`
- `role`
- `active`

### caregivers

- representa cuidadores vinculados a um tenant;
- pode ou nao estar ligado diretamente a um `tenant_user`.

Campos principais:

- `tenant_id`
- `tenant_user_id`
- `name`
- `phone`
- `email`
- `active`

### seeds

- representa a semente inicial do cuidado;
- pode originar um membro.

Campos principais:

- `tenant_id`
- `reference_name`
- `source`
- `status`
- `notes`
- `first_contact_at`

### members

- representa a pessoa acompanhada no MVP.

Campos principais:

- `tenant_id`
- `caregiver_id`
- `seed_id`
- `name`
- `phone`
- `address`
- `city`
- `birth_date`
- `status`
- `notes`

### followups

- representa cada acao de acompanhamento;
- e a entidade central do fluxo operacional.

Campos principais:

- `tenant_id`
- `member_id`
- `caregiver_id`
- `type`
- `occurred_at`
- `notes`
- `next_action_at`

## Relacionamentos

- um `tenant` possui muitos `tenant_users`
- um `tenant` possui muitos `caregivers`
- um `tenant` possui muitos `members`
- um `tenant` possui muitas `seeds`
- um `tenant` possui muitos `followups`
- um `member` pode nascer de uma `seed`
- um `member` pode ter um `caregiver`
- um `member` possui muitos `followups`

## Migration

Arquivo:

- `supabase/migrations/20260702220000_create_mvp_monolith_schema.sql`

## Proximo passo tecnico

Depois de aplicar essa migration, o monolito pode usar repositorios server-side no Next para:

- listar/criar tenants;
- listar/criar caregivers;
- listar/criar members;
- listar/criar followups;
- compor dashboards com dados reais.
