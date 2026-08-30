# Outing Group Randomization Spec

## Objetivo

Criar uma funcionalidade para montagem de `grupos de saida` com distribuicao semi-automatizada.

O sistema deve:

- montar grupos a partir de participantes elegiveis;
- respeitar restricoes de pessoas que nao podem ser separadas;
- considerar quem possui carro para apoiar a logistica;
- permitir randomizacao controlada;
- permitir ajuste manual antes de confirmar a distribuicao final.

## Pergunta de produto

Se a coordenacao precisasse hoje montar grupos para uma saida social, visita ou acao externa, o sistema conseguiria:

- montar grupos rapidamente;
- reduzir erro manual;
- respeitar casais e vinculos obrigatorios;
- equilibrar os grupos com base em motoristas e capacidade?

Se sim, a funcionalidade atende o objetivo.

## Contexto atual

Hoje o produto possui:

- tenants;
- cuidadores;
- membros;
- contatos;
- followups.

Nao existe ainda um modulo de:

- participacao em evento;
- grupos de saida;
- restricoes entre pessoas;
- disponibilidade de carro;
- capacidade de transporte.

## Escopo da V1

### Entra

- criar um evento de saida;
- selecionar participantes;
- marcar participantes que nao podem ser separados;
- marcar quem tem carro;
- informar capacidade do carro;
- gerar grupos automaticamente;
- revisar e ajustar manualmente;
- salvar a composicao final.

### Nao entra agora

- roteirizacao geografica;
- integracao com mapa e tempo de deslocamento;
- otimizacao matematica avancada;
- notificacao automatica por WhatsApp ou email;
- historico analitico complexo de saidas;
- alocacao multi-turno.

## Linguagem do dominio

### Termos principais

- `Saida`
  - evento de organizacao
- `Participante`
  - pessoa candidata a entrar em grupo
- `Grupo de saida`
  - grupo final montado para o evento
- `Vinculo inseparavel`
  - duas ou mais pessoas que precisam ficar juntas
- `Motorista`
  - participante com carro e capacidade informada

## Casos de uso

### 1. Coordenacao cria uma saida

Campos minimos:

- nome da saida
- tenant
- data
- descricao opcional
- tamanho alvo do grupo
- permitir grupos sem carro: sim/nao

### 2. Coordenacao seleciona participantes

Participantes podem vir de:

- cuidadores;
- membros;
- participantes avulsos sem cadastro previo;
- opcionalmente outras pessoas operacionais no futuro.

Exemplos de participante avulso:

- visitante;
- voluntario externo;
- familiar;
- amigo convidado;
- apoio operacional do dia.

Isso e importante porque a montagem da saida nao pode depender apenas de pessoas ja cadastradas no CRM principal.

### 3. Coordenacao informa restricoes

Exemplos:

- casal que nao pode se separar;
- familia que deve ficar junta;
- lider e auxiliar que precisam ir no mesmo grupo.

### 4. Coordenacao informa capacidade de carro

Por participante:

- tem carro: sim/nao
- numero de vagas alem do motorista

### 5. Sistema gera sugestao de grupos

A sugestao deve:

- manter os vinculos juntos;
- distribuir motoristas;
- respeitar limite de capacidade;
- buscar equilibrio entre grupos;
- randomizar o restante.

### 6. Coordenacao revisa e ajusta

Ajustes manuais:

- mover participante entre grupos;
- trocar motorista;
- recriar grupos;
- regenerar mantendo restricoes.

### 7. Coordenacao confirma

Ao confirmar:

- a distribuicao vira versao oficial da saida;
- os grupos ficam congelados ate nova edicao.

## Modelo de dados recomendado

### 1. OutingEvent

Representa a saida.

Campos:

- `id`
- `tenant_id`
- `name`
- `description`
- `scheduled_for`
- `target_group_size`
- `allow_groups_without_car`
- `status`
  - `draft`
  - `generated`
  - `confirmed`
  - `cancelled`
- `created_by_tenant_user_id`
- `created_at`
- `updated_at`

### 2. OutingParticipant

Representa a participacao de uma pessoa numa saida.

Campos:

- `id`
- `outing_event_id`
- `participant_type`
  - `caregiver`
  - `member`
  - `guest`
- `participant_id`
- `display_name`
- `first_name` opcional
- `last_name` opcional
- `phone`
- `email` opcional
- `has_car`
- `car_seats`
  - quantidade de vagas disponiveis alem do motorista
- `is_driver`
  - derivado de `has_car`, mas pode ser persistido
- `notes`
- `locked_group_id` opcional
- `created_at`

Observacao:

`display_name` e `phone` devem ser snapshot no momento da saida. Isso evita inconsistencias se o cadastro principal mudar depois.

Regra de identificacao:

- se `participant_type = caregiver|member`, `participant_id` aponta para o cadastro de origem;
- se `participant_type = guest`, `participant_id` pode ser `null`;
- para `guest`, a saida precisa persistir os dados minimos diretamente em `OutingParticipant`.

Campos minimos recomendados para `guest`:

- `display_name`
- `phone` opcional
- `email` opcional
- `notes` opcional

### 3. OutingConstraintGroup

Representa um bloco de participantes que nao pode ser separado.

Campos:

- `id`
- `outing_event_id`
- `label`
  - ex: `Casal Joao e Maria`
- `constraint_type`
  - `must_stay_together`
- `created_at`

### 4. OutingConstraintGroupMember

Relaciona participantes ao bloco inseparavel.

Campos:

- `id`
- `constraint_group_id`
- `outing_participant_id`

### 5. OutingGroup

Representa um grupo gerado para a saida.

Campos:

- `id`
- `outing_event_id`
- `name`
  - ex: `Grupo 1`
- `driver_participant_id` opcional
- `car_capacity_total` opcional
- `sort_order`
- `created_at`

### 6. OutingGroupAssignment

Relaciona participantes ao grupo final.

Campos:

- `id`
- `outing_group_id`
- `outing_participant_id`
- `assigned_by`
  - `system`
  - `manual`
- `created_at`

## Regras de negocio

### Regra 1. Vinculo inseparavel sempre vence a randomizacao

Se duas pessoas estao no mesmo `constraint group`, elas devem cair no mesmo grupo final.

### Regra 2. Capacidade do carro precisa ser respeitada

Se o grupo usa carro:

- total de pessoas no grupo <= motorista + vagas disponiveis

Convencao sugerida:

- `car_seats = 4` significa 4 passageiros alem do motorista
- capacidade total do grupo = `1 + car_seats`

### Regra 3. Participante sem carro pode entrar em grupo com carro

Isso e o comportamento padrao.

### Regra 4. Participante avulso e valido para a saida

O sistema deve permitir adicionar participantes sem cadastro previo.

Esses participantes:

- podem entrar em grupos normalmente;
- podem participar de vinculos inseparaveis;
- podem ser marcados como motorista;
- nao precisam virar membro ou cuidador automaticamente.

### Regra 5. Motoristas devem ser distribuidos primeiro

Antes da randomizacao geral:

- distribuir os motoristas;
- abrir grupos com base neles;
- depois preencher os grupos com os demais participantes.

### Regra 6. Se `allow_groups_without_car = false`, todo grupo precisa ter motorista

Se faltar motorista:

- o sistema nao confirma a geracao;
- deve retornar aviso de inviabilidade.

### Regra 7. Restricao de bloco nao pode estourar capacidade

Se um casal ou grupo inseparavel tiver tamanho maior que a capacidade de qualquer carro disponivel:

- o sistema deve bloquear a geracao automatica;
- deve apontar qual bloco esta inviavel.

### Regra 8. Edicao manual pode mover, mas validacao final continua obrigatoria

O usuario pode reorganizar, mas ao confirmar:

- restricoes devem continuar validas;
- capacidade deve continuar valida.

### Regra 9. Duplicidade precisa considerar participante avulso

Para `guest`, como pode nao haver `participant_id`, a validacao de duplicidade deve considerar:

- `display_name`
- `phone`, quando informado
- `email`, quando informado

Na V1, a abordagem pragmatica e:

- impedir duplicidade exata por `participant_type + participant_id`, quando houver origem cadastrada;
- para `guest`, impedir duplicidade exata por combinacao normalizada de `display_name + phone`.

## Estrategia de geracao

### Passo 1. Preparar unidades de alocacao

Antes de sortear individualmente:

- transformar participantes em `unidades`;
- uma unidade pode ser:
  - uma pessoa sozinha
  - um bloco inseparavel com 2 ou mais pessoas

### Passo 2. Validar viabilidade

Validacoes iniciais:

- existem participantes?
- existem motoristas suficientes?
- algum bloco inseparavel excede a capacidade maxima?

### Passo 3. Criar grupos-base

Prioridade:

- um grupo por motorista disponivel
- ou quantidade de grupos derivada de:
  - numero de motoristas
  - tamanho alvo

### Passo 4. Distribuir blocos com motorista

Se existir bloco que contem motorista e acompanhante inseparavel:

- ele deve entrar primeiro no grupo daquele motorista.

### Passo 5. Randomizar o restante

Randomizacao controlada:

- embaralhar unidades restantes;
- inserir sempre no grupo com menor ocupacao valida;
- respeitar capacidade maxima do grupo.

### Passo 6. Balancear

Ajuste final:

- reduzir diferenca de tamanho entre grupos;
- evitar um grupo muito cheio e outro muito vazio;
- preservar restricoes.

## Algoritmo recomendado para V1

### Abordagem pragmatica

Nao usar solver complexo agora.

Usar heuristica simples:

1. construir unidades inseparaveis
2. ordenar motoristas por capacidade desc
3. criar grupos iniciais com motoristas
4. embaralhar unidades nao alocadas
5. inserir cada unidade no menor grupo viavel
6. se nao houver grupo viavel:
   - criar grupo sem carro, se permitido
   - senao falhar com erro explicito

Essa abordagem e suficiente para V1:

- facil de explicar;
- facil de testar;
- facil de depurar;
- custo tecnico baixo.

## UI recomendada

### Tela 1. Lista de saidas

- nome
- data
- tenant
- status
- total de participantes
- total de grupos
- acoes:
  - abrir
  - editar
  - duplicar
  - cancelar

### Tela 2. Criar/editar saida

Blocos:

- dados da saida
- participantes selecionados
- participantes avulsos adicionados manualmente
- restricoes
- motoristas e capacidade
- acao `Gerar grupos`

No bloco de participantes, a UI deve permitir dois caminhos:

- selecionar de listas existentes
- adicionar participante avulso

Campos minimos do participante avulso na UI:

- nome
- sobrenome opcional
- telefone opcional
- email opcional
- tem carro: sim/nao
- vagas no carro
- observacoes

### Tela 3. Resultado da geracao

Visual:

- cards por grupo
- nome do motorista
- capacidade
- lista de participantes
- alertas de validacao

Acoes:

- regenerar
- mover participante
- trocar motorista
- confirmar grupos

## Mobile first

### No mobile

- usar cards empilhados por grupo;
- cada participante como linha compacta;
- acoes manuais em sheet;
- feedback visual de capacidade:
  - `3/5`
  - `lotado`
  - `sem motorista`

## APIs sugeridas

### Saidas

- `POST /api/outings`
- `GET /api/outings`
- `GET /api/outings/[outingId]`
- `PUT /api/outings/[outingId]`
- `DELETE /api/outings/[outingId]`

### Participantes e restricoes

- `POST /api/outings/[outingId]/participants`
- `DELETE /api/outings/[outingId]/participants/[participantId]`
- `POST /api/outings/[outingId]/constraints`
- `DELETE /api/outings/[outingId]/constraints/[constraintId]`

Payloads recomendados para participantes:

Origem cadastrada:

- `participantType: "caregiver" | "member"`
- `participantId: string`
- `hasCar: boolean`
- `carSeats: number`

Participante avulso:

- `participantType: "guest"`
- `displayName: string`
- `phone?: string`
- `email?: string`
- `hasCar: boolean`
- `carSeats: number`
- `notes?: string`

### Geracao

- `POST /api/outings/[outingId]/generate`
- `POST /api/outings/[outingId]/assignments/move`
- `POST /api/outings/[outingId]/confirm`

## Permissoes

### Coordenacao

Pode:

- criar saida
- editar participantes
- gerar grupos
- ajustar manualmente
- confirmar

### Cuidador

Na V1:

- apenas leitura, se exposto

## Validacoes criticas

- participante nao pode entrar duas vezes na mesma saida;
- bloco inseparavel nao pode ter participante repetido;
- motorista precisa existir entre os participantes;
- capacidade nao pode ser negativa;
- participante avulso precisa ter ao menos nome preenchido;
- grupo confirmado nao pode ser alterado sem voltar para estado editavel.

## Testes recomendados

### Unitarios

- monta bloco inseparavel corretamente;
- respeita capacidade do carro;
- falha quando bloco e maior que qualquer carro;
- distribui motoristas antes dos demais;
- randomizacao nao separa casal.

### Integracao

- cria saida;
- adiciona participantes;
- adiciona participante avulso;
- cria restricao de casal;
- gera grupos;
- confirma resultado;
- edita manualmente e revalida.

## Fases de implementacao

### Evidencia de implementacao da revisao manual

- a composicao manual e persistida atomicamente por `PUT /api/outings/[outingId]/groups`;
- a coordenacao pode criar e remover grupos, distribuir participantes e trocar o motorista antes da confirmacao;
- participantes podem permanecer temporariamente em `Sem grupo` durante a revisao, mas a confirmacao continua exigindo distribuicao completa;
- grupos confirmados ou saidas concluidas nao aceitam alteracao manual;
- atribuicoes manuais usam `outing_assignment_source = manual` e preservam o modelo de dados existente;
- vinculos inseparaveis, presenca de motorista e capacidade continuam validados na confirmacao.

### Fase 1

- spec
- modelo de dados
- geracao automatica simples
- revisao manual basica

### Fase 2

- filtros por evento e status
- duplicar saida
- salvar presets de restricao

### Fase 3

- uso de localizacao para otimizar agrupamento
- sugestao geografica
- compartilhamento dos grupos

## Decisoes praticas recomendadas

1. Tratar casal e grupos inseparaveis como `blocos`, nao como excecao.
2. Permitir participante avulso como tipo nativo do dominio, nao como gambiarra.
3. Persistir snapshot de nome e telefone no participante da saida.
4. Persistir capacidade do carro no contexto da saida, nao apenas no cadastro global da pessoa.
5. Separar `gerar` de `confirmar`.
6. Permitir ajuste manual antes da confirmacao.

## Risco principal

Se tentarmos resolver isso com randomizacao pura, sem modelo de restricao, o sistema vai falhar exatamente nos cenarios mais sensiveis.

O ponto central da funcionalidade nao e "sortear pessoas". E "sortear sem quebrar regras de convivio e logistica".

Essa diferenca precisa guiar a implementacao.
