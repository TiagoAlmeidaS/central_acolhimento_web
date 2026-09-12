# Dashboard segmentado — mapeamento e design

Design canvas com o mapeamento de funcionalidades do painel da coordenacao
(`src/app/(app)/coord/page.tsx`) e a proposta de segmentacao.

Canvas publicado: https://claude.ai/code/artifact/fc3c3473-932e-4762-93fa-3297a5b0ccff

## Artboards

| Arquivo | Conteudo |
| --- | --- |
| `Main.dc.html` | Painel segmentado — nova IA em 5 segmentos + barra de recorte global (interativo) |
| `Aquisicao.dc.html` | Segmento Aquisicao — funil por origem, origem por cidade, lista de pessoas (interativo) |
| `Mobile.dc.html` | O mesmo painel em 390px (interativo) |
| `MapaAtual.dc.html` | Diagnostico do estado atual: 5 abas, 33 KPIs, metricas duplicadas |
| `Taxonomia.dc.html` | Modelo de 4 eixos + taxonomia de origem + mapeamento de dados |
| `canvas.json` | Posicoes, titulos e notas do canvas |

## Diagnostico (levantado do codigo)

O painel atual tem 5 abas via `?tab=` (`igreja`, `tci`, `cuidados`, `cuidadores`,
`acoes`) e 33 KPIs. Pontos de atrito:

1. `seeds.source` e `TEXT DEFAULT ''` — origem sem taxonomia, sem KPI, sem agrupamento.
2. Nao ha registro de quem cadastrou a pessoa (so o cuidador designado depois).
3. `caregiver_signup_channels` so capta cuidadores; nao ha canal publico para pessoas.
4. Estado/cidade/local/periodo so filtram o bloco "Dashboard de Pessoas"; o resto da
   pagina usa o escopo da sessao.
5. `tabHref()` so preserva os parametros quando o destino e a aba `igreja`.
6. As abas nao sao segmentos: `tci` mostra os totais gerais da base; `igreja` empilha
   dois dashboards com filtros independentes; `cuidados` e so KPI sem lista de acao.
7. `seeds.outing_event_id` ja liga a pessoa a saida que a gerou — unico dado de origem
   confiavel que existe hoje, e nao vira metrica em lugar nenhum.

Metricas repetidas entre abas: sem cuidador (5 lugares, 3 regras), sendo cuidados (4),
contatos vencidos (3), frequencia media (2), chamadas pendentes (2), acoes de 7 dias (2).

## Proposta

**Cinco segmentos**, uma pergunta cada: Aquisicao (de onde vem), Cuidado (quem esta na
fila), Igreja (quem reune), Equipe (quem cuida de quem), Atividade (o que foi feito).

**Quatro eixos de recorte**, validos para a pagina inteira e persistidos na URL entre
abas: quem e a pessoa · de onde veio · quem cuida · onde/quando.

**Taxonomia de origem** (`origin_channel`, lista fechada): `outing`, `referral`,
`church_service`, `public_link`, `whatsapp`, `manual`, `import`, `other`.

Mudancas em `seeds`: `origin_channel` (enum), `origin_detail` (texto livre — destino do
`source` atual) e `registered_by_tenant_user_id`. Backfill: quem tem `outing_event_id`
vira `outing`; o resto vira `other` com o `source` copiado para `origin_detail`, e a fila
de reclassificacao aparece como KPI ("Origem sem registro") em vez de sumir.

Os numeros nos artboards sao de amostra — nenhum veio do banco.

## Reconstruir o canvas

```
node "<skill design>/seed-canvas.mjs" \
  --template "<skill design>/payload.template.html" \
  --out dashboard-segmentacao.html \
  --title "Dashboard Segmentado - Central de Acolhimento" \
  --artboard Main.dc.html --artboard Aquisicao.dc.html --artboard Mobile.dc.html \
  --artboard MapaAtual.dc.html --artboard Taxonomia.dc.html \
  --canvas canvas.json
```
