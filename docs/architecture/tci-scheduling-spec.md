# TCI Scheduling Spec

## Objetivo

Criar uma aba dedicada de `TCI` para organizar:

- agenda semanal;
- grupos ou acoes de TCI;
- camaras de energizacao;
- cuidadores envolvidos em cada encontro;
- status operacional de realizacao.

O foco nao e transporte nem randomizacao. O foco e gestao recorrente da operacao de TCI.

## Pergunta de produto

Se a coordenacao precisasse hoje organizar a rotina semanal de TCI, o sistema conseguiria:

- cadastrar as sessoes da semana;
- definir qual camara de energizacao sera usada;
- vincular os cuidadores responsaveis;
- acompanhar se a sessao foi planejada, confirmada ou realizada?

Se sim, a V1 atende o objetivo.

## Relacao com o modulo de saidas

`TCI` nao deve ser apenas um subtipo de `saida`.

Motivo:

- `saida` resolve distribuicao de pessoas em grupos;
- `TCI` resolve agenda recorrente e execucao de encontros;
- `TCI` precisa de calendario, recorrencia e vinculacao com camaras.

Recomendacao:

- manter modulo proprio de `TCI`;
- no futuro, se necessario, permitir que uma sessao de TCI gere uma `saida` derivada.

## Contexto atual

Hoje o sistema ja possui:

- tenants;
- cuidadores;
- membros;
- contatos;
- acompanhamentos;
- modulo inicial de saidas.

Nao existe ainda:

- agenda semanal estruturada;
- entidade de TCI;
- camaras de energizacao;
- vinculacao operacional de cuidadores por sessao;
- controle de realizacao das sessoes.

## Escopo da V1

### Entra

- nova aba `TCI` para coordenacao;
- cadastro de camaras de energizacao;
- cadastro de sessoes de TCI;
- definicao de data e horario;
- vinculacao de um ou mais cuidadores;
- observacoes operacionais;
- status da sessao;
- visualizacao semanal;
- filtro por localidade, cuidador, status e camara.

### Nao entra agora

- notificacoes automaticas;
- integracao com Google Calendar;
- lembretes por WhatsApp;
- lista de presenca avancada;
- formularios clinicos;
- assinatura digital;
- indicadores analiticos complexos;
- automacao de remarcacao.

## Linguagem do dominio

### Termos principais

- `TCI`
  - modulo de agenda e operacao
- `Sessao TCI`
  - encontro agendado
- `Camara de energizacao`
  - recurso fisico ou operacional usado na sessao
- `Equipe responsavel`
  - cuidadores vinculados a sessao
- `Agenda semanal`
  - visao principal do modulo

## Casos de uso

### 1. Coordenacao cadastra camaras de energizacao

Campos minimos:

- nome
- localidade
- descricao opcional
- capacidade opcional
- ativa: sim/nao

### 2. Coordenacao cria uma sessao de TCI

Campos minimos:

- tenant
- titulo
- descricao opcional
- data
- horario inicial
- horario final
- camara de energizacao
- cuidadores responsaveis
- observacoes

### 3. Coordenacao visualiza agenda semanal

A agenda deve mostrar:

- sessoes da semana;
- camara utilizada;
- cuidadores responsaveis;
- status operacional.

### 4. Coordenacao altera status da sessao

Status recomendados:

- `draft`
- `scheduled`
- `confirmed`
- `completed`
- `cancelled`

### 5. Coordenacao reprograma a sessao

Permitir:

- mudar data;
- mudar horario;
- trocar camara;
- trocar equipe responsavel.

## Modelo de dados recomendado

### 1. TciChamber

Campos:

- `id`
- `tenant_id`
- `name`
- `description`
- `capacity` opcional
- `active`
- `created_at`
- `updated_at`

### 2. TciSession

Campos:

- `id`
- `tenant_id`
- `title`
- `description`
- `scheduled_date`
- `starts_at`
- `ends_at`
- `chamber_id`
- `status`
- `notes`
- `created_by_tenant_user_id`
- `created_at`
- `updated_at`

### 3. TciSessionCaregiver

Tabela de relacionamento entre sessao e cuidadores.

Campos:

- `id`
- `tci_session_id`
- `caregiver_id`
- `role` opcional
  - ex: `leader`, `support`
- `created_at`

### 4. TciSessionOccurrence

Opcional para V1.

So entra se quisermos historico de execucao separado do agendamento.

Na V1, pode ficar fora e usar apenas `TciSession`.

## Regras de negocio

### Regra 1. Sessao pertence a um tenant

Nao pode existir sessao compartilhada entre localidades na V1.

### Regra 2. Camara tambem pertence ao tenant

Uma sessao so pode usar camara da mesma localidade.

### Regra 3. Cuidador vinculado precisa pertencer ao tenant

Evita composicao operacional cruzada entre localidades.

### Regra 4. Nao permitir conflito de horario na mesma camara

Se ja existir sessao marcada no mesmo intervalo:

- bloquear criacao;
- ou exigir reprogramacao.

### Regra 5. Sessao cancelada nao conta como realizada

Isso impacta dashboards futuros.

### Regra 6. Sessao concluida deve ficar somente leitura parcial

Permitir editar observacoes, mas nao reescrever toda a agenda sem acao explicita de reabertura.

## Estados da sessao

### `draft`

Sessao criada, ainda sem confirmacao final.

### `scheduled`

Sessao agendada com horario e equipe definidos.

### `confirmed`

Sessao validada para acontecer.

### `completed`

Sessao realizada.

### `cancelled`

Sessao cancelada.

## UI recomendada

### Aba principal `TCI`

Deve entrar na navegacao da coordenacao como modulo proprio.

### Tela 1. Agenda semanal

Componentes:

- seletor de semana;
- cards ou grade por dia;
- filtros por status, camara e cuidador;
- CTA `Nova sessao`.

### Tela 2. Cadastro de sessao

Campos:

- localidade
- titulo
- data
- horario inicial
- horario final
- camara
- cuidadores responsaveis
- observacoes

### Tela 3. Cadastro de camaras

CRUD simples:

- criar;
- editar;
- ativar/inativar.

## Mobile first

### No mobile

- agenda em cards por dia, nao em grade complexa;
- filtros em drawer ou sheet;
- criacao de sessao em formulario linear;
- cards da sessao com:
  - titulo
  - horario
  - camara
  - cuidadores
  - status

## APIs sugeridas

### Camaras

- `GET /api/tci/chambers`
- `POST /api/tci/chambers`
- `PUT /api/tci/chambers/[chamberId]`

### Sessoes

- `GET /api/tci/sessions`
- `POST /api/tci/sessions`
- `GET /api/tci/sessions/[sessionId]`
- `PUT /api/tci/sessions/[sessionId]`
- `PATCH /api/tci/sessions/[sessionId]/status`

### Filtros recomendados

Para `GET /api/tci/sessions`:

- `tenantId`
- `weekStart`
- `caregiverId`
- `chamberId`
- `status`

## Permissoes

### Coordenacao

Pode:

- criar camaras;
- criar sessoes;
- editar agenda;
- definir equipe;
- concluir ou cancelar sessoes.

### Cuidador

Na V1:

- apenas leitura das sessoes onde estiver vinculado, se exposto.

## Dashboard futuro

Esse modulo permite responder depois:

- quantas sessoes de TCI foram realizadas na semana;
- quais cuidadores estao mais alocados;
- quais camaras estao mais usadas;
- quantas sessoes foram canceladas;
- taxa de execucao da agenda semanal.

## Testes recomendados

### Unitarios

- bloqueia conflito de horario na mesma camara;
- aceita sessoes em camaras diferentes no mesmo horario;
- impede vincular cuidador de outro tenant;
- muda status corretamente;
- bloqueia status invalido.

### Integracao

- cria camara;
- cria sessao;
- vincula cuidadores;
- lista agenda da semana;
- altera status para `completed`;
- bloqueia sessao conflitante na mesma camara.

## Fases de implementacao

### Fase 1

- spec
- modelo de dados
- CRUD de camaras
- CRUD de sessoes
- agenda semanal simples

### Fase 2

- filtros avancados
- visao do cuidador
- reprogramacao rapida

### Fase 3

- indicadores
- recorrencia
- integracoes externas

## Decisoes praticas recomendadas

1. Tratar `TCI` como modulo proprio e nao como gambiarra dentro de `saidas`.
2. Separar `camara` de `sessao`, porque a mesma camara sera reutilizada ao longo do tempo.
3. Modelar relacao muitos-para-muitos entre sessao e cuidadores.
4. Priorizar agenda semanal mobile first como tela principal.
5. Deixar recorrencia fora da V1 para manter entrega objetiva.

## Risco principal

Se esse modulo nascer apenas como um campo extra em `saidas`, a agenda semanal vai ficar mal modelada e dificil de evoluir.

O ponto central aqui nao e montar grupo. E organizar a operacao recorrente de TCI com recurso fisico, horario e equipe.

Essa diferenca precisa guiar a implementacao.
