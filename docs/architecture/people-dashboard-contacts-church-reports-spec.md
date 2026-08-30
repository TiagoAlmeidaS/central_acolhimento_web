# Dashboard de Pessoas: contatos, frequência da Igreja e relatórios

- Status: Em validação
- Owner de produto: Coordenação
- Data: 2026-08-30
- Documentos relacionados: `church-members-attendance-spec.md`, `church-dashboard-care-analysis-spec.md`, `contacts-members-listing-spec.md`
- Referência comparada: `D:/projects/igreja/ceape_central/docs/architecture/northeast-regional-dashboard-spec.md`

## 1. Resumo executivo

Evoluir o Dashboard da coordenação para responder, por período e território, como as pessoas estão entrando e avançando no acolhimento e como os irmãos vinculados à Igreja estão participando das reuniões.

A entrega possui duas lentes no mesmo Dashboard: `Contatos` e `Igreja`. A navegação territorial será `estado selecionado -> cidades`, sem ranking nacional ou comparação entre estados na primeira versão. Os relatórios devem reproduzir os filtros visíveis e podem ser baixados em PDF ou CSV.

## 2. Intenção confirmada

- Problema: os dados existem em telas e módulos separados, mas a coordenação não consegue acompanhar de forma simples os contatos gerados, seus estados e atualizações, nem identificar quem reuniu ou faltou em um período.
- Ator: coordenação com acesso a uma ou mais localidades.
- Job to be done: abrir o Dashboard, selecionar período e território, compreender a situação das pessoas e obter uma lista verificável para ação ou prestação de contas.
- Resultado: indicadores consolidados, listas nominais com drill-down e exportação fiel ao recorte.
- Valor: reduzir conferência manual e apoiar cuidado humano com evidências.

### Decisões confirmadas

1. `Contato gerado` é todo contato cadastrado no período, independentemente da origem.
2. A visão territorial parte de um estado escolhido e detalha suas cidades; não compara estados entre si na V1.
3. O relatório poderá ser exportado em PDF ou CSV.
4. Frequência baixa ou ausência é evidência para revisão humana, não diagnóstico ou punição.

## 3. Estado atual e evidências

### Capacidades existentes

- `Seed` é o contato e possui `createdAt`, cidade, estado, cuidador, primeiro contato e estados `new`, `contacted`, `waiting_visit`, `in_progress`, `consolidated` e `inactive` em `src/server/domain/mvp.ts`.
- `Member` é a pessoa acolhida/membro e possui jornada `new`, `in_progress`, `consolidated` e `inactive`.
- `Followup` registra visita, ligação, mensagem, oração ou outra ação, com ocorrência e próxima ação.
- O Dashboard atual já possui abas e indicadores operacionais em `src/app/(app)/coord/page.tsx`.
- O módulo Igreja já possui vínculo, tipos de reunião, ocorrências e registros `unmarked`, `present`, `absent` e `justified`.
- A página atual já calcula frequência, tendência, pessoas para revisão e chamadas pendentes, porém diretamente na camada da página.
- A autorização já consegue resolver todos os tenants acessíveis à coordenação por `listAccessibleTenantIds`.
- A exportação CSV de membros em `src/app/api/members/export/route.ts` fornece padrão reutilizável.
- O CEAPE possui agregação territorial e preservação de período/filtro na URL, mas sua comparação entre estados não deve ser copiada literalmente.

### Capacidades parciais ou ausentes

- Não há visão analítica semanal completa dos contatos por status, cidade e atualização.
- Não há histórico próprio de transições de status; portanto, o sistema conhece o status atual, mas não consegue provar quantas mudanças ocorreram dentro de um período.
- Não há relatório unificado de contatos nem relatório nominal de frequência.
- Não há snapshot/serviço dedicado para retirar os cálculos analíticos da página.
- A visão territorial por estado e cidades ainda não foi aplicada ao Dashboard atual.

## 4. Objetivos

- OBJ-01: mostrar o volume e a situação atual dos contatos cadastrados no período.
- OBJ-02: mostrar presença e ausência da Igreja com denominador confiável.
- OBJ-03: permitir análise por estado, cidade, localidade e período sem ultrapassar o escopo de acesso.
- OBJ-04: gerar PDF ou CSV consistente com a tela.
- OBJ-05: distinguir falta real, justificativa e chamada incompleta.

Não há metas numéricas confirmadas. A avaliação inicial deve observar uso dos filtros, abertura dos detalhes e exportações concluídas/fracassadas.

## 5. Escopo

### Dentro do escopo

- Dashboard com lentes `Contatos` e `Igreja`.
- Períodos `dia`, `semana`, `mês` e intervalo personalizado nos relatórios.
- Estado obrigatório na visão territorial quando houver acesso a mais de um estado; cidade, localidade e demais filtros opcionais.
- Cards, série temporal, distribuição por status e lista nominal.
- Relatório de contatos em PDF ou CSV.
- Relatório de frequência em PDF ou CSV.
- Estado dos filtros preservado na URL.
- Drill-down de indicador para a lista que compõe o valor.
- Histórico mínimo de mudança de status para métricas futuras de transição.

### Fora do escopo

- comparação ou ranking entre estados;
- previsão, score automático ou diagnóstico pastoral;
- disparo automático de mensagens;
- alteração em massa de status a partir do relatório;
- relatórios agendados por e-mail;
- acesso do cuidador à visão agregada;
- fronteiras municipais em mapa.

## 6. Atores, permissões e território

- A V1 exige sessão de `coordinator`.
- A consulta deve usar somente `tenantIds` retornados por `listAccessibleTenantIds(session)`.
- O estado e as cidades disponíveis devem ser derivados das localidades acessíveis; parâmetros enviados pelo cliente não concedem acesso.
- Selecionar cidade refina as localidades acessíveis daquela cidade. Quando mais de uma localidade existir na mesma cidade, o usuário pode selecionar uma ou manter `Todas`.
- Recurso de tenant não acessível deve responder `403` sem retornar contagens ou nomes.
- O Dashboard não deve misturar cidades homônimas de estados diferentes.

## 7. Regras de negócio

- RN-01 — Contato gerado no período é `Seed.createdAt` dentro do intervalo no timezone `America/Sao_Paulo`, qualquer que seja a origem.
- RN-02 — O status exibido na distribuição é o status atual do contato; o rótulo deve deixar isso explícito.
- RN-03 — `Atualizado no período` exige uma data confiável de alteração. A implementação deve adicionar `updated_at` ao contrato de contato caso ainda não esteja disponível.
- RN-04 — `Mudou de status no período` somente pode ser exibido após existir histórico de transições. Não deve ser inferido de `updated_at`.
- RN-05 — Uma transição deve registrar contato, tenant, status anterior, status novo, autor e instante.
- RN-06 — Para Igreja, somente ocorrências `completed` e com chamada fechada entram no denominador.
- RN-07 — Ocorrências `scheduled`, `cancelled` ou com chamada aberta não geram falta.
- RN-08 — `unmarked` não é ausência e deve aparecer como inconsistência de chamada, se existir em ocorrência fechada.
- RN-09 — `Irmãos que reuniram` são membros elegíveis com ao menos um `present` no período.
- RN-10 — `Irmãos que faltaram` são membros elegíveis com ao menos um `absent`; a lista deve também mostrar presenças e justificativas, evitando classificar como falta contínua quem participou de outras reuniões.
- RN-11 — `Não reuniram no período` significa zero presença em ocorrências elegíveis concluídas. Se não houver ocorrência elegível, o resultado é `sem base`, não zero frequência.
- RN-12 — `Voltaram a reunir` deve ser calculado apenas quando houver regra aprovada de retorno. Hipótese reversível para V1: presença no período atual depois de zero presenças no período anterior equivalente.
- RN-13 — Frequência é `present / (present + absent + justified)`; justificadas permanecem no denominador e são exibidas separadamente.
- RN-14 — PDF e CSV devem usar os mesmos filtros e o mesmo snapshot da tela.
- RN-15 — Totais do relatório e do Dashboard devem coincidir para o mesmo instante de geração e filtros, ressalvadas mudanças concorrentes posteriores.

## 8. Experiência do Dashboard

### Cabeçalho comum

- seletor `Contatos | Igreja`;
- estado;
- cidade;
- localidade;
- período `Dia | Semana | Mês`;
- data de referência;
- ação `Gerar relatório`.

Filtros sugeridos na URL:

`/coord?view=contacts&period=week&state=PB&city=Joao%20Pessoa&tenantId=...`

### Lente Contatos

Cards:

- contatos gerados no período;
- sem cuidador;
- primeiro contato pendente;
- aguardando visita;
- atualizados no período;
- urgentes.

Blocos:

1. série de contatos gerados por dia/semana;
2. distribuição pelo status atual;
3. cidades do estado selecionado, ordenadas por contatos gerados no período;
4. lista nominal com nome, cidade, localidade, origem, status atual, cuidador, criação, primeira abordagem e última atualização;
5. após o histórico existir, bloco de transições de status no período.

### Lente Igreja

Cards:

- membros ativos da Igreja;
- pessoas que reuniram;
- pessoas sem presença no período;
- frequência média;
- ausências justificadas;
- chamadas pendentes.

Blocos:

1. tendência de presença e base elegível;
2. cidades do estado selecionado com membros ativos, presentes e sem presença;
3. lista `Reunindo`, com última presença e frequência;
4. lista `Precisam de revisão`, com faltas, justificativas, última presença e amostra;
5. filtro por tipo de reunião.

### Estados de interface

- Loading: skeleton por bloco, mantendo os filtros acessíveis.
- Vazio: explicar se não há registros, ocorrências fechadas ou localidades no recorte.
- Sem base: frequência deve exibir `—` e mensagem sobre ausência de chamada fechada.
- Erro parcial: manter blocos carregados e oferecer repetição apenas do bloco com falha.
- Dados desatualizados: mostrar horário de geração do snapshot.
- Mobile: filtros em sheet; cards em rolagem ou grade; listas viram cards; alvos de toque de pelo menos 44 px.
- Acessibilidade: controles com label, foco visível, tabelas com cabeçalhos e gráficos com resumo textual equivalente.

## 9. Relatórios

### Relatório de contatos

Resumo: filtros, período, geração, total gerado, distribuição por status, sem cuidador, primeiro contato pendente, aguardando visita e urgentes.

Detalhe nominal: nome, telefone, cidade/UF, localidade, origem, status atual, cuidador, criação, primeiro contato e última atualização.

### Relatório de frequência

Resumo: filtros, ocorrências concluídas, membros elegíveis, presentes, ausentes, justificadas, sem presença e frequência média.

Detalhe nominal: membro, cidade/UF, localidade, tipo de reunião, elegibilidades, presenças, ausências, justificativas, frequência e última presença.

### Formatos

- CSV: UTF-8, delimitador `;`, uma linha por contato ou por combinação membro/tipo de reunião; fórmulas iniciadas por `=`, `+`, `-` ou `@` devem ser neutralizadas.
- PDF: A4, cabeçalho com filtros e geração, resumo e tabela paginada; não deve cortar colunas silenciosamente.
- Nome sugerido: `dashboard-contatos-AAAA-MM-DD.{csv|pdf}` e `frequencia-igreja-AAAA-MM-DD.{csv|pdf}`.
- A interface deve permitir escolher `PDF` ou `CSV` antes de gerar.

## 10. Contratos propostos

### Snapshot do Dashboard

`GET /api/dashboard/people?view=contacts|church&period=day|week|month&referenceDate=AAAA-MM-DD&state=UF&city=...&tenantId=...&meetingTypeId=...`

Resposta comum:

```ts
type PeopleDashboardSnapshot = {
  generatedAt: string;
  timezone: "America/Sao_Paulo";
  filters: Record<string, string | null>;
  summary: Record<string, number | null>;
  timeline: Array<{ key: string; label: string; values: Record<string, number> }>;
  cities: Array<{ state: string; city: string; values: Record<string, number> }>;
  people: Array<Record<string, string | number | null>>;
  warnings: string[];
};
```

- Autenticação: coordenador.
- Tenant: sempre resolvido no servidor.
- Datas inválidas, período inválido ou estado/cidade incompatíveis: `400`.
- Tenant fora do escopo: `403`.
- Falha interna: `500` com mensagem acionável e sem PII em logs.

### Exportações

- `GET /api/reports/people/contacts?format=pdf|csv&...filtros`
- `GET /api/reports/people/church-attendance?format=pdf|csv&...filtros`

Os endpoints devem reutilizar o mesmo serviço de snapshot/consulta, não recalcular regras separadas.

### Histórico de status

Nova tabela sugerida `seed_status_history`:

- `id`, `tenant_id`, `seed_id`;
- `previous_status`, `new_status`;
- `changed_by_tenant_user_id`, `changed_at`;
- índice `(tenant_id, changed_at)` e `(seed_id, changed_at)`.

Toda alteração de status deve atualizar o contato e inserir o histórico na mesma transação. Para registros anteriores à migration, não inventar transições; o relatório informa que o histórico começa na data de ativação.

## 11. Fluxos

### F-01 — Analisar contatos da semana

- Pré-condição: coordenador autenticado e com localidade acessível.
- Gatilho: abre `Contatos`, período `Semana`, e seleciona estado/cidade.
- Passos: sistema resolve o intervalo, agrega contatos por `createdAt`, exibe status atual e lista nominal.
- Resultado: cards, gráfico, cidades e pessoas usam o mesmo recorte.
- Efeito: nenhuma escrita; registra somente telemetria sem nome/telefone.

### F-02 — Analisar frequência

- Pré-condição: existem vínculos e ocorrências.
- Gatilho: abre `Igreja` e escolhe período/tipo.
- Passos: considera apenas chamadas fechadas, resolve elegibilidade e calcula listas.
- Resultado: coordenação distingue presentes, ausentes, justificados, sem presença e sem base.
- Recuperação: chamadas pendentes possuem CTA para o módulo Igreja e não afetam a frequência.

### F-03 — Exportar

- Gatilho: escolhe PDF ou CSV.
- Passos: servidor valida filtros e autorização, gera o mesmo recorte e devolve arquivo.
- Resultado: arquivo inclui geração, filtros, resumo e detalhe.
- Falha: manter filtros, mostrar erro e permitir nova tentativa sem duplicar efeito.

### Caminhos não felizes

- Sem autenticação: redirecionar para login.
- Sem permissão: negar sem revelar nomes ou totais.
- Estado sem cidade/localidade acessível: estado vazio e opção de trocar filtro.
- Sem contatos: zeros e lista vazia, não erro.
- Sem chamada fechada: `sem base`, não frequência 0%.
- Chamada fechada com `unmarked`: warning de inconsistência e exclusão do registro ambíguo do cálculo.
- Exportação indisponível: Dashboard permanece funcional e oferece retry.
- Mudança concorrente durante exportação: `generatedAt` identifica o instante consultado.

## 12. Requisitos funcionais

- RF-01 — O Dashboard deve alternar entre Contatos e Igreja sem perder filtros territoriais comuns.
- RF-02 — O sistema deve agregar somente localidades acessíveis dentro do estado e cidade selecionados.
- RF-03 — A lente Contatos deve calcular todo contato cadastrado no período, independentemente da origem.
- RF-04 — A lente Contatos deve exibir a distribuição pelo status atual e rotulá-la como tal.
- RF-05 — O sistema deve registrar futuras transições de status de contato de forma auditável.
- RF-06 — A lente Igreja deve excluir chamadas abertas e canceladas do denominador.
- RF-07 — A lente Igreja deve distinguir presente, ausente, justificado, não marcado e sem base.
- RF-08 — Indicadores devem permitir abrir a lista que os compõe.
- RF-09 — O usuário deve filtrar Igreja por tipo de reunião.
- RF-10 — O usuário deve gerar relatório em PDF ou CSV com os filtros atuais.
- RF-11 — O relatório deve apresentar resumo e detalhe nominal.
- RF-12 — O sistema não deve produzir classificação pastoral automática nem alterar pessoa, cuidador ou acompanhamento a partir de um indicador.

## 13. Requisitos não funcionais e guardrails

- RNF-01 — Datas devem ser calculadas em `America/Sao_Paulo` e intervalos de instantes devem usar limite final exclusivo.
- RNF-02 — Nenhum log ou evento analítico deve conter nome, telefone, observação pastoral ou justificativa.
- RNF-03 — CSV deve prevenir formula injection.
- RNF-04 — A implementação deve preservar isolamento multi-tenant em tela e exportação.
- RNF-05 — Consultas devem filtrar no banco e evitar carregar toda a base para agregar em memória quando o volume crescer.
- RNF-06 — A experiência deve funcionar por teclado, leitor de tela e mobile.
- RNF-07 — A correção dos totais tem precedência sobre cache; eventual cache deve incluir escopo e filtros na chave.

## 14. Observabilidade

Eventos sem PII:

- `people_dashboard_viewed`: view, period, state, has_city, tenant_count;
- `people_dashboard_filter_changed`: filter_name, view;
- `people_dashboard_drilldown_opened`: metric, view;
- `people_report_requested|generated|failed`: report_type, format, row_count, duration_ms, error_code.

Logs de exportação devem conter usuário técnico, tenants autorizados, filtros, quantidade de linhas e correlation ID, nunca conteúdo das linhas.

## 15. Rollout, migração e rollback

1. Criar histórico de status e `updated_at` necessário sem mudar a tela.
2. Introduzir serviços de snapshot com testes e comparar os totais com o Dashboard atual.
3. Liberar a nova visão por feature flag para coordenadores selecionados.
4. Liberar CSV e depois PDF, usando os mesmos serviços.
5. Remover cálculos duplicados da página somente após equivalência validada.

Rollback deve poder ocultar a nova UI e endpoints sem apagar histórico capturado. A migration é aditiva; registros históricos não devem ser removidos.

## 16. Estratégia de testes

- Unidade: timezone, intervalos, estados de contato, elegibilidade, `unmarked`, justificadas, sem base, retorno e agrupamento cidade/UF.
- Integração: múltiplos tenants acessíveis, bloqueio cross-tenant, histórico transacional, filtros e igualdade entre snapshot/exportação.
- E2E: contatos da semana, cidade sem dados, frequência com chamada pendente, drill-down e download nos dois formatos.
- Acessibilidade: labels, foco, leitura das tabelas e alternativa textual aos gráficos.
- Segurança: CSV injection, manipulação de tenantId e ausência de PII em logs.

## 17. Critérios de aceite

- CA-01 — Dado um período semanal, quando contatos de qualquer origem foram cadastrados nele, então todos aparecem em `Contatos gerados`, respeitando o território acessível.
- CA-02 — Dado um contato criado antes do período e ainda ativo, então ele não entra em `gerados no período`, embora possa aparecer em uma lista explicitamente acumulada.
- CA-03 — Dado um estado selecionado, então as cidades exibidas e os totais pertencem somente àquele estado e aos tenants acessíveis.
- CA-04 — Dadas duas cidades homônimas em UFs diferentes, então seus registros não são combinados.
- CA-05 — Dado um contato alterado de status após ativação do histórico, então a transição registra antes, depois, autor e instante na mesma operação.
- CA-06 — Dada uma chamada aberta, então seus não marcados não aparecem como ausentes nem entram no denominador.
- CA-07 — Dada uma ocorrência cancelada, então ela não afeta frequência nem ausência.
- CA-08 — Dadas ocorrências fechadas, então presentes, ausentes e justificadas compõem a base conforme RN-13 e são mostrados separadamente.
- CA-09 — Dado um período sem ocorrências elegíveis, então frequência mostra `sem base`, não `0%`.
- CA-10 — Ao abrir um indicador, a lista exibida contém exatamente as pessoas que compõem seu valor.
- CA-11 — Ao exportar PDF ou CSV, filtros e totais coincidem com o snapshot e o arquivo contém data/hora de geração.
- CA-12 — Ao solicitar tenant inacessível por parâmetro, a API responde `403` sem dados.
- CA-13 — Em mobile e teclado, filtros, detalhes e exportação permanecem operáveis.

## 18. Fases demonstráveis

### Fase 1 — Métricas confiáveis de contatos

Histórico de status, `updated_at`, snapshot de contatos, filtros estado/cidade/localidade e testes.

### Fase 2 — Frequência territorial

Extrair cálculos atuais para serviço dedicado, adicionar drill-down nominal e cidades do estado.

### Fase 3 — Relatórios

CSV e PDF para as duas lentes, com igualdade de filtros e totais.

### Fase 4 — Consolidação do Dashboard

Nova composição visual, estados de interface, acessibilidade, telemetria e retirada dos cálculos duplicados.

## 19. Decisões abertas

1. Regra de `voltou a reunir`: recomenda-se presença no período atual após zero presença no período anterior equivalente. Não bloqueia métricas básicas, mas bloqueia esse indicador específico.
2. PDF: decidir na implementação entre geração server-side já usada pelo projeto ou biblioteca nova, após validar suporte a paginação e fontes. CSV não depende desta decisão.
3. Retenção do histórico de status: recomenda-se retenção enquanto o contato existir; validar política LGPD antes do rollout amplo.

## 20. Matriz de rastreabilidade

| Objetivo | Requisitos | Fluxos | Contratos | Critérios | Testes/telemetria |
|---|---|---|---|---|---|
| OBJ-01 | RF-03 a RF-05 | F-01 | Dashboard + histórico | CA-01 a CA-05 | unidade/integracao + `people_dashboard_viewed` |
| OBJ-02 | RF-06, RF-07, RF-09 | F-02 | Dashboard Igreja | CA-06 a CA-09 | unidade/E2E |
| OBJ-03 | RF-01, RF-02, RF-08 | F-01, F-02 | Dashboard | CA-03, CA-04, CA-10, CA-12 | integração + drilldown |
| OBJ-04 | RF-10, RF-11 | F-03 | Reports | CA-11 | E2E + report events |
| OBJ-05 | RF-06, RF-07, RF-12 | F-02 | Dashboard Igreja | CA-06 a CA-09 | unidade/E2E |

## 21. Definition of Ready e Done

### Ready

- regra de `voltou a reunir` aprovada ou indicador retirado da primeira entrega;
- layout suficiente para desktop/mobile;
- estratégia de PDF escolhida;
- política de retenção validada.

### Done

- critérios de aceite automatizados em nível proporcional;
- totais validados com amostras reais autorizadas;
- PDF e CSV verificados visual e semanticamente;
- telemetria sem PII ativa;
- autorização multi-tenant e acessibilidade testadas;
- documentação do Dashboard atualizada.
