# Caregiver Global Signup Channel Spec

## Objetivo

Permitir que a coordenacao de um tenant disponibilize um link global, representado tambem por um QRCode, para cadastro de cuidadores.

Esse link deve:

- apontar para uma localidade especifica;
- poder ser reutilizado por varias pessoas;
- nao ser consumido quando uma pessoa concluir o cadastro;
- poder ser ativado ou desativado manualmente pela coordenacao;
- conviver com o modelo atual de convite individual sem substituir a V1.

## Contexto

Hoje o produto ja possui um fluxo de convite individual para cuidadores.

Esse fluxo atual:

- gera um token unico;
- pode expirar;
- pode ser fixado a um e-mail;
- e consumido uma unica vez.

Esse comportamento continua valido para a V1.

O novo fluxo nao deve alterar esse contrato. Ele deve nascer como uma segunda estrategia de entrada no sistema:

- `Convite individual`
- `Canal global de cadastro`

## Decisao de produto

### V1 permanece como esta

Continuar com:

- convite unitario;
- expira;
- uso unico;
- opcao de vincular a um e-mail;
- ideal para onboarding pontual e controlado.

### V2 nasce como novo modelo

Adicionar um novo tipo de entrada:

- link global por tenant;
- reutilizavel;
- adequado para recrutamento mais pratico de cuidadores;
- compartilhavel por QRCode em cultos, reunioes, treinamentos ou comunicacao interna.

## Principios

- o canal global pertence a um tenant;
- o canal global nao e consumivel por uso;
- cada cadastro concluido gera um evento proprio de adesao;
- o tenant continua isolado dos demais;
- a coordenacao precisa conseguir bloquear o canal a qualquer momento;
- o produto deve manter rastreabilidade de quem entrou por aquele canal;
- o fluxo deve ser simples para mobile first.

## Modelo conceitual

### Entidade nova: caregiver_signup_channels

Representa um canal reutilizavel de cadastro.

Campos principais:

- `id`
- `tenant_id`
- `created_by_tenant_user_id`
- `name`
- `slug` ou `token`
- `role`
- `active`
- `expires_at` opcional
- `max_uses` opcional
- `uses_count`
- `require_approval`
- `allowed_email_domain` opcional
- `created_at`
- `updated_at`

### Entidade nova: caregiver_signup_channel_uses

Representa cada utilizacao do canal global.

Campos principais:

- `id`
- `channel_id`
- `tenant_id`
- `app_user_id` opcional ate a conta ser criada
- `email`
- `status`
- `created_at`
- `approved_at` opcional
- `approved_by_tenant_user_id` opcional

Status sugeridos:

- `submitted`
- `approved`
- `rejected`

## Relacao com o dominio atual

### O que continua igual

No fim do fluxo, o sistema ainda deve criar:

- `app_users`
- `tenant_users`
- `caregivers`

Ou seja, o destino final do cadastro nao muda. O que muda e apenas a forma de entrada.

### O que nao deve ser reaproveitado diretamente

Nao e recomendado usar `caregiver_invitations` para isso.

Motivos:

- a entidade atual representa convite individual;
- o status `accepted` hoje fecha o ciclo do proprio link;
- o token atual foi desenhado para uso unico;
- o modelo atual mistura expiração, aceite e identidade do proprio convite;
- isso tornaria o fluxo global confuso e mais fragil.

## Fluxo V2 proposto

### 1. Coordenacao cria ou ativa canal global

Entrada:

- tenant
- nome do canal
- role padrao
- exigir aprovacao ou nao
- expiracao opcional
- dominio de e-mail opcional
- limite de usos opcional

Saida:

- link publico fixo
- QRCode derivado desse link

Exemplo de rota publica:

- `/cadastro/cuidador/[token]`

### 2. Cuidador abre o link ou le o QRCode

O sistema valida:

- canal existe;
- canal esta ativo;
- canal nao expirou, se houver expiracao;
- canal nao ultrapassou `max_uses`, se houver limite.

### 3. Cuidador preenche cadastro

Campos minimos:

- nome
- sobrenome
- email
- telefone/whatsapp
- senha
- confirmar senha

### 4. Sistema processa o cadastro

Se `require_approval = false`:

1. cria `app_users`
2. cria `tenant_users`
3. cria `caregivers`
4. registra uso do canal como `approved`

Se `require_approval = true`:

Opção recomendada:

1. cria o `app_users`
2. registra o uso do canal como `submitted`
3. cria vinculos operacionais apenas apos aprovacao da coordenacao

Alternativa:

1. cria tudo de imediato
2. marca `tenant_users.active = false` ate aprovacao

Recomendacao:

- preferir a primeira abordagem, porque ela separa melhor intencao de acesso e permissao operacional.

## Regras de negocio

- o canal global pode ser reutilizado por varias pessoas;
- o canal global nao muda para `accepted`;
- o status pertence ao uso, nao ao canal;
- a coordenacao pode desativar o canal a qualquer momento;
- o e-mail deve continuar unico em `app_users`;
- se houver `allowed_email_domain`, o e-mail informado precisa respeitar esse dominio;
- se houver `max_uses`, novos cadastros devem ser bloqueados ao atingir o limite;
- o canal deve ser sempre escopado ao tenant correto;
- o QRCode deve representar apenas o link do canal e nao carregar estado adicional no cliente.

## Seguranca e controle

### Controles minimos recomendados

- `active = true/false`
- expiracao opcional
- limite de usos opcional
- auditoria de usos
- aprovacao manual opcional

### Controles desejaveis em segunda etapa

- rate limit por IP
- captcha
- lista de dominios permitidos
- alerta para muitas tentativas
- revogacao individual de solicitacoes

## APIs planejadas

### Coordenacao

- `POST /api/signup-channels`
- `GET /api/signup-channels?tenantId=...`
- `PATCH /api/signup-channels/[channelId]`
- `POST /api/signup-channels/[channelId]/toggle`
- `GET /api/signup-channels/[channelId]/uses`
- `POST /api/signup-channels/[channelId]/approve/[useId]`
- `POST /api/signup-channels/[channelId]/reject/[useId]`

### Publica

- `GET /api/signup-channels/[token]`
- `POST /api/signup-channels/[token]/register`

## UI planejada

### Coordenacao

Na area de convites de cuidadores, dividir em dois blocos:

#### Bloco 1: Convite individual

- manter a implementacao atual;
- continuar exibindo validade, e-mail travado e historico de convites.

#### Bloco 2: QRCode global de cadastro

Campos:

- localidade
- nome do canal
- exigir aprovacao
- expiracao opcional
- limite de usos opcional
- dominio de e-mail opcional

Acoes:

- gerar canal
- copiar link
- baixar QRCode
- ativar/desativar
- ver usos recentes

Indicadores:

- status do canal
- total de cadastros originados
- cadastros pendentes de aprovacao

### Publica

Rota:

- `/cadastro/cuidador/[token]`

Tela:

- identidade da localidade
- explicacao do fluxo
- status do canal
- formulario de cadastro
- mensagem final clara:
  - aprovado e pronto para login
  - ou aguardando aprovacao da coordenacao

## Mobile first

O fluxo deve ser desenhado priorizando uso por celular.

Diretrizes:

- CTA principal em largura total;
- QRCode pode ser lido e abrir pagina sem friccao;
- formulario curto e direto;
- feedback de erro/sucesso visivel acima do botao principal;
- sem dependencia de hover;
- sem tabelas para a experiencia publica.

## Estrategia de migracao

### Decisao

Nao migrar a V1.

Em vez disso:

- manter `caregiver_invitations` intacto;
- adicionar `caregiver_signup_channels` como novo modulo;
- adicionar nova rota publica;
- adicionar novo bloco na UI de coordenacao.

### Vantagens

- zero quebra no fluxo atual;
- rollout incremental;
- validacao isolada do novo modelo;
- menor risco operacional;
- possibilidade de comparar adesao entre V1 e V2.

## Criterios de pronto

- coordenacao cria canal global para um tenant;
- sistema gera link publico fixo;
- sistema exibe QRCode derivado desse link;
- varias pessoas conseguem usar o mesmo link;
- o link permanece valido apos um cadastro bem-sucedido;
- cada uso gera seu proprio registro de auditoria;
- a coordenacao pode desativar o canal;
- a V1 continua funcionando sem alteracoes.

## Recomendacao final

Implementar o QRCode global como um segundo modelo de convite, nao como extensao direta do convite individual.

Essa abordagem:

- preserva a V1;
- reduz risco;
- melhora a clareza do dominio;
- cria base melhor para aprovacao, auditoria e escala futura.
