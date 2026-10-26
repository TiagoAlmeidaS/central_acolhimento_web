# Triagem por WhatsApp: do campo a ligacao do cuidador

- **Versao:** 0.1 (rascunho para discussao)
- **Status:** Proposta — estagio 1 do eixo "gestao + acao"
- **Owner funcional:** Coordenacao da Central de Acolhimento
- **Data:** 2026-10-26
- **Documentos relacionados:** [Relatorio diario de saidas](daily-outing-report-spec.md), [Contatos e membros](contacts-members-listing-spec.md), [Comunicacao por cuidador](member-caregiver-communication-spec.md), [Dashboard da Igreja](church-dashboard-care-analysis-spec.md)
- **Apresentacao visual:** [whatsapp-triage-flow.html](whatsapp-triage-flow.html)

## Resumo executivo

Hoje uma pessoa abordada em campo vira um `seed` (Contato) e fica parada na lista de triagem ate que um cuidador a "assuma" manualmente ou a coordenacao atribua alguem. Nao existe primeiro contato automatico, nao existe registro de conversa e nao existe criterio de disponibilidade do cuidador.

Esta proposta transforma a triagem em um fluxo com quatro etapas e um painel de gestao:

1. **Captura em campo** — quem esta na saida cadastra o contato com telefone e consentimento.
2. **Pre-atendimento por WhatsApp** — a Evolution API envia a primeira mensagem e uma IA acolhe, coleta o essencial e identifica urgencia.
3. **Encaminhamento** — o sistema oferece o contato a um cuidador disponivel, com resumo da conversa.
4. **Ligacao e comunhao** — o cuidador liga pelo WhatsApp e registra o resultado como acompanhamento.

A coordenacao acompanha tudo em um funil ("sala de reuniao"), com alertas de atraso e de urgencia.

## Intencao

- **Problema:** contatos feitos em campo esfriam entre a abordagem e o primeiro contato humano; a coordenacao nao enxerga onde o processo trava.
- **Atores:** pessoa em campo (cuidador ou coordenador), contato (lead), assistente virtual, cuidador, coordenacao.
- **Job to be done:** "acabei de conversar com alguem na rua; quero que essa pessoa receba carinho e uma ligacao de um cuidador ainda hoje, sem eu precisar lembrar".
- **Resultado desejado:** todo contato com telefone recebe a primeira mensagem em minutos e uma ligacao de cuidador dentro do prazo combinado.

## Vocabulario

- **Lead** = Contato (`seeds`). Nao criamos entidade nova: o Lead ja existe e ja carrega origem, saida, autoria, urgencia e localizacao.
- **Triagem** = sessao de pre-atendimento ligada ao contato (`triage_sessions`). Um contato pode ter mais de uma sessao ao longo do tempo (ex.: retomada depois de semanas).
- **Oferta** = convite feito a um cuidador para assumir o contato, com prazo para aceitar.
- **Membro** = contato convertido (`members`), fluxo que ja existe em `/api/seeds/[seedId]/convert`.

## Estado atual e evidencias

### Ja existe e sera reaproveitado

- cadastro de contato no app do cuidador e da coordenacao, com `origin_channel` (`outing`, `whatsapp`, ...), `outing_event_id`, `registered_by_tenant_user_id`, `is_urgent`, idade, endereco e coordenadas;
- status do contato: `new`, `contacted`, `waiting_visit`, `in_progress`, `consolidated`, `inactive`, com historico em `seed_status_history`;
- "assumir contato" pelo cuidador (`handleAdoptSeed`) e atribuicao pela coordenacao;
- acompanhamentos (`followups`) com tipo `call`, `message`, `visit`, `prayer` e `next_action_at`;
- botoes `wa.me` no app do cuidador (abrir conversa e mensagem pre-preenchida de compromisso);
- KPI "Contatos na Triagem" no painel da coordenacao;
- `@vercel/functions` (`waitUntil`) para processar trabalho depois da resposta HTTP.

Evidencias: `src/server/domain/mvp.ts`, `src/lib/seed-origin.ts`, `src/app/(app)/cuidador/caregiver-dashboard-client.tsx`, `src/app/api/seeds/[seedId]/convert/route.ts`, `supabase/migrations/20260830103000_add_seed_status_history.sql`, `supabase/migrations/20260913120000_add_seed_origin_taxonomy.sql`.

### Nao existe

- consentimento registrado para contato por WhatsApp;
- integracao de envio e recebimento de mensagens;
- registro das mensagens trocadas;
- disponibilidade e capacidade do cuidador (o schema MVP nao tem; o legado tinha `limite_acolhimento = 3`);
- oferta com prazo e reatribuicao automatica;
- resultado estruturado da ligacao;
- funil com tempos entre etapas.

## Fluxo proposto

### Etapa 1 — Captura em campo

Quem cadastra: cuidador ou coordenador, no celular, durante uma saida.

1. Abre "Novo contato" (ja existe). Se houver saida em andamento, ela vem pre-selecionada e `origin_channel = outing`.
2. Preenche nome, telefone (WhatsApp), idade aproximada, bairro e uma observacao curta ("pediu oracao pela mae").
3. Marca **"A pessoa aceitou receber mensagem no WhatsApp"** (novo, obrigatorio para entrar na triagem automatica).
4. Opcional: "Eu mesmo quero acompanhar" — o contato vai direto para quem cadastrou, pulando a oferta (a mensagem automatica ainda e enviada, citando o nome dele).
5. Opcional: "Urgente" (ja existe) — pula a IA e vai direto para a coordenacao.

Saida: contato `new` + sessao de triagem `queued`.

### Etapa 2 — Pre-atendimento por WhatsApp (Evolution + IA)

1. **Primeira mensagem (template fixo, sem IA):** enviada em ate 5 minutos, respeitando a janela de envio (8h–21h). Cita a igreja e o nome de quem conversou em campo:
   > Ola, Ana! Aqui e da Central de Acolhimento da Igreja X. O Pedro conversou com voce hoje na Praca Central e pediu para a gente continuar esse papo. Podemos falar por aqui?
2. **Resposta do contato:** a Evolution chama o webhook `POST /api/webhooks/evolution`. O sistema localiza o contato pelo numero e anexa a mensagem a sessao. Status do contato vai para `contacted`.
3. **Conversa com a IA (no maximo ~8 trocas):** a assistente se apresenta como assistente virtual e coleta:
   - como a pessoa esta e o que ela precisa (oracao, conversa, visita, ajuda pratica, conhecer a igreja);
   - melhor dia e horario para receber uma ligacao;
   - se prefere ligacao ou so mensagem;
   - bairro (quando faltar);
   - sinais de urgencia ou risco.
4. **Resumo estruturado:** ao final, a IA grava um resumo validado por schema (ver "Saida da IA") e encerra com: "Obrigado! Um cuidador da nossa equipe vai te ligar {janela}."
5. **Passagem para humano a qualquer momento:** a pessoa pede, a IA nao entende, chega audio/imagem que nao conseguimos tratar, ou o tema e sensivel.

### Etapa 3 — Encaminhamento ao cuidador disponivel

1. **Candidatos:** cuidadores ativos do mesmo tenant, que aceitam receber triagem, abaixo da capacidade e com disponibilidade na janela pedida.
2. **Ordenacao sugerida:** (a) quem cadastrou em campo, se for cuidador e estiver disponivel; (b) mesmo bairro/regiao; (c) menor carga ativa; (d) quem recebeu oferta ha mais tempo. Criterios de afinidade (genero, faixa etaria) ficam como decisao em aberto.
3. **Oferta:** o cuidador recebe no app (card com resumo) e por WhatsApp do numero da Central. Tem um prazo (sugestao: 30 min em horario comercial) para **Aceitar** ou **Nao posso agora**.
4. **Sem aceite no prazo:** oferta expira e vai para o proximo. Depois de 3 ofertas sem aceite, vai para a fila da coordenacao.
5. **Aceite:** `seeds.caregiver_id` e preenchido (mesmo campo de hoje), status `in_progress`, e o contato recebe: "Quem vai te ligar e a Marta, hoje entre 19h e 20h."

### Etapa 4 — Ligacao e comunhao

1. No app, o cuidador ve o card com o resumo, a janela combinada e o botao **Ligar pelo WhatsApp** (abre a conversa via `wa.me`; a chamada e feita pelo proprio WhatsApp do cuidador).
2. Ao voltar ao app, registra o resultado (novo campo `outcome` em `followups` tipo `call`):
   - `connected` — conversou; campo para anotacoes e proximo passo;
   - `no_answer` — nao atendeu; o sistema envia mensagem de tentativa e agenda nova tentativa (ate 3);
   - `rescheduled` — pessoa pediu outro horario;
   - `wrong_number` / `declined` — encerra com motivo.
3. Proximo passo do `connected`: agendar visita (`waiting_visit`), convidar para culto/celula, seguir por mensagem, ou converter em membro (fluxo existente).

## Gestao (sala de reuniao)

Painel na coordenacao, filtrado por localidade, periodo e saida:

- **Funil:** cadastrados → mensagem enviada → responderam → triagem concluida → cuidador atribuido → ligacao realizada → visita/membro.
- **Tempos (mediana):** cadastro→1a mensagem, cadastro→1a resposta, triagem→aceite, aceite→ligacao.
- **Filas de acao:** urgentes, sem cuidador ha mais de 2h, ligacao atrasada (passou da janela), sem resposta ha 48h, opt-out.
- **Por saida:** contatos gerados e quantos ja receberam ligacao (complementa o relatorio diario de saidas).
- **Por cuidador:** carga ativa, ofertas aceitas/recusadas, ligacoes no prazo. Uso apenas para equilibrar carga, nunca como ranking publico (mesmo principio do relatorio diario).

## Casos e excecoes

| Caso | Comportamento |
| --- | --- |
| Sem telefone | Contato fica fora da triagem automatica; vai para a fila manual (visita se casa aberta). |
| Sem consentimento marcado | Nenhuma mensagem automatica; cuidador pode ser atribuido manualmente. |
| Numero sem WhatsApp | Evolution informa falha; sessao `failed`, alerta para corrigir o numero ou ligar por telefone comum. |
| Telefone ja cadastrado (contato ou membro) | Nao cria sessao nova; avisa quem cadastrou e vincula ao cuidador atual, se houver. |
| Nao responde | Lembrete gentil apos 24h; apos 72h sessao `no_reply` e contato vai para ligacao direta do cuidador. |
| Pede para parar ("SAIR", "nao quero") | Opt-out imediato e definitivo para mensagens automaticas; resposta de despedida; contato nao recebe mais nada automatico. |
| Sinal de risco (suicidio, violencia, abuso) | IA para, responde com acolhimento e CVV 188 / 190 quando aplicavel, marca `is_urgent` e notifica a coordenacao na hora. |
| Menor de 18 anos | IA nao conduz a conversa; mensagem pede contato do responsavel ou vai direto para coordenacao (decisao em aberto). |
| Audio, imagem ou figurinha | V1: IA responde que prefere texto e oferece passar para humano; transcricao de audio fica para V2. |
| Mensagem fora do horario | Resposta automatica curta; continuacao no proximo periodo permitido. |
| Nenhum cuidador disponivel | Fila da coordenacao, com o prazo prometido ao contato ajustado ("vamos te ligar amanha"). |
| Cuidador aceitou e nao ligou na janela | Lembrete ao cuidador; 2h depois, alerta na coordenacao com opcao de reatribuir. |
| Mensagem espontanea de numero desconhecido | Cria contato com `origin_channel = whatsapp` e inicia a triagem. |
| Coordenacao quer assumir a conversa | Botao "Assumir conversa" pausa a IA para aquela sessao. |

## Saida da IA (contrato)

A IA nao escreve direto no banco. Ela devolve um objeto validado antes de ser gravado em `triage_sessions.summary`:

```json
{
  "needs": ["prayer", "conversation"],
  "summary": "Ana perdeu o emprego, mae doente. Pediu oracao e gostaria de conversar.",
  "preferredContact": "call",
  "preferredWindow": { "day": "today", "from": "19:00", "to": "21:00" },
  "neighborhood": "Mangabeira",
  "riskFlags": [],
  "urgency": "normal",
  "handoffReason": null
}
```

## Modelo de dados (aditivo)

- `seeds`: `whatsapp_consent_at TIMESTAMPTZ`, `whatsapp_opt_out_at TIMESTAMPTZ`.
- `triage_sessions`: `id`, `tenant_id`, `seed_id`, `status` (`queued`, `sent`, `in_conversation`, `handoff`, `completed`, `no_reply`, `opted_out`, `failed`), `ai_paused`, `summary JSONB`, `urgency`, `started_at`, `completed_at`.
- `whatsapp_messages`: `id`, `tenant_id`, `seed_id`, `triage_session_id`, `direction` (`in`/`out`), `author` (`contact`, `ai`, `template`, `human`), `body`, `provider_message_id UNIQUE`, `status`, `created_at`.
- `whatsapp_instances`: uma instancia Evolution por tenant (`instance_name`, `phone`, `status`). A chave de API fica em variavel de ambiente/segredo, nunca em texto no banco.
- `caregivers`: `accepts_triage BOOLEAN`, `max_active_contacts INTEGER`, `region TEXT`.
- `caregiver_availability`: `caregiver_id`, `weekday`, `start_time`, `end_time`.
- `triage_offers`: `id`, `tenant_id`, `seed_id`, `caregiver_id`, `status` (`pending`, `accepted`, `declined`, `expired`), `offered_at`, `expires_at`, `responded_at`.
- `followups`: `outcome` (`connected`, `no_answer`, `rescheduled`, `wrong_number`, `declined`), apenas para `type = call`.

## Arquitetura (resumo)

- `POST /api/webhooks/evolution` — valida o segredo do webhook, grava a mensagem (idempotente por `provider_message_id`) e usa `waitUntil` para chamar a IA e responder.
- `POST /api/triage/[sessionId]/handoff`, `.../pause` — acoes da coordenacao.
- `POST /api/triage/offers/[offerId]/accept|decline` — acoes do cuidador.
- `GET /api/cron/triage-tick` (Vercel Cron, a cada 5 min) — envia mensagens na fila, expira ofertas, lembretes e `no_reply`.
- Repositorio `triage-repository.ts` seguindo o padrao dos demais; regras puras em `src/server/domain` com testes unitarios.

## Guardrails

- A IA sempre se identifica como assistente virtual e nunca se passa por pessoa.
- A IA acolhe e coleta; nao aconselha, nao faz aconselhamento pastoral, nao promete nada alem da ligacao.
- Nenhuma mensagem automatica sem consentimento registrado; opt-out respeitado sempre.
- Janela de envio 8h–21h no fuso da localidade (`America/Sao_Paulo` na V1).
- Conversa visivel apenas para a coordenacao do tenant e para o cuidador atribuido.
- Dados minimos enviados ao modelo de IA (sem endereco completo nem coordenadas).
- Toda transicao de status grava autor (pessoa, IA ou sistema) no historico.

## Riscos

- **Evolution API usa o WhatsApp Web (nao oficial):** risco de bloqueio do numero se houver volume alto ou denuncias. Mitigacao: numero dedicado por localidade, aquecimento gradual, so mensagens com consentimento, limite de envio por minuto. Alternativa oficial: WhatsApp Cloud API (Meta), com templates aprovados e custo por conversa.
- **Numero pessoal do cuidador:** a ligacao pelo WhatsApp do cuidador expoe o numero dele. Decidir se isso e aceitavel ou se a ligacao deve sair de um numero da Central.
- **Tom da IA:** um texto frio ou insistente prejudica o acolhimento. Revisar o prompt com a coordenacao e testar com conversas reais antes de ligar para todos.

## Decisoes em aberto

1. Evolution API (rapido, nao oficial) ou WhatsApp Cloud API (oficial, com custo)?
2. A ligacao sai do WhatsApp pessoal do cuidador ou de um numero da Central?
3. Prazo da oferta e SLA da ligacao (sugestao: 30 min para aceitar; ligacao em ate 24h).
4. Criterios de afinidade no encaminhamento (genero, faixa etaria, regiao)?
5. Como tratar menores de 18 anos?
6. Quem cadastrou em campo tem prioridade para acompanhar?

## Fatias de entrega sugeridas

1. **Fatia 0 — sem integracao:** consentimento no cadastro, disponibilidade/capacidade do cuidador, oferta com prazo, resultado da ligacao e funil. Ja melhora o processo usando `wa.me`.
2. **Fatia 1 — mensagens:** Evolution conectada, primeira mensagem por template, recebimento de respostas, conversa visivel e "Assumir conversa". Sem IA.
3. **Fatia 2 — IA:** pre-atendimento, resumo estruturado, deteccao de risco e encaminhamento automatico.
4. **Fatia 3 — gestao:** tempos, alertas e visao por saida/cuidador na sala de reuniao.

## Criterios de aceite (estagio 1)

1. Um contato cadastrado em campo com telefone e consentimento recebe a primeira mensagem em ate 5 minutos dentro da janela permitida.
2. Toda mensagem recebida aparece na conversa do contato e nunca e duplicada.
3. Sinal de risco interrompe a IA e alerta a coordenacao em menos de 1 minuto.
4. Opt-out impede qualquer nova mensagem automatica.
5. A oferta so vai para cuidadores ativos, que aceitam triagem e estao abaixo da capacidade.
6. Oferta sem resposta expira e passa ao proximo cuidador; apos 3 tentativas cai na fila da coordenacao.
7. O cuidador registra o resultado da ligacao e o status do contato reflete esse resultado.
8. O funil mostra os numeros por etapa e os tempos medianos, filtrados por localidade e periodo.
9. Nenhum dado de um tenant aparece em outro.
