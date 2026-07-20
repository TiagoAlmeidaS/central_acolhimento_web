# Igreja: membros e presenca em reunioes

## Objetivo

Criar uma aba `Igreja` para a coordenacao administrar:

- as pessoas da localidade que reunem com a igreja;
- tipos personalizados de reuniao, como `TCI`, `Reuniao da Mesa` e `Reuniao Ministerial`;
- agenda e recorrencia opcional dessas reunioes;
- ocorrencias reais de cada reuniao;
- checklist de presenca por ocorrencia;
- dados historicos que permitam, no futuro, identificar frequencia e possiveis necessidades de cuidado.

O modulo deve apoiar o cuidado pastoral. Uma baixa frequencia sera um sinal para revisao humana, nunca uma conclusao automatica sobre a pessoa.

## Pergunta de produto

Se a coordenacao precisasse hoje acompanhar as reunioes da localidade, o sistema conseguiria:

- saber quais membros reunem com a igreja;
- criar qualquer tipo de reuniao;
- informar quando ela acontece, inclusive de forma recorrente;
- abrir a chamada de uma data especifica;
- marcar quem esteve presente;
- consultar o historico de cada membro e de cada reuniao?

Se sim, a V1 atende o objetivo operacional e cria uma base confiavel para os indicadores futuros.

## Decisoes de dominio

### 1. A pessoa continua sendo um `Member`

Nao sera criada uma segunda entidade de pessoa apenas para a aba Igreja. O cadastro `members` continua sendo a fonte canonica. A aba Igreja adiciona um vinculo que informa que aquele membro faz parte da lista de pessoas que reunem naquela localidade.

Na interface, a coordenacao podera:

- selecionar um membro ja cadastrado e inclui-lo na Igreja; ou
- cadastrar uma nova pessoa usando o mesmo formulario de Membros e inclui-la automaticamente na Igreja.

Isso evita pessoas duplicadas, dados divergentes e historicos pastorais separados.

### 2. Tipo de reuniao nao e a reuniao realizada

Devem existir dois conceitos diferentes:

- `Tipo de reuniao`: configuracao reutilizavel, por exemplo `Reuniao da Mesa` toda terca-feira as 19h30;
- `Ocorrencia`: encontro de uma data especifica, por exemplo `Reuniao da Mesa em 21/07/2026`.

A presenca sempre pertence a uma ocorrencia. Alterar a recorrencia futura nao pode reescrever o historico passado.

### 3. Ausencia nao e chamada ainda nao preenchida

Cada registro de presenca possui estado explicito:

- `unmarked`: ainda nao conferido;
- `present`: presente;
- `absent`: ausente;
- `justified`: ausencia justificada.

Uma pessoa nao pode ser considerada ausente apenas porque a chamada esta aberta ou incompleta.

## Escopo da V1

### Entra

- nova aba `Igreja` para a coordenacao;
- lista de membros que reunem com a localidade;
- inclusao de membro existente;
- cadastro de novo membro com reaproveitamento do formulario atual;
- ativacao e inativacao do vinculo com a igreja;
- CRUD de tipos personalizados de reuniao;
- agenda opcional por data, horario e dia da semana;
- recorrencia semanal simples e reuniao avulsa;
- geracao de ocorrencias;
- cancelamento sem apagar historico;
- checklist de presenca;
- fechamento e reabertura controlada da chamada;
- historico por membro e por tipo de reuniao;
- filtros por localidade, periodo, tipo e status.

### Nao entra agora

- notificacoes por WhatsApp ou e-mail;
- integracao com calendarios externos;
- analise automatica de risco pastoral;
- designacao automatica de cuidador;
- reconhecimento facial, QR code ou geolocalizacao;
- inscricao publica e controle de visitantes;
- sincronizacao automatica com o modulo operacional de TCI;
- recorrencias complexas como `segunda terca-feira do mes`.

## Linguagem do dominio

- `Membro da igreja`: membro com vinculo ativo na localidade;
- `Tipo de reuniao`: categoria configuravel, recorrente ou avulsa;
- `Ocorrencia`: realizacao planejada em uma data;
- `Chamada`: conjunto de marcacoes de uma ocorrencia;
- `Frequencia`: relacao entre presencas e ocorrencias elegiveis em um periodo;
- `Sinal de atencao`: indicio para revisao humana, sem julgamento ou acao automatica.

## Casos de uso

### 1. Incluir membro ja cadastrado

A coordenacao busca um membro acessivel na localidade e confirma sua inclusao.

Campos do vinculo:

- localidade;
- membro;
- data em que comecou a reunir, opcional;
- status, ativo por padrao;
- observacoes opcionais.

O mesmo membro nao pode ter dois vinculos com a Igreja no mesmo tenant.

### 2. Cadastrar nova pessoa pela aba Igreja

A coordenacao usa o mesmo formulario de Membros. Ao salvar:

1. o sistema cria o `Member`;
2. cria o vinculo com a Igreja no mesmo tenant;
3. a pessoa passa a aparecer nas chamadas elegiveis.

As duas operacoes devem ser atomicas: se uma falhar, nenhuma fica parcialmente salva.

### 3. Criar tipo personalizado de reuniao

Campos:

- nome, obrigatorio;
- descricao, opcional;
- localidade, obrigatoria;
- cor ou identificador visual, opcional;
- ativo, sim/nao;
- formato: `avulsa` ou `semanal`;
- dia da semana, obrigatorio apenas na recorrencia semanal;
- horario inicial e final, opcionais;
- data de inicio e termino da recorrencia, opcionais;
- observacoes, opcionais.

Exemplos: TCI toda quinta as 19h; Reuniao da Mesa toda terca as 20h; Reuniao Ministerial sem recorrencia fixa; Encontro Especial em uma data.

### 4. Criar ou gerar ocorrencias

Para reuniao avulsa, a coordenacao escolhe a data. Para reuniao semanal, o sistema gera ocorrencias em uma janela limitada, recomendada em 8 semanas. A geracao deve ser idempotente e nao duplicar datas.

Campos:

- tipo de reuniao;
- data;
- horarios herdados, mas editaveis;
- status;
- observacoes opcionais.

Status: `scheduled`, `completed` ou `cancelled`.

### 5. Fazer chamada

A coordenacao abre uma ocorrencia e ve os membros elegiveis em ordem alfabetica. A tela permite:

- marcar presenca, ausencia ou justificativa;
- `Marcar todos como presentes`, com confirmacao;
- buscar por nome;
- acompanhar marcados e nao conferidos;
- salvar parcialmente;
- fechar a chamada quando todos estiverem conferidos.

Ao fechar:

- nao pode haver `unmarked`;
- a ocorrencia passa para `completed`;
- alteracoes posteriores exigem reabertura explicita;
- reabertura e alteracoes posteriores ficam em auditoria.

### 6. Consultar historico

Por membro:

- reunioes elegiveis no periodo;
- presencas, ausencias e justificativas;
- ultima presenca;
- frequencia por tipo.

Por tipo de reuniao:

- ocorrencias realizadas;
- total e taxa de presenca;
- participantes por data.

## Elegibilidade para a chamada

Na V1, entram na chamada os membros que:

- pertencem ao mesmo tenant da ocorrencia;
- possuem vinculo ativo com a Igreja;
- iniciaram o vinculo ate a data da ocorrencia, quando houver `started_at`;
- nao encerraram o vinculo antes da ocorrencia, quando houver `ended_at`.

A lista elegivel deve ser materializada ao preparar a chamada. Inativar alguem depois nao pode remove-lo de chamadas passadas.

Na V1, todos os membros ativos da Igreja sao elegiveis para todos os tipos. Publicos especificos, como apenas ministeriais, ficam para uma evolucao posterior.

## Modelo de dados recomendado

### `church_memberships`

Vinculo entre `Member` e Igreja:

- `id`, `tenant_id`, `member_id`;
- `status`: `active` ou `inactive`;
- `started_at`, `ended_at`, `notes`;
- `created_by_tenant_user_id`, `created_at`, `updated_at`.

Restricoes:

- membro e vinculo no mesmo tenant;
- unicidade de `tenant_id + member_id`;
- `ended_at` nao anterior a `started_at`.

### `church_meeting_types`

- `id`, `tenant_id`, `name`, `description`, `color`, `active`;
- `recurrence_kind`: `none` ou `weekly`;
- `weekday`, de 0 a 6, quando semanal;
- `starts_at`, `ends_at`;
- `recurrence_starts_on`, `recurrence_ends_on`;
- `notes`, `created_by_tenant_user_id`, `created_at`, `updated_at`.

Restricoes:

- nome unico por tenant, sem diferenciar caixa, entre tipos ativos;
- `weekday` obrigatorio quando semanal;
- horario final posterior ao inicial;
- data final posterior ou igual a inicial.

### `church_meeting_occurrences`

- `id`, `tenant_id`, `meeting_type_id`, `occurs_on`;
- `starts_at`, `ends_at`;
- `status`: `scheduled`, `completed` ou `cancelled`;
- `attendance_closed_at`, `attendance_closed_by_tenant_user_id`;
- `notes`, `created_at`, `updated_at`.

Restricoes:

- tipo e ocorrencia no mesmo tenant;
- unicidade de `meeting_type_id + occurs_on` na V1;
- ocorrencia cancelada sem chamada fechada;
- ocorrencias concluidas nao podem ser apagadas pela interface.

### `church_attendance_records`

- `id`, `tenant_id`, `occurrence_id`, `member_id`;
- `status`: `unmarked`, `present`, `absent` ou `justified`;
- `notes`, `marked_by_tenant_user_id`, `marked_at`;
- `created_at`, `updated_at`.

Restricoes:

- ocorrencia, membro e registro no mesmo tenant;
- unicidade de `occurrence_id + member_id`;
- `marked_at` preenchido quando deixar de ser `unmarked`.

### Auditoria minima

Registrar:

- fechamento e reabertura de chamada;
- alteracao de marcacao depois do fechamento;
- cancelamento de ocorrencia;
- inativacao de membro da Igreja.

## Regras de negocio

1. Todas as consultas e mutacoes respeitam os tenants acessiveis pela sessao; IDs do cliente nao bastam como autorizacao.
2. Antes de criar uma pessoa, buscar possiveis duplicidades por nome e telefone; a V1 alerta, mas nao unifica automaticamente.
3. Alterar recorrencia nao muda ocorrencias concluidas. Para futuras ja geradas, perguntar se a mudanca vale apenas para novas ou tambem para as agendadas.
4. Ocorrencia cancelada nao gera ausencia nem entra no denominador.
5. Chamada aberta ou incompleta nao gera ausencia nem entra nas metricas.
6. Inativacao impede novos usos, mas preserva o historico.
7. `Marcar todos` nao sobrescreve marcacoes existentes sem confirmacao explicita.

## Navegacao e UX

### Rota principal

- `GET /coord/igreja`

Abas internas:

- `Visao geral`;
- `Membros`;
- `Reunioes`;
- `Presencas`.

### Visao geral

- proxima reuniao;
- ocorrencias recentes com chamada pendente;
- total de membros ativos;
- atalhos `Fazer chamada`, `Nova reuniao` e `Adicionar membro`.

### Membros

- busca, localidade, status e paginacao;
- `Adicionar membro existente` e `Cadastrar novo membro`;
- historico de presenca;
- ativar ou inativar vinculo.

### Reunioes

- tipos personalizados e formulario;
- proximas ocorrencias;
- geracao das proximas 8 semanas;
- ocorrencia manual e cancelamento.

### Presencas

- ocorrencias agrupadas por data;
- destaque para chamadas pendentes;
- acesso ao checklist;
- filtros por periodo, tipo e status.

### Mobile first

Na chamada mobile:

- cabecalho fixo com nome, data e progresso;
- busca;
- uma pessoa por linha ou card;
- alvos de toque grandes;
- salvamento incremental;
- fechar chamada visivel, mas desabilitado enquanto houver `unmarked`.

## Rotas sugeridas

- `/coord/igreja`;
- `/coord/igreja/membros` e `/coord/igreja/membros/novo`;
- `/coord/igreja/reunioes` e `/coord/igreja/reunioes/nova`;
- `/coord/igreja/reunioes/[meetingTypeId]/editar`;
- `/coord/igreja/ocorrencias/[occurrenceId]`;
- `/coord/igreja/ocorrencias/[occurrenceId]/presenca`.

## APIs sugeridas

### Membros da Igreja

- `GET /api/church/members`;
- `POST /api/church/members` para vincular existente;
- `POST /api/church/members/register` para criar pessoa e vinculo atomicamente;
- `PATCH /api/church/members/[churchMembershipId]`;
- `GET /api/church/members/[churchMembershipId]/attendance`.

### Tipos de reuniao

- `GET|POST /api/church/meeting-types`;
- `GET|PUT /api/church/meeting-types/[meetingTypeId]`;
- `PATCH /api/church/meeting-types/[meetingTypeId]/status`.

### Ocorrencias

- `GET|POST /api/church/occurrences`;
- `POST /api/church/meeting-types/[meetingTypeId]/generate-occurrences`;
- `GET|PUT /api/church/occurrences/[occurrenceId]`;
- `PATCH /api/church/occurrences/[occurrenceId]/cancel`.

### Presenca

- `GET /api/church/occurrences/[occurrenceId]/attendance`;
- `PUT /api/church/occurrences/[occurrenceId]/attendance/[memberId]`;
- `PUT /api/church/occurrences/[occurrenceId]/attendance/bulk`;
- `POST /api/church/occurrences/[occurrenceId]/attendance/close`;
- `POST /api/church/occurrences/[occurrenceId]/attendance/reopen`.

Filtros: `tenantId`, `meetingTypeId`, `dateFrom`, `dateTo`, `status`, `page` e `pageSize`.

## Permissoes

### Coordenacao na V1

Pode, dentro dos tenants acessiveis:

- administrar membros da Igreja;
- administrar tipos e ocorrencias;
- preencher, fechar e reabrir chamadas;
- consultar historicos.

### Cuidador na V1

O modulo nao sera exposto inicialmente.

Evolucao:

- leitura apenas dos membros vinculados ao cuidador;
- sinais de atencao validados pela coordenacao;
- encaminhamento como acao explicita, nunca automatica.

## Metricas futuras

Para um periodo, membro e conjunto de tipos:

- `ocorrencias elegiveis`: concluidas enquanto o vinculo estava ativo;
- `presencas`: `present`;
- `ausencias`: `absent`;
- `justificadas`: `justified`;
- `taxa de frequencia`: presencas / ocorrencias elegiveis.

Por padrao, justificadas continuam no denominador, mas aparecem separadas. A politica podera ser configuravel e deve ser mostrada junto da metrica.

Indicadores candidatos:

- membros ativos que reuniram ao menos uma vez;
- taxa geral e por tipo;
- evolucao semanal e mensal;
- membros sem presenca nos ultimos `N` encontros elegiveis;
- membros sem presenca ha `X` dias;
- chamadas pendentes.

Um sinal de atencao pode surgir, por exemplo, apos 3 encontros elegiveis sem presenca ou frequencia abaixo de um limite com amostra minima. Os limites precisam de validacao de produto e nao devem ficar fixos no codigo.

O sinal deve mostrar a evidencia e permitir dispensar, adiar, vincular/acionar cuidador ou registrar acompanhamento. Nao deve produzir rotulos como `membro desinteressado`.

## Relacao com o modulo TCI existente

O modulo `TCI` atual trata agenda operacional, camaras e cuidadores responsaveis. A aba Igreja trata pessoas elegiveis e presenca.

Na V1:

- pode existir um tipo chamado `TCI` na Igreja;
- ele nao sera sincronizado automaticamente com `TciSession`;
- essa separacao deve estar clara na interface.

Evolucao recomendada: uma `TciSession` referencia uma `church_meeting_occurrence`, mantendo operacao no TCI e chamada na Igreja, sem duplicar ocorrencias.

Antes da implementacao, vale decidir se o TCI generico sera usado imediatamente na Igreja ou se a integracao sera antecipada, pois duas agendas manuais para o mesmo encontro geram retrabalho.

## Privacidade e uso pastoral

- presenca e dado pastoral sensivel e deve ser restrito a perfis autorizados;
- exportacoes ficam fora da V1;
- justificativas devem ser breves, sem incentivar diagnosticos ou detalhes intimos;
- metricas iniciam conversa e cuidado, nao punicao ou exposicao;
- toda consulta respeita tenant e funcao do usuario.

## Criterios de aceite da V1

1. Incluir membro existente sem duplicar a ficha.
2. Cadastrar pessoa pela Igreja usando os mesmos campos de Membros.
3. Criar pessoa e vinculo atomicamente no mesmo tenant.
4. Criar tipos avulsos e semanais, com data e horarios opcionais.
5. Gerar ocorrencias semanais sem duplicidade.
6. Alterar recorrencia sem modificar historico concluido.
7. Exibir apenas membros elegiveis da mesma localidade.
8. Salvar chamada parcial sem converter `unmarked` em ausencia.
9. Fechar chamada apenas quando todos estiverem conferidos.
10. Ignorar ocorrencias canceladas nas ausencias e frequencia.
11. Preservar historico ao inativar membro ou tipo.
12. Bloquear leitura e alteracao cross-tenant em todas as APIs.

## Testes recomendados

### Unitarios

- elegibilidade por inicio e termino do vinculo;
- diferenca entre `unmarked` e `absent`;
- exclusao de canceladas das metricas;
- geracao semanal no dia correto e idempotente;
- historico imutavel ao editar recorrencia;
- frequencia apenas sobre concluidas elegiveis.

### Integracao

- vincular membro existente e impedir duplicidade;
- criar membro e vinculo em transacao;
- impedir membro de outro tenant;
- criar tipo e ocorrencias;
- materializar elegiveis;
- salvar chamada parcial;
- bloquear fechamento com `unmarked`;
- fechar e reabrir com auditoria;
- preservar registros na inativacao;
- bloquear acesso cross-tenant.

### Interface

- cadastrar membro pela Igreja;
- criar reuniao semanal e gerar ocorrencias;
- fazer e fechar chamada no mobile;
- consultar historico do membro.

## Indexacao sugerida

- `church_memberships (tenant_id, status)`;
- `church_memberships (tenant_id, member_id)` unico;
- `church_meeting_types (tenant_id, active)`;
- `church_meeting_occurrences (tenant_id, occurs_on, status)`;
- `church_meeting_occurrences (meeting_type_id, occurs_on)` unico;
- `church_attendance_records (occurrence_id, status)`;
- `church_attendance_records (occurrence_id, member_id)` unico;
- `church_attendance_records (member_id, occurrence_id)`.

## Fases de implementacao

### Fase 1 - Base e cadastros

- migrations e tipos;
- vinculo de membros;
- reaproveitamento do formulario;
- CRUD de tipos;
- ocorrencias avulsas e semanais;
- navegacao da aba Igreja.

### Fase 2 - Presenca

- materializacao da lista elegivel;
- checklist mobile first e salvamento parcial;
- fechamento, reabertura e auditoria;
- historico por membro e reuniao.

### Fase 3 - Indicadores e cuidado

- metricas semanais e mensais;
- parametros de sinal de atencao;
- fila de revisao;
- encaminhamento para cuidador;
- acompanhamento a partir do sinal.

### Fase 4 - Integracoes

- integracao com TCI;
- notificacoes e calendarios externos;
- publicos especificos por tipo.

## Decisoes recomendadas

1. Reutilizar `Member` como pessoa canonica e representar Igreja por vinculo.
2. Separar tipo, ocorrencia e presenca.
3. Tratar `unmarked` como estado real para impedir ausencias falsas.
4. Materializar elegiveis para preservar historico.
5. Comecar com recorrencia semanal simples e eventos avulsos.
6. Deixar analise e encaminhamento fora da V1, mas modelar os dados agora.
7. Tratar sinais como apoio a decisao humana, com evidencia e auditoria.

## Risco principal

O maior risco e implementar presenca como colunas soltas no membro ou como um checklist reutilizado toda semana. Isso destruiria o historico, tornaria ausencias ambiguas e impediria metricas confiaveis.

A estrutura correta e:

`Member -> ChurchMembership -> MeetingType -> Occurrence -> AttendanceRecord`

Ela permite comecar simples e evoluir para acompanhamento pastoral sem refazer a base.
