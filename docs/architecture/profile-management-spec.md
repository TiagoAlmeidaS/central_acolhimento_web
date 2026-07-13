# Profile Management Spec

## Objetivo

Criar um modulo de `Perfil` para dois contextos:

- colaborador da coordenacao;
- cuidador.

O modulo deve permitir visualizar e editar dados pessoais e, quando fizer sentido, dados operacionais ligados ao tenant atual.

## Pergunta de produto

Se um usuario autenticado entrasse hoje no sistema, ele conseguiria:

- ver seus dados principais;
- corrigir telefone, nome ou email;
- entender em qual localidade esta atuando;
- atualizar informacoes operacionais do proprio perfil?

Se sim, a V1 atende o objetivo.

## Contexto atual

Hoje o monolito ja possui tres camadas relacionadas a identidade:

### 1. `app_users`

Representa a identidade global.

Campos atuais relevantes:

- `first_name`
- `last_name`
- `email`
- `phone`
- `active`

### 2. `tenant_users`

Representa o vinculo do usuario com um tenant.

Campos atuais relevantes:

- `tenant_id`
- `app_user_id`
- `name`
- `email`
- `role`
- `active`

### 3. `caregivers`

Representa o cadastro operacional de cuidador dentro do tenant.

Campos atuais relevantes:

- `tenant_id`
- `tenant_user_id`
- `name`
- `phone`
- `email`
- `active`
- `notes`

## Problema atual

Hoje nao existe uma tela ou contrato formal de `perfil`.

Isso gera ambiguidade:

- parte dos dados esta em `app_users`;
- parte esta espelhada em `tenant_users`;
- parte esta em `caregivers`;
- o usuario nao tem um fluxo unico para editar os proprios dados.

## Diretriz de arquitetura

O perfil deve ser dividido em dois niveis:

### Perfil global

Dados da pessoa independentemente da localidade.

Exemplo:

- nome
- sobrenome
- email
- telefone
- senha

### Perfil operacional no tenant

Dados da pessoa no contexto da localidade atual.

Exemplo:

- papel atual
- status ativo
- observacoes operacionais
- informacoes especificas de cuidador

## Escopo da V1

### Entra

- nova area `Perfil`;
- leitura e edicao de dados pessoais do usuario logado;
- alteracao de telefone;
- alteracao de nome e sobrenome;
- visualizacao do email;
- visualizacao do tenant atual;
- visualizacao do papel atual;
- para cuidadores:
  - leitura e edicao de observacoes operacionais pessoais;
  - leitura do vinculo com o cadastro `caregiver`;
- alteracao de senha;
- versao mobile first.

### Nao entra agora

- upload de avatar;
- assinatura eletrônica;
- preferências complexas de notificacao;
- troca de email com verificacao dupla;
- historico detalhado de auditoria por campo;
- configuracoes multi-tenant em uma unica tela.

## Linguagem do dominio

### Termos principais

- `Perfil`
  - visao consolidada do usuario autenticado
- `Perfil global`
  - dados base da pessoa
- `Perfil operacional`
  - dados no contexto do tenant atual
- `Perfil de cuidador`
  - extensao operacional quando o papel atual for `caregiver`

## Personas atendidas

### 1. Colaborador da coordenacao

Precisa:

- atualizar telefone;
- confirmar nome exibido;
- ver em qual central esta atuando;
- trocar senha.

### 2. Cuidador

Precisa:

- atualizar telefone e email;
- ver a localidade vinculada;
- revisar observacoes operacionais pessoais;
- trocar senha.

## Modelo de dados recomendado

## 1. UserProfileView

Objeto agregado para resposta da API.

Campos:

- `appUserId`
- `firstName`
- `lastName`
- `fullName`
- `email`
- `phone`
- `active`
- `tenantUserId`
- `tenantId`
- `tenantName`
- `tenantCity`
- `tenantState`
- `role`
- `caregiver`
  - opcional

## 2. CaregiverProfileSection

Campos:

- `caregiverId`
- `name`
- `phone`
- `email`
- `active`
- `notes`
- `activeMembers`

## Regras de negocio

### Regra 1. `app_users` e a fonte principal de identidade

Nome, sobrenome, email e telefone do usuario devem nascer de `app_users`.

### Regra 2. `tenant_users.name` e `tenant_users.email` devem ser mantidos sincronizados

Quando o usuario editar nome ou email no perfil:

- atualizar `app_users`;
- refletir no `tenant_users` correspondente;
- refletir tambem em `caregivers`, se houver vinculo.

### Regra 3. Telefone do cuidador precisa permanecer coerente

Se o usuario atual for cuidador e editar telefone:

- atualizar `app_users.phone`;
- atualizar `caregivers.phone`.

### Regra 4. Email nao pode colidir com outro `app_user`

Se futuramente a V1 liberar edicao de email:

- validar unicidade global.

Na V1, pode ficar somente leitura para reduzir risco.

### Regra 5. Cuidador so edita o proprio bloco operacional

Um cuidador nao pode editar outro cuidador atraves da tela de perfil.

### Regra 6. Coordenacao nao muda o proprio papel pelo perfil

Papel e vinculacao continuam sendo governados por administracao do tenant, nao pela tela de perfil.

## Recomendacao pragmatica da V1

Para reduzir risco, dividir os campos em:

### Editaveis na V1

- `firstName`
- `lastName`
- `phone`
- `password`
- `caregiver.notes` apenas para o proprio cuidador, se decidirmos expor

### Somente leitura na V1

- `email`
- `role`
- `tenant`
- `active`

Essa divisao reduz impacto em autenticacao e sincronizacao de dados.

## UI recomendada

### Aba `Perfil`

Deve existir para:

- `/coord/perfil`
- `/cuidador/perfil`

Podendo reutilizar o mesmo componente base com pequenas variacoes por papel.

### Secao 1. Dados pessoais

Campos:

- nome
- sobrenome
- email
- telefone

### Secao 2. Contexto atual

Campos somente leitura:

- localidade
- cidade / estado
- papel
- status da conta

### Secao 3. Dados operacionais do cuidador

Se `role = caregiver`:

- nome operacional
- telefone operacional
- email operacional
- observacoes
- quantidade de membros ativos

### Secao 4. Seguranca

Campos:

- senha atual
- nova senha
- confirmar nova senha

## Mobile first

### No mobile

- cards empilhados;
- formulario linear;
- blocos curtos;
- CTA fixo ao final:
  - `Salvar alteracoes`
  - `Atualizar senha`

## APIs sugeridas

### Perfil

- `GET /api/profile`
- `PUT /api/profile`

### Senha

- `PATCH /api/profile/password`

## Contrato sugerido

### `GET /api/profile`

Retorna:

- dados de `app_users`;
- dados do `tenant_user` atual da sessao;
- bloco `caregiver`, quando aplicavel.

### `PUT /api/profile`

Aceita:

- `firstName`
- `lastName`
- `phone`
- `caregiverNotes` opcional

### `PATCH /api/profile/password`

Aceita:

- `currentPassword`
- `newPassword`

Valida:

- senha atual correta;
- politica minima da nova senha.

## Permissoes

### Coordenacao

Pode:

- editar os proprios dados globais;
- trocar a propria senha;
- ver contexto do tenant atual.

### Cuidador

Pode:

- editar os proprios dados globais;
- trocar a propria senha;
- editar o proprio bloco operacional permitido.

## Impacto nos dados existentes

Para suportar bem o perfil, vale formalizar o seguinte:

1. `app_users` continua dono de nome, sobrenome, email e telefone.
2. `tenant_users.name` passa a ser espelho do nome completo.
3. `caregivers.name`, `caregivers.phone` e `caregivers.email` devem ser sincronizados quando houver vinculo com o usuario atual.

## Testes recomendados

### Unitarios

- monta resposta agregada do perfil corretamente;
- atualiza nome e telefone no usuario;
- sincroniza nome completo no `tenant_user`;
- sincroniza telefone no `caregiver` quando houver vinculo;
- rejeita troca de senha com senha atual invalida.

### Integracao

- carrega perfil do coordenador;
- carrega perfil do cuidador com bloco operacional;
- atualiza telefone e reflete nos registros corretos;
- troca senha com sucesso;
- bloqueia senha atual incorreta.

## Fases de implementacao

### Fase 1

- spec
- `GET /api/profile`
- `PUT /api/profile`
- `PATCH /api/profile/password`
- tela mobile first de perfil

### Fase 2

- edicao de email com verificacao;
- avatar;
- preferencias pessoais

### Fase 3

- historico de alteracoes;
- configuracoes multi-tenant;
- seguranca avancada

## Decisoes praticas recomendadas

1. Nao tratar perfil como apenas tela visual; ele precisa consolidar tres fontes atuais.
2. Fazer `app_users` ser a fonte principal da identidade.
3. Na V1, manter email somente leitura.
4. Expor bloco extra para cuidador apenas quando houver `caregiverId` na sessao.
5. Separar atualizacao de senha em endpoint proprio.

## Risco principal

Se tentarmos editar `app_users`, `tenant_users` e `caregivers` sem regra clara de ownership, o sistema vai gerar inconsistencias de identidade.

O modulo de perfil precisa nascer com uma fonte principal bem definida e sincronizacao explicita entre as camadas.
