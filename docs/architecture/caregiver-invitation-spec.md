# Caregiver Invitation Spec

## Objetivo

Permitir que a coordenação de um tenant gere um link de convite para cuidadores.

Ao abrir o link, o cuidador deve conseguir:

- confirmar o tenant do convite;
- preencher `nome`;
- preencher `sobrenome`;
- preencher `email`;
- preencher `telefone/whatsapp`;
- definir `senha`;
- finalizar o cadastro.

No fim do fluxo, o sistema deve criar:

- uma conta autenticável local do app;
- o vínculo dela com o tenant;
- o registro de cuidador associado ao tenant.

## Princípios

- o convite pertence a um tenant;
- o link deve ser único e difícil de adivinhar;
- o convite deve expirar;
- o convite deve ser consumido uma única vez;
- o cadastro do cuidador não deve depender da coordenação preencher todos os dados manualmente.

## Modelo de dados

### app_users

Conta autenticável local do sistema.

Campos principais:

- `id`
- `first_name`
- `last_name`
- `email`
- `phone`
- `password_hash`
- `active`

### caregiver_invitations

Convite emitido por tenant.

Campos principais:

- `id`
- `tenant_id`
- `created_by_tenant_user_id`
- `email`
- `role`
- `token`
- `status`
- `expires_at`
- `accepted_at`
- `accepted_app_user_id`

### tenant_users

Recebe o vínculo do usuário aceito com o tenant.

Resultado esperado:

- `role = caregiver`
- `app_user_id` preenchido
- `name` montado com nome + sobrenome

### caregivers

Recebe o cadastro operacional do cuidador.

Resultado esperado:

- `tenant_user_id` preenchido
- `name` montado com nome + sobrenome
- `email`
- `phone`

## Fluxo

### 1. Coordenação gera convite

Entrada:

- tenant
- email opcional
- expiração

Saída:

- token
- link `/convite/[token]`

### 2. Cuidador abre link

O sistema valida:

- convite existe
- status é `pending`
- não expirou

### 3. Cuidador preenche cadastro

Campos:

- nome
- sobrenome
- email
- telefone
- senha
- confirmar senha

### 4. Sistema conclui aceite

Passos transacionais:

1. criar `app_users`
2. criar `tenant_users`
3. criar `caregivers`
4. marcar convite como `accepted`

## Regras de negócio

- um convite aceito não pode ser reutilizado;
- convite expirado não pode ser aceito;
- email deve ser único em `app_users`;
- email do formulário deve respeitar o email do convite, se o convite tiver email pré-definido;
- o cuidador criado deve nascer `active = true`;
- a role criada em `tenant_users` deve ser `caregiver`.

## APIs planejadas

- `POST /api/invitations`
- `GET /api/invitations?tenantId=...`
- `GET /api/invitations/[token]`
- `POST /api/invitations/[token]/accept`
- `POST /api/auth/login`

## UI planejada

### Coordenação

- painel de geração de convites dentro da tela de tenants
- listagem de convites ativos por tenant

### Pública

- rota `/convite/[token]`
- formulário de aceite do convite

## Critério de pronto

- coordenação gera link para um tenant
- cuidador abre o link
- preenche seus dados
- define senha
- cadastro é concluído
- conta fica apta para login
- tenant e caregiver ficam corretamente relacionados
