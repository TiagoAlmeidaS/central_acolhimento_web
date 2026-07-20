# Dashboard da Igreja: frequência e ações de cuidado

## Objetivo

Evoluir o Dashboard principal da coordenação com uma visão pastoral da Igreja por `dia`, `semana` e `mês`, permitindo:

- entender a participação da localidade nas reuniões;
- identificar mudanças de frequência e pessoas que podem precisar de atenção;
- revisar a evidência antes de qualquer encaminhamento;
- iniciar um processo de cuidado;
- designar um cuidador responsável;
- registrar um primeiro contato e os acompanhamentos seguintes;
- acompanhar o resultado das ações realizadas.

O Dashboard deve apoiar discernimento e organização. Frequência baixa é um sinal para revisão humana, não um diagnóstico sobre interesse, fé, saúde ou situação pessoal.

## Perguntas que o produto deve responder

1. Como está a frequência da igreja hoje, nesta semana e neste mês?
2. A participação aumentou, ficou estável ou diminuiu em relação ao período anterior equivalente?
3. Quais pessoas apresentam evidências objetivas de que podem precisar de contato?
4. Quem já está sendo cuidado, por quem e qual é a próxima ação?
5. Quais sinais ainda não foram revisados?
6. As ações de cuidado estão sendo iniciadas e concluídas no prazo?

## Relação com os módulos existentes

```text
Member
  -> ChurchMembership
  -> AttendanceRecord
  -> ChurchCareSignal
  -> ChurchCareCase
  -> Caregiver + Followup
```

- `Member` continua sendo a pessoa canônica.
- `ChurchMembership` determina vínculo e elegibilidade.
- `AttendanceRecord` fornece a evidência de frequência.
- `ChurchCareSignal` registra por que a pessoa apareceu para revisão.
- `ChurchCareCase` organiza decisão, responsável, prazo e desfecho.
- `Followup` registra ligação, mensagem, visita, oração ou outra interação.

Um sinal não altera sozinho o status do membro, não designa cuidador e não cria acompanhamento.

## Escopo da primeira versão

### Entra

- bloco `Perfil da Igreja` no Dashboard principal da coordenação;
- seletores de período `Dia`, `Semana` e `Mês`;
- comparação com período anterior equivalente;
- filtros por localidade e tipo de reunião;
- indicadores de participação, ausência e cobertura das chamadas;
- tendência diária ou semanal de frequência;
- lista priorizada de pessoas para revisão;
- detalhe da evidência de cada pessoa;
- persistência e ciclo de vida dos sinais;
- ações `Iniciar processo`, `Designar responsável`, `Iniciar contato`, `Adiar` e `Dispensar sinal`;
- integração com cuidador, status do membro e acompanhamentos existentes;
- histórico das decisões e ações originadas no Dashboard;
- configuração básica dos critérios por localidade;
- paginação, ordenação e estados vazios.

### Não entra agora

- diagnóstico ou classificação pastoral automática;
- envio automático de WhatsApp, SMS ou e-mail;
- inteligência artificial inferindo o motivo da ausência;
- ranking público de membros, reuniões ou cuidadores;
- previsão de abandono;
- punições ou mudança automática de vínculo;
- análise de conteúdo das observações pastorais;
- metas individuais obrigatórias de presença;
- exposição desses sinais ao membro.

## Períodos e comparação

### Dia

- intervalo: início e fim do dia selecionado no fuso da localidade;
- comparação: dia anterior;
- foco: reuniões do dia, chamadas pendentes, presenças registradas e novos sinais.

Se não houver reunião concluída, mostrar `Sem reunião concluída no período`, nunca taxa igual a zero.

### Semana

- intervalo padrão: segunda-feira a domingo;
- comparação: semana imediatamente anterior;
- foco: participação recente, ausências em encontros elegíveis e ações abertas.

### Mês

- intervalo: mês civil da localidade;
- comparação: mês civil anterior;
- foco: tendência, frequência por tipo, recorrência dos sinais e resultado das ações.

### Regras comuns

- datas são calculadas no timezone do tenant, não apenas no timezone do servidor;
- o usuário pode navegar entre períodos;
- comparações exibem valor absoluto e variação percentual quando há base válida nos dois períodos;
- se o período anterior não tiver denominador, mostrar `Sem base para comparação`;
- filtros aparecem junto dos indicadores e permanecem na URL.

Exemplo:

`/coord?churchPeriod=week&churchDate=2026-07-20&meetingTypeId=...&tenantId=...`

## Definições das métricas

### Base válida

Entram somente ocorrências que:

- pertencem a um tenant acessível;
- estão com status `completed`;
- possuem chamada fechada;
- não estão canceladas;
- estão dentro do período selecionado.

Uma chamada aberta ou incompleta nunca converte `unmarked` em ausência e não entra na frequência.

### Elegibilidade individual

O denominador inclui apenas ocorrências para as quais a pessoa era elegível conforme o vínculo na data.

```text
taxa de frequência individual = presenças / ocorrências elegíveis e fechadas
```

Ausência justificada continua no denominador na política padrão, mas aparece separada. Essa regra deve estar visível junto da métrica.

### Indicadores principais

1. `Membros ativos da Igreja`: vínculos ativos no fim do período.
2. `Pessoas que reuniram`: membros distintos com ao menos uma presença.
3. `Cobertura de participação`: pessoas que reuniram / membros elegíveis para ao menos uma ocorrência.
4. `Frequência média`: soma das presenças / soma das elegibilidades em chamadas fechadas.
5. `Ausências`: registros `absent` no período.
6. `Ausências justificadas`: registros `justified`, mostrados separadamente.
7. `Chamadas pendentes`: ocorrências passadas ou do dia cuja chamada não foi fechada.
8. `Pessoas para revisão`: pessoas com sinal aberto ainda não revisado.
9. `Casos em andamento`: casos `open`, `in_progress` ou `waiting`.
10. `Contatos vencidos`: próxima ação vencida em caso ainda não concluído.

### Tendências

- presença e elegibilidade por dia na visão semanal;
- frequência por semana na visão mensal;
- frequência por tipo de reunião;
- pessoas distintas presentes;
- novos sinais, sinais revisados e casos iniciados;
- tempo mediano entre sinal e primeira ação;
- percentual de casos com responsável e com contato registrado.

Toda porcentagem mostra também sua base, por exemplo `18 presenças em 24 elegibilidades`.

## Sinais de atenção

### Princípios

- o sinal apresenta fatos, não interpreta intenção;
- deve haver amostra mínima antes de sinalizar baixa frequência;
- a mesma evidência não cria sinais duplicados a cada carregamento;
- mudanças de configuração valem para novas avaliações e não reescrevem decisões antigas;
- sinais são persistidos para permitir revisão e auditoria;
- prioridade sugere ordem de revisão, mas pode ser ajustada pela coordenação.

### Tipos candidatos

#### Ausências consecutivas

Exemplo inicial: `3` ocorrências elegíveis e fechadas consecutivas sem presença.

Padrão recomendado: `justified` não conta como presença nem aumenta a sequência de faltas não justificadas. Canceladas e chamadas abertas são ignoradas.

#### Tempo sem presença

Exemplo inicial: sem presença há `21` dias e com ao menos `2` ocorrências elegíveis fechadas nesse intervalo. O tempo sozinho não gera sinal se não houve oportunidade real de reunião.

#### Frequência abaixo do esperado

Exemplo inicial: abaixo de `50%`, com amostra mínima de `4` ocorrências elegíveis fechadas nos últimos `30` dias.

#### Queda de frequência

Exemplo inicial: queda de `30` pontos percentuais entre períodos equivalentes, com amostra válida nos dois. Recomendado para uma segunda entrega após validar as métricas básicas.

#### Sem responsável

Pessoa com sinal pastoral validado e sem cuidador. É um alerta operacional derivado da revisão humana, não diretamente da presença.

### Configuração por localidade

- sinais habilitados;
- quantidade de ausências consecutivas;
- dias sem presença;
- janela de análise;
- frequência mínima;
- amostra mínima;
- tratamento de justificativas;
- prazo para revisão e primeiro contato.

Os padrões são sementes editáveis, nunca constantes espalhadas no código.

## Fila de revisão

A fila pode ser filtrada e ordenada por:

- prioridade;
- sinal mais antigo;
- ausências consecutivas;
- dias sem presença;
- frequência;
- tipo de reunião;
- cuidador ou ausência de responsável;
- próxima ação vencida.

Prioridade sugerida:

- `alta`: sinal validado sem responsável ou ação vencida;
- `média`: critério forte com amostra válida ainda não revisado;
- `baixa`: tendência inicial que merece observação.

A prioridade não usa saúde, renda, raça, gênero ou conteúdo de observações.

## Ciclo de vida do sinal

Estados:

- `open`: aguardando revisão;
- `reviewing`: revisão iniciada;
- `actioned`: incorporado a um caso de cuidado;
- `snoozed`: adiado até uma data;
- `dismissed`: dispensado com motivo;
- `resolved`: evidência encerrada após ação ou retomada.

```text
open -> reviewing -> actioned -> resolved
  |          |            |
  |          +-> dismissed
  +-> snoozed -> open
```

Regras:

- novo processamento pode atualizar a evidência de sinal aberto, sem apagar seu histórico;
- sinal dispensado só reaparece para uma nova janela de evidência;
- retorno à reunião não apaga o sinal; pode resolvê-lo como `retomou frequência`;
- dispensar exige motivo estruturado e observação opcional.

Motivos sugeridos: informação já conhecida, ausência justificada fora do sistema, pessoa não participa desse tipo, vínculo desatualizado, duplicidade ou outro.

## Caso de cuidado

O caso representa a decisão humana de acompanhar a situação. Não substitui o membro nem os acompanhamentos.

Estados:

- `open`: iniciado, sem primeira ação;
- `in_progress`: responsável ou acompanhamento em andamento;
- `waiting`: aguardando retorno ou data combinada;
- `resolved`: cuidado concluído;
- `cancelled`: encerrado sem ação, com justificativa.

Regras:

- por padrão, apenas um caso de frequência aberto por membro e tenant;
- sinais posteriores podem ser anexados ao caso aberto;
- iniciar caso não muda automaticamente o vínculo com a Igreja;
- ao registrar o primeiro acompanhamento, passa para `in_progress`;
- encerrar exige desfecho estruturado;
- origem inicial: `church_attendance`.

## Ações disponíveis

### Iniciar processo

1. cria `ChurchCareCase` vinculado ao membro e ao sinal;
2. marca o sinal como `actioned`;
3. define responsável e prazo, se informados;
4. pergunta antes de alterar `Member.status` para `in_progress`, pois o caso pode tratar apenas de frequência;
5. registra auditoria.

### Designar responsável

- lista cuidadores ativos do mesmo tenant;
- sugere o cuidador atual do membro;
- exige confirmação para substituí-lo;
- atualiza o cuidador canônico pelo fluxo existente e vincula-o ao caso;
- registra autor e data.

### Iniciar contato

Formulário curto:

- canal: ligação, mensagem, visita, oração ou outro;
- responsável;
- data e hora;
- observação objetiva;
- próxima ação e prazo opcionais.

Ao salvar, cria `Followup`, associa-o ao caso, move o caso para `in_progress` e registra a primeira ação. Não envia mensagem automaticamente na V1.

### Adiar

- exige data de retorno;
- remove temporariamente da fila principal;
- volta para `open` na data;
- permanece visível no filtro `Adiados`.

### Dispensar sinal

- exige motivo;
- não altera presença, vínculo ou status;
- preserva evidência e decisão;
- não fecha caso já existente.

## Experiência do Dashboard

### Cabeçalho

- título `Perfil da Igreja`;
- seletor `Dia | Semana | Mês`;
- navegação de data;
- filtros de localidade e tipo;
- intervalo efetivo, timezone e última atualização.

### Cards

- `Pessoas que reuniram`;
- `Frequência média`;
- `Para revisão`;
- `Casos em andamento`;
- `Chamadas pendentes`.

Cada card mostra valor, base e comparação. O clique aplica o filtro correspondente.

### Tendência de participação

Gráfico com presenças, elegibilidades, percentual e comparação, segmentável por tipo. Dias ou semanas sem ocorrência não aparecem como frequência zero.

### Pessoas para revisão

Tabela ou cards responsivos com:

- nome, localidade e cuidador;
- motivo factual do sinal;
- última presença e ausências consecutivas;
- frequência e base da amostra;
- prioridade, estado e próxima ação;
- ações rápidas.

Exemplo: `2 presenças em 6 reuniões elegíveis nos últimos 30 dias; última presença em 18/06/2026.`

Nunca usar `desinteressado`, `frio`, `problemático` ou `abandonou a igreja`.

### Detalhe da pessoa

- vínculo com a Igreja;
- linha do tempo de presença;
- frequência por tipo;
- sinais e decisões anteriores;
- cuidador e caso aberto;
- últimos acompanhamentos;
- ações de processo, designação, contato, adiamento e dispensa.

### Execução do cuidado

Seção `Ações de cuidado` com filtros para sem responsável, primeiro contato pendente, próxima ação vencida, aguardando retorno e resolvidos no período.

## Filtros, paginação e URL

Filtros: busca por nome ou telefone, tenant, tipo de reunião, tipo e status do sinal, prioridade, status do caso, cuidador, sem responsável, prazo vencido e período.

Requisitos:

- paginação no servidor;
- padrão de `20` itens, com opções `20`, `50` e `100`;
- ordenação estável com desempate por ID;
- filtros e página na URL;
- mudar filtro retorna à página 1;
- API responde `page`, `pageSize`, `totalItems` e `totalPages`.

## Modelo de dados recomendado

### `church_care_signal_configs`

- `id`, `tenant_id`, `signal_type`, `enabled`;
- `threshold_value`, `window_days`, `minimum_sample_size`;
- `justified_absence_policy`;
- `review_due_days`, `first_contact_due_days`;
- autoria e timestamps.

Restrição: um registro por `tenant_id + signal_type`.

### `church_care_signals`

- `id`, `tenant_id`, `member_id`;
- `signal_type`, `priority`, `status`;
- `period_start`, `period_end`;
- `evidence` e `rule_snapshot` em JSON versionado;
- `first_detected_at`, `last_detected_at`;
- revisão, adiamento, decisão e resolução;
- autoria e timestamps.

O `evidence` guarda IDs das ocorrências, contagens, última presença e denominador, sem observações pastorais desnecessárias.

Chave de deduplicação: `tenant_id + member_id + signal_type + evidence_window_key`.

### `church_care_cases`

- `id`, `tenant_id`, `member_id`;
- `origin`, `status`, `priority`;
- `caregiver_id` opcional;
- abertura, primeira ação, próxima ação e resolução;
- autoria e timestamps.

Restrição recomendada: no máximo um caso aberto de `church_attendance` por membro e tenant.

### `church_care_case_signals`

- `case_id`, `signal_id`, `linked_at`, `linked_by_tenant_user_id`;
- chave única `case_id + signal_id`.

### Associação com acompanhamentos

Adicionar `care_case_id` opcional em `followups`. Mantém compatibilidade com acompanhamentos sem caso e é suficiente para a V1.

### Auditoria

Registrar geração e atualização de sinal, revisão, prioridade, adiamento, dispensa, criação e encerramento de caso, troca de responsável, associação de acompanhamento e resolução.

## Processamento e consistência

### Agregados

- calcular cards e gráficos sob demanda inicialmente;
- agregar no banco, sem carregar toda a presença no cliente;
- introduzir agregados diários quando o volume exigir;
- cache inclui tenant, intervalo, filtros e versão da política;
- fechamento ou reabertura invalida o período afetado.

### Avaliação de sinais

- executar após fechamento/reabertura e em rotina periódica idempotente;
- usar chave única para evitar concorrência e duplicidade;
- registrar versão da regra;
- falha ao avaliar sinais não impede salvar a chamada;
- reavaliar sinais vencidos ou adiados diariamente.

### Correções históricas

- corrigir chamada recalcula métricas;
- atualiza evidência de sinais abertos;
- preserva decisões humanas;
- se a evidência deixar de atender ao critério, sugere resolução sem apagar caso ou auditoria.

## APIs sugeridas

### Dashboard

- `GET /api/dashboard/church/summary`;
- `GET /api/dashboard/church/trend`;
- `GET /api/dashboard/church/attention`;
- `GET /api/dashboard/church/members/[memberId]`.

Parâmetros comuns: `tenantId`, `period=day|week|month`, `referenceDate`, `meetingTypeId`, filtros, ordenação, `page` e `pageSize`. O servidor resolve o timezone pelo tenant.

### Sinais

- `GET /api/church/care-signals`;
- `PATCH /api/church/care-signals/[signalId]/review`;
- `PATCH /api/church/care-signals/[signalId]/snooze`;
- `PATCH /api/church/care-signals/[signalId]/dismiss`;
- `PATCH /api/church/care-signals/[signalId]/priority`;
- `POST /api/church/care-signals/evaluate`, apenas interno ou administrativo.

### Casos e ações

- `POST|GET /api/church/care-cases`;
- `GET|PATCH /api/church/care-cases/[caseId]`;
- `POST /api/church/care-cases/[caseId]/assign`;
- `POST /api/church/care-cases/[caseId]/followups`;
- `POST /api/church/care-cases/[caseId]/resolve`;
- `POST /api/church/care-cases/[caseId]/cancel`.

Atualizações de sinal, caso e acompanhamento devem ser transacionais.

## Permissões

### Coordenação

Nos tenants acessíveis, pode consultar métricas, revisar sinais, iniciar casos, designar cuidador, registrar acompanhamentos, configurar critérios e consultar auditoria.

### Cuidador

Evolução: vê somente casos e membros designados, registra contatos e próximas ações, mas não altera critérios nem dispensa sinais sem permissão específica. A entrega inicial pode permanecer exclusiva da coordenação.

### Segurança de tenant

- IDs do cliente nunca substituem validação de escopo;
- membro, sinal, caso, cuidador e acompanhamento devem pertencer ao mesmo tenant;
- detalhe fora do escopo retorna não encontrado ou acesso negado;
- multi-tenant só para coordenação com acesso comprovado.

## Privacidade e linguagem pastoral

- frequência e cuidado são dados sensíveis;
- observações devem ser objetivas e necessárias;
- justificativas não aparecem nos cards agregados;
- o Dashboard não é adequado para telões públicos;
- exportação nominal fica fora da V1;
- decisões guardam autor e data;
- sinais são sugestões de revisão;
- métricas medem andamento do cuidado, não valor humano ou espiritual.

## Critérios de aceite

1. Dia, semana e mês alteram intervalo, agrupamento e comparação corretamente.
2. Métricas usam apenas ocorrências concluídas com chamada fechada.
3. Canceladas e chamadas abertas não geram ausência.
4. Frequência individual respeita elegibilidade e datas do vínculo.
5. Período sem reunião não aparece como `0%`.
6. Todo percentual exibe sua base.
7. Filtros afetam cards, gráfico e fila consistentemente.
8. O mesmo critério e janela não criam sinais duplicados.
9. O sinal mostra evidência e regra de origem.
10. Nenhum sinal altera status, cuidador ou acompanhamento sem ação humana.
11. Iniciar processo cria caso e associa sinal atomicamente.
12. Designar valida cuidador ativo e do mesmo tenant.
13. Iniciar contato cria `Followup`, associa caso e registra primeira ação.
14. Adiar retira da fila até a data definida.
15. Dispensar exige motivo e preserva histórico.
16. Caso existente recebe novos sinais sem duplicar processo.
17. Próximas ações vencidas aparecem na visão operacional.
18. Correção de presença recalcula métricas sem apagar decisões.
19. A fila possui filtros, ordenação e paginação no servidor.
20. Todas as operações bloqueiam acesso cross-tenant.

## Testes recomendados

### Unitários

- intervalos e timezone;
- comparação anterior;
- elegibilidade e estados da presença;
- ausência de denominador;
- sequência de faltas, dias sem presença e amostra mínima;
- deduplicação da evidência;
- prioridade e vencimento.

### Integração

- agregados por tenant, período e tipo;
- avaliação idempotente ao fechar e reabrir chamada;
- criar caso e anexar sinal a caso aberto;
- designar cuidador e rejeitar cross-tenant;
- criar acompanhamento associado;
- adiar, dispensar e resolver;
- paginação e ordenação estáveis.

### Interface

- trocar período e navegar datas;
- filtrar pelos cards e controles;
- abrir evidência;
- iniciar processo, designar e registrar contato;
- adiar e dispensar;
- estados vazios, chamadas pendentes e viewport mobile.

## Fases de implementação

### Fase 1 - Métricas confiáveis

- intervalos e timezone;
- consultas agregadas;
- seletor dia, semana e mês;
- filtros, cards, gráfico e chamadas pendentes;
- testes de cálculo.

### Fase 2 - Fila de atenção

- configuração por tenant;
- processamento idempotente;
- sinais e evidências persistidos;
- fila paginada;
- revisão, adiamento, dispensa e auditoria.

### Fase 3 - Ações de cuidado

- casos de cuidado;
- iniciar processo;
- designar responsável;
- criar acompanhamento pelo sinal;
- próximas ações e histórico unificado.

### Fase 4 - Aprendizado operacional

- tempos de revisão e contato;
- queda de frequência entre períodos;
- visão restrita do cuidador;
- ajuste dos critérios com uso real;
- notificações após validar o fluxo.

## Decisões recomendadas

1. Colocar `Perfil da Igreja` no Dashboard principal e manter detalhes na aba Igreja.
2. Usar períodos civis no timezone do tenant.
3. Calcular somente sobre chamadas fechadas e elegibilidade real.
4. Persistir sinais para auditoria.
5. Separar sinal, caso e acompanhamento.
6. Reutilizar cuidador e `Followup` atuais.
7. Exigir confirmação antes de alterar status ou responsável.
8. Mostrar evidência e denominador em toda métrica individual.
9. Começar com critérios simples, editáveis e validados na prática.
10. Medir a organização do cuidado sem transformar presença em julgamento.

## Resultado esperado

```text
Presença registrada
  -> métrica confiável
  -> sinal com evidência
  -> revisão humana
  -> processo e responsável
  -> contato e próxima ação
  -> acompanhamento e desfecho
```

O Dashboard deixa de mostrar apenas volume e passa a organizar uma resposta concreta e humana às mudanças de frequência.
