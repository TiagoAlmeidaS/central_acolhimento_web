# Relatorio diario de saidas e novos contatos

- **Versao:** 1.0
- **Status:** Implementada na versao 0.2.0
- **Owner funcional:** Coordenacao da Central de Acolhimento
- **Data:** 2026-08-15
- **Ultima atualizacao:** 2026-08-15 — implementacao e validacao concluidas
- **Documentos relacionados:** [Outing Group Randomization Spec](outing-group-randomization-spec.md), [Dashboard da Igreja](church-dashboard-care-analysis-spec.md) e [Contatos e membros](contacts-members-listing-spec.md)
- **Identificador do relatorio:** `daily-outing-v1`

## Resumo executivo

O modulo de Saidas organiza eventos, participantes, carros e grupos, mas nao registra de forma estruturada o tipo da acao, a realizacao da saida nem quais novos contatos foram gerados por ela. O Dashboard tambem nao consegue produzir um relatorio diario confiavel dessa operacao.

Esta versao cria tipos de saida cadastraveis, separa a confirmacao dos grupos da conclusao da execucao, vincula novos contatos a sua saida de origem e adiciona ao Dashboard um relatorio diario imprimivel em PDF. O relatorio apresenta as saidas realizadas, participantes, novos contatos, faixa etaria adolescente, casas abertas, distribuicao por tipo e mapa das casas com coordenadas.

## Intencao confirmada

- **Problema:** a coordenacao nao consegue consolidar o resultado diario das saidas sem cruzamento manual.
- **Ator:** coordenadores autenticados, dentro das igrejas/localidades a que possuem acesso.
- **Job to be done:** ao encerrar o dia ou uma acao, gerar um relatorio que mostre o que saiu e quais novos contatos foram produzidos.
- **Resultado desejado:** um PDF verificavel, filtrado por dia, com resumo, detalhamento e mapa.
- **Valor:** acompanhamento da mobilizacao, melhor encaminhamento das casas abertas e rastreabilidade da origem dos contatos.
- **Decisoes confirmadas:** tipos de saida sao cadastraveis; `adolescente` e uma faixa etaria derivada do contato, independentemente do tipo da saida.

## Estado atual e evidencias

### Capacidade existente

- `outing_events` registra nome, data planejada, status e configuracao de grupos.
- `outing_participants` registra membros, cuidadores e participantes avulsos.
- grupos podem ser gerados e confirmados em `/coord/saidas`.
- `seeds` registra novos contatos, idade, origem, primeiro contato, casa aberta, endereco e coordenadas.
- o Dashboard da coordenacao ja possui mapa Leaflet/OpenStreetMap e escopo por tenant.
- coordenadores podem acessar mais de um tenant comprovadamente vinculado.

### Capacidade parcial

- `confirmed` em Saidas confirma a composicao dos grupos; nao comprova que a acao foi realizada.
- `source` em novos contatos e texto livre; pode mencionar uma saida, mas nao cria relacionamento confiavel.
- o mapa existente mistura membros e contatos e depende de recursos externos carregados no navegador.

### Capacidade ausente

- tipos de saida cadastraveis;
- conclusao operacional de uma saida;
- chave estrangeira entre novo contato e saida;
- consulta agregada do relatorio diario;
- pagina de relatorio e exportacao PDF;
- auditoria minima de quem concluiu a saida.

### Evidencias primarias

- `supabase/migrations/20260712152000_add_outings_module.sql`
- `src/server/domain/mvp.ts`
- `src/server/repositories/outing-repository.ts`
- `src/server/repositories/mvp-repository.ts`
- `src/app/(app)/coord/saidas/page.tsx`
- `src/app/(app)/coord/page.tsx`
- `src/ui/mvp/outing-manager.tsx`
- `src/ui/mvp/contact-manager.tsx`
- `src/ui/mvp/dashboard-map.tsx`
- `src/server/auth/access-scope.ts`

## Objetivos

- **OBJ-01:** relacionar cada novo contato, quando aplicavel, a uma unica saida de origem.
- **OBJ-02:** distinguir saida planejada/confirmada de saida efetivamente realizada.
- **OBJ-03:** gerar um relatorio diario consistente por tenant e tipo de saida.
- **OBJ-04:** identificar contatos adolescentes e casas abertas sem inferencia por texto livre.
- **OBJ-05:** entregar uma visualizacao adequada a tela e PDF.

Metricas de qualidade:

- percentual de novos contatos do dia com saida vinculada;
- quantidade de casas abertas sem coordenadas, exibida como pendencia de mapa;
- relatorios gerados sem erro;
- bloqueios de acesso cross-tenant.

Nao ha meta numerica definida nesta versao.

## Escopo

### Dentro do escopo

- CRUD basico de tipos de saida por tenant;
- tipo obrigatorio nas novas saidas;
- conclusao e reabertura operacional de saidas;
- selecao opcional da saida ao criar/editar um novo contato;
- validacao de tenant entre saida e contato;
- filtro diario no timezone operacional;
- resumo por tipo de saida;
- total de participantes das saidas realizadas;
- novos contatos criados no dia e vinculados a essas saidas;
- adolescentes com idade entre 12 e 17 anos, inclusive;
- contatos com idade desconhecida em contador separado;
- casas abertas e mapa das que possuem coordenadas;
- botao `Gerar relatorio` no Dashboard;
- pagina imprimivel e exportacao pelo dialogo de impressao/salvar como PDF;
- estados vazio, carregando, erro e mapa indisponivel;
- testes de regra, API, tenancy e interface.

### Fora do escopo

- envio automatico por WhatsApp ou email;
- armazenamento do arquivo PDF no servidor;
- assinatura digital;
- comparacao semanal ou mensal nesta primeira versao;
- deduplicacao de domicilios por endereco;
- roteirizacao e otimizacao geografica;
- relatorio nominal publico ou uso em telao;
- alteracao retroativa automatica de contatos existentes com base no campo `source`.

### Nao objetivos

- medir valor espiritual ou desempenho individual;
- substituir o cadastro detalhado do contato;
- tratar cada contato com `openHouse = true` como uma residencia unica comprovada.

## Atores, permissoes e tenancy

### Coordenacao

- deve estar autenticada com role `coordinator`;
- pode administrar tipos, concluir saidas, vincular contatos e gerar relatorios nos tenants acessiveis;
- ao informar `tenantId`, o servidor deve validar o acesso com a lista de memberships do usuario;
- IDs enviados pelo cliente nao substituem validacao de ownership.

### Cuidador

- fica fora da interface de relatorios da V1;
- nao pode acessar os novos endpoints de administracao e relatorio.

### Cross-tenant

- tipo, saida e contato devem pertencer ao mesmo tenant;
- recurso fora do escopo deve retornar acesso negado ou nao encontrado sem expor dados;
- o relatorio nao deve combinar tenants silenciosamente: a localidade deve ser selecionada e aparecer no cabecalho.

## Guardrails

- preservar o monolito Next.js e o padrao de Route Handlers/repositories existente;
- migrations devem ser aditivas e compativeis com dados atuais;
- PII nominal deve aparecer apenas para coordenadores autenticados;
- o PDF nao deve incluir telefone por padrao; endereco aparece apenas para casas abertas;
- notas livres nao entram no resumo nem em telemetria;
- datas civis usam `America/Sao_Paulo` nesta versao, ate existir timezone configuravel por tenant;
- contagens devem ser calculadas no servidor;
- o mapa deve apresentar atribuicao do OpenStreetMap e fallback textual quando tiles falharem;
- o botao de impressao so deve ser habilitado depois que o conteudo do relatorio estiver pronto;
- o relatorio deve registrar claramente sua versao e horario de geracao.

## Regras de negocio e invariantes

- **RN-01:** nomes de tipos de saida ativos devem ser unicos por tenant, ignorando maiusculas/minusculas.
- **RN-02:** tipo de saida inativo permanece no historico, mas nao pode ser selecionado em nova saida.
- **RN-03:** novas saidas devem possuir `outing_type_id`; saidas legadas podem permanecer sem tipo e aparecem como `Nao classificada`.
- **RN-04:** `confirmed` continua significando grupos confirmados; `completed_at` comprova a execucao da saida.
- **RN-05:** somente saida confirmada pode ser concluida. Saida cancelada nao pode ser concluida.
- **RN-06:** concluir novamente uma saida ja concluida e idempotente e nao altera autor/data originais.
- **RN-07:** reabrir a execucao limpa `completed_at` e `completed_by_tenant_user_id`, sem alterar grupos.
- **RN-08:** um novo contato pode pertencer a no maximo uma saida de origem na V1.
- **RN-09:** contato e saida vinculados devem pertencer ao mesmo tenant.
- **RN-10:** `source` continua sendo descricao humana e nao substitui `outing_event_id`.
- **RN-11:** o relatorio de uma data inclui saidas cujo `completed_at`, convertido para o timezone operacional, cai na data selecionada.
- **RN-12:** novos contatos do relatorio sao `seeds` vinculados a essas saidas e cujo `created_at`, no mesmo timezone, cai na data selecionada.
- **RN-13:** adolescente e o contato com idade conhecida entre 12 e 17 anos, inclusive.
- **RN-14:** idade nula nao e adolescente nem adulto e deve aparecer como `Idade nao informada`.
- **RN-15:** `Casas abertas` conta registros de contato com `open_house = true`; nao afirma unicidade de domicilio.
- **RN-16:** somente casas abertas com latitude e longitude validas geram marcador no mapa.
- **RN-17:** casas abertas sem coordenadas permanecem na lista e entram no contador `Sem localizacao no mapa`.
- **RN-18:** participantes sao contados de forma unica dentro de cada saida; a mesma pessoa em duas saidas do dia conta duas participacoes, mas o relatorio deve rotular a metrica como `participacoes`.
- **RN-19:** relatorio sem saidas realizadas deve mostrar zero e estado vazio, nunca dados de outro dia ou tenant.
- **RN-20:** dados alterados antes de uma nova geracao aparecem na nova versao do PDF; arquivos anteriormente salvos pelo usuario nao sao alterados.

## Experiencia e arquitetura da informacao

### Dashboard `/coord`

- adicionar `Gerar relatorio` no cabecalho das operacoes;
- o botao abre `/coord/relatorios/saidas?date=AAAA-MM-DD&tenantId=...`;
- por padrao, usar o dia atual e o tenant ativo;
- o botao deve possuir nome acessivel e foco visivel.

### Relatorio `/coord/relatorios/saidas`

Ordem do conteudo:

1. cabecalho com igreja/localidade, data, versao e horario de geracao;
2. controles de data e localidade, ocultados na impressao;
3. cards: saidas realizadas, participacoes, novos contatos, adolescentes e casas abertas;
4. distribuicao por tipo de saida;
5. tabela de saidas realizadas;
6. lista de novos contatos com nome, idade/faixa, tipo da saida e indicacao de casa aberta;
7. mapa exclusivo das casas abertas vinculadas;
8. lista de casas sem coordenadas;
9. rodape de privacidade e origem dos dados.

O mapa deve ajustar o enquadramento aos marcadores. Sem marcador, deve ser substituido por estado textual. No mobile, cards e secoes ficam empilhados; tabelas podem virar cards. Na impressao, navegacao global, filtros e botoes ficam ocultos, cores mantem contraste e secoes evitam quebra interna quando possivel.

## Fluxos

### F-01 — Cadastrar tipo e criar saida

| Campo | Descricao |
|---|---|
| Pre-condicoes | Coordenador autenticado e tenant acessivel |
| Gatilho | Coordenador cria ou seleciona um tipo ao cadastrar a saida |
| Passos | Cadastra tipo, cria saida e organiza participantes/grupos |
| Resultado | Saida possui classificacao estruturada |
| Efeitos | Escrita em `outing_types` e `outing_events.outing_type_id` |

### F-02 — Concluir saida e cadastrar contatos

| Campo | Descricao |
|---|---|
| Pre-condicoes | Saida confirmada e executada |
| Gatilho | Coordenador seleciona `Concluir saida` |
| Passos | Confirma conclusao; cadastra os contatos escolhendo a saida de origem; marca casa aberta/endereco quando aplicavel |
| Resultado | Execucao e resultados ficam relacionados |
| Efeitos | `completed_at`, autor da conclusao e `seeds.outing_event_id` |

### F-03 — Gerar relatorio do dia

| Campo | Descricao |
|---|---|
| Pre-condicoes | Coordenador autenticado |
| Gatilho | Clique em `Gerar relatorio` |
| Passos | Sistema resolve tenant/data, consulta saidas e contatos, calcula agregados, carrega mapa e libera impressao |
| Resultado | Relatorio diario visivel e pronto para salvar como PDF |
| Efeitos | Apenas leitura; nao persiste o PDF |

### Caminhos alternativos

- contato pode ser cadastrado sem saida quando sua origem nao for uma acao organizada;
- saida legada sem tipo aparece como `Nao classificada`;
- casa aberta sem coordenadas aparece na lista, mas nao no mapa;
- dia sem resultado produz relatorio valido com estado vazio;
- filtro pode selecionar outra data ou outro tenant acessivel.

### Caminhos nao felizes

| Cenario | Comportamento | Recuperacao |
|---|---|---|
| Sem autenticacao | redirecionar para login | autenticar e retornar |
| Role cuidador | negar acesso | voltar ao painel permitido |
| Tenant inacessivel | nao consultar nem revelar dados | escolher tenant acessivel |
| Tipo inativo | rejeitar em nova saida | selecionar/reativar outro tipo |
| Saida nao confirmada | bloquear conclusao com mensagem | confirmar grupos primeiro |
| Saida de outro tenant no contato | rejeitar request | selecionar saida valida |
| Data invalida | responder 400 e manter controle editavel | corrigir data |
| Falha do mapa/CDN | manter totais e lista; informar mapa indisponivel | tentar recarregar |
| Falha na consulta | nao gerar PDF parcial como se fosse completo | tentar novamente |
| Zero resultados | mostrar zeros e explicacao | trocar data/tenant |

## Requisitos funcionais

- **RF-01:** o sistema deve permitir criar, listar, editar e inativar tipos de saida por tenant.
- **RF-02:** o formulario de saida deve exigir um tipo ativo para novas saidas.
- **RF-03:** o sistema deve permitir concluir e reabrir uma saida conforme RN-04 a RN-07.
- **RF-04:** o formulario de novo contato deve permitir selecionar uma saida do mesmo tenant.
- **RF-05:** a API de contatos deve validar o relacionamento conforme RN-08 a RN-10.
- **RF-06:** o Dashboard deve exibir o botao `Gerar relatorio`.
- **RF-07:** o relatorio deve aceitar `date` e `tenantId` e calcular os dados conforme RN-11 a RN-19.
- **RF-08:** o relatorio deve exibir agregados e detalhamento por tipo.
- **RF-09:** o relatorio deve separar adolescentes, demais idades e idade nao informada.
- **RF-10:** o relatorio deve exibir casas abertas no mapa e listar as sem coordenadas.
- **RF-11:** o relatorio deve oferecer impressao/salvar como PDF em layout dedicado.
- **RF-12:** toda consulta e mutacao deve respeitar role e tenants acessiveis.
- **RF-13:** a versao `daily-outing-v1`, data de referencia e horario de geracao devem aparecer no documento.

## Requisitos nao funcionais

- **RNF-01:** agregados devem vir de uma unica resposta consistente do servidor.
- **RNF-02:** consultas devem filtrar por tenant antes de agregar.
- **RNF-03:** o relatorio deve funcionar sem JavaScript para totais e listas; apenas mapa e acao de impressao podem depender do cliente.
- **RNF-04:** falha do mapa nao deve impedir leitura ou impressao do restante.
- **RNF-05:** controles devem ser navegaveis por teclado e possuir rotulos acessiveis.
- **RNF-06:** o documento deve ser legivel em A4 retrato; mapa pode usar uma pagina em paisagem apenas se a implementacao garantir exportacao consistente.
- **RNF-07:** campos de texto exibidos no mapa devem ser escapados.
- **RNF-08:** nenhuma telemetria deve incluir nome, telefone, endereco ou notas.

## Contratos e consultas

### Dados

#### `outing_types` (nova)

- `id uuid primary key`
- `tenant_id uuid not null references tenants(id)`
- `name text not null`
- `description text not null default ''`
- `active boolean not null default true`
- `created_by_tenant_user_id uuid null`
- `created_at`, `updated_at`
- indice unico parcial por `tenant_id + lower(name)` para tipos ativos.

#### `outing_events` (alteracao)

- `outing_type_id uuid null references outing_types(id)` para compatibilidade legada;
- `completed_at timestamptz null`;
- `completed_by_tenant_user_id uuid null references tenant_users(id)`;
- indice por `tenant_id, completed_at`.

#### `seeds` (alteracao)

- `outing_event_id uuid null references outing_events(id) on delete set null`;
- indice por `tenant_id, outing_event_id, created_at`.

Nao sera feito backfill automatico por `source`, pois texto livre nao comprova a origem.

### APIs

- `GET /api/outings/types?tenantId=` — lista tipos no escopo.
- `POST /api/outings/types` — cria tipo; role coordenador.
- `PUT /api/outings/types/[typeId]` — edita ou inativa; role coordenador.
- `POST /api/outings/[outingId]/complete` — conclusao idempotente.
- `POST /api/outings/[outingId]/reopen` — reabre execucao.
- `POST|PUT /api/seeds...` — aceita `outingEventId?: string | null` e valida tenant.
- `GET /api/reports/outings/daily?date=AAAA-MM-DD&tenantId=UUID` — retorna o contrato `DailyOutingReportV1`.

`DailyOutingReportV1` deve conter:

```text
version, generatedAt, timezone, date, tenant
totals { completedOutings, participations, newContacts, adolescents,
         otherKnownAges, unknownAges, openHouses, openHousesWithoutCoordinates }
byType[] { outingTypeId, name, outings, participations, newContacts, adolescents, openHouses }
outings[] { id, name, typeName, completedAt, participationCount, newContactCount }
contacts[] { id, name, age, ageGroup, outingId, outingName, outingTypeName,
             openHouse, address, city, latitude, longitude }
```

Erros de validacao devem usar 400; sem autenticacao, 401; sem role/acesso, 403; inexistente no escopo, 404 quando apropriado; falha inesperada, 500. A implementacao deve melhorar os handlers novos para nao transformar erros conhecidos em 500.

### Consulta de referencia

1. resolver e validar tenant;
2. converter inicio/fim da data civil de `America/Sao_Paulo` para UTC;
3. selecionar `outing_events.completed_at` dentro da janela;
4. carregar tipo e contagem de participantes;
5. selecionar `seeds` vinculados a essas saidas e criados na mesma janela;
6. agregar por tipo e derivar faixa etaria;
7. retornar listas ordenadas por tipo, saida e nome.

## Observabilidade

- evento `daily_outing_report_viewed`: versao, tenantId, data, totais sem PII;
- evento `daily_outing_report_print_requested`: versao e tenantId;
- log estruturado para falha de consulta, mapa indisponivel e bloqueio cross-tenant;
- nao registrar payload nominal do relatorio.

## Seguranca e privacidade

- validar todos os IDs no servidor;
- nao aceitar `tenantId` do contato como prova de acesso;
- escapar conteudo nominal antes de inserir em popup HTML;
- evitar telefone, notas e foto da casa no PDF V1;
- manter o documento sob responsabilidade do coordenador apos salvar localmente;
- nao expor endpoints do relatorio sem sessao.

## Rollout, migracao e rollback

1. aplicar migration aditiva com campos nulos;
2. publicar repositories e APIs compativeis com saidas/contatos legados;
3. publicar tipos, conclusao e vinculo no formulario;
4. validar tenant, contagens e mapa em ambiente de homologacao;
5. liberar botao e pagina de relatorio;
6. monitorar erros de consulta e percentual sem vinculo.

Rollback de UI/API nao remove dados novos. A migration nao deve apagar colunas no rollback emergencial. Saidas sem tipo continuam legiveis.

## Estrategia de testes

### Unitarios

- janela diaria no timezone;
- classificacao 11/12/17/18 anos e idade nula;
- agregacao por tipo;
- participacoes versus pessoas unicas;
- casas abertas com e sem coordenadas.

### Integracao

- CRUD e unicidade de tipo por tenant;
- tipo inativo bloqueado em nova saida;
- concluir/reconcluir/reabrir saida;
- vincular contato e bloquear saida de outro tenant;
- relatorio inclui apenas execucao e contatos do dia;
- saida legada sem tipo;
- role cuidador e acesso cross-tenant.

### Interface/E2E

- botao no Dashboard;
- troca de data/localidade;
- estado vazio e erro;
- mapa com marcadores e fallback;
- impressao A4 sem navegacao global;
- teclado, foco e viewport mobile.

## Criterios de aceite

- **CA-01:** dado um tipo ativo, quando uma nova saida e criada, entao ela guarda esse tipo; tipo de outro tenant e rejeitado.
- **CA-02:** dada uma saida confirmada, quando o coordenador a conclui duas vezes, entao existe uma unica data/autor original de conclusao.
- **CA-03:** dada uma saida nao confirmada ou cancelada, quando se tenta concluir, entao a operacao e bloqueada com mensagem acionavel.
- **CA-04:** dado um contato e uma saida do mesmo tenant, quando o contato e salvo, entao o vinculo e persistido; cross-tenant e rejeitado.
- **CA-05:** dadas saidas concluidas hoje e em outro dia, quando o relatorio de hoje e aberto, entao somente as concluidas hoje entram nos totais.
- **CA-06:** dados contatos vinculados criados hoje e em outro dia, quando o relatorio e aberto, entao somente os criados hoje entram como novos contatos.
- **CA-07:** contatos de 12 e 17 anos entram como adolescentes; 11, 18 e idade nula nao entram.
- **CA-08:** casa aberta com coordenadas aparece no mapa; sem coordenadas aparece na lista de pendencias.
- **CA-09:** dia sem saidas produz zeros e estado vazio sem erro.
- **CA-10:** coordenador sem acesso e cuidador nao recebem dados do relatorio.
- **CA-11:** ao imprimir, o PDF mostra cabecalho, versao, totais, tipos, saidas, contatos, mapa/fallback e rodape, sem menu da aplicacao.
- **CA-12:** indisponibilidade do mapa preserva todo o relatorio textual e informa a limitacao.

## Dependencias e riscos

| Risco | Impacto | Sinal | Mitigacao |
|---|---|---|---|
| Contatos sem vinculo | subcontagem | muitos contatos do dia sem `outing_event_id` | tornar selecao visivel e medir cobertura |
| `confirmed` confundido com realizado | numero incorreto | saidas planejadas no relatorio | usar exclusivamente `completed_at` |
| Mapa externo indisponivel | PDF sem mapa | erro de CDN/tiles | fallback textual e nao bloquear impressao |
| Enderecos duplicados | casas supercontadas | mesmo endereco em varios contatos | rotular como contatos com casa aberta; entidade Casa fica futura |
| Idade ausente | adolescentes subcontados | contador desconhecido alto | exibir pendencia sem inferir idade |
| Timezone | dia incorreto perto da meia-noite | divergencia com horario local | janela UTC derivada de Sao Paulo e testes de borda |

Nao ha decisao bloqueante aberta. Futuramente deve ser decidido se o timezone passa a ser configuravel por tenant e se domicilios se tornam entidade propria.

## Entregas e fases

### Fase 1 — Fundacao confiavel

- tipos cadastraveis;
- campos de conclusao e vinculo;
- regras de tenancy e migrations.

Conclusao: criar/concluir saida e vincular contato funciona sem quebrar dados legados.

### Fase 2 — Relatorio diario V1

- consulta agregada;
- pagina, cards, tabelas e mapa;
- botao no Dashboard e impressao PDF.

Conclusao: CA-05 a CA-12 aprovados.

### Fase 3 — Qualidade operacional

- telemetria sem PII;
- indicadores de contatos sem vinculo e casas sem coordenadas;
- refinamentos a partir do uso real.

## Matriz de rastreabilidade

| Objetivo | Requisitos | Fluxo | Contratos | Criterios | Testes/telemetria |
|---|---|---|---|---|---|
| OBJ-01 | RF-04, RF-05 | F-02 | `seeds.outing_event_id` | CA-04 | integracao cross-tenant |
| OBJ-02 | RF-03 | F-02 | complete/reopen | CA-02, CA-03 | integracao de estado |
| OBJ-03 | RF-06 a RF-08 | F-03 | `DailyOutingReportV1` | CA-05, CA-06, CA-09 | API/E2E |
| OBJ-04 | RF-09, RF-10 | F-03 | ageGroup/map fields | CA-07, CA-08 | unitarios/mapa |
| OBJ-05 | RF-11 a RF-13 | F-03 | rota imprimivel | CA-10 a CA-12 | E2E/print event |

## Definition of Ready

- intencao, tipos cadastraveis e faixa adolescente aprovados;
- contratos, regras de data e tenancy definidos;
- compatibilidade com dados legados definida;
- nenhum bloqueio de produto aberto para a V1.

## Definition of Done

- migrations aplicadas sem perda de dados;
- requisitos e criterios implementados;
- testes unitarios, integracao, typecheck e lint aprovados;
- relatorio validado em desktop, mobile e impressao A4;
- nenhum vazamento cross-tenant ou PII em telemetria;
- documentacao ativa atualizada.

## Evidencias da implementacao 0.2.0

- migration aditiva criada em `supabase/migrations/20260815120000_add_daily_outing_reports.sql`;
- endpoints de tipos, conclusao, reabertura e relatorio incluidos no build de producao;
- fluxo integrado comprovado por `tests/integration/mvp-flow.test.ts`;
- regras de data, faixa etaria e agregacao comprovadas por `tests/unit/daily-outing-report.test.ts`;
- `npm test`: 21 arquivos e 106 testes aprovados;
- caminhos nao felizes automatizados: data invalida, role cuidador, tenant inacessivel, vinculo cross-tenant e conclusao em estado invalido;
- `npm run typecheck`: aprovado;
- `npx next build`: aprovado sem aplicar migration remota;
- lint focado nos arquivos da entrega: aprovado, com duas advertencias legadas de `<img>` no gerenciador de contatos;
- lint global permanece reprovado por erros preexistentes em `ui_v2` e outros componentes fora deste escopo;
- inspecao visual local: Dashboard com botao, estado vazio do relatorio, desktop e viewport mobile aprovados;
- migration nao foi aplicada a banco remoto e nenhum deploy foi executado nesta atividade.
