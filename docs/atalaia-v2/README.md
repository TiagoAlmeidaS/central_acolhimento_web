# Atalaia v2 — remodelagem da UI

**Branch centralizadora:** `release/atalaia-v2`
**Referência única:** [`design-ref/atalaia-v2/`](../../design-ref/atalaia-v2/) (protótipo HTML/CSS/JS sem build).
Todas as referências anteriores (`ui_v2/`, `telas/`, Stitch) estão **descontinuadas** para este ciclo.

## Estratégia de versionamento

- Cada atividade trabalha numa branch própria `atalaia-v2/<atividade>` criada a partir de `release/atalaia-v2`.
- Sem PR por atividade: ao concluir, a branch é mesclada (`--no-ff`) em `release/atalaia-v2`.
- A fundação (A1) entra primeiro; as telas (A2–A6) partem da `release/atalaia-v2` já com a fundação.
- No fim, uma única PR `release/atalaia-v2` → `main`.

## Mapeamento do padrão de design

Leia `design-ref/atalaia-v2/DESIGN.md`, `style.css` (app) e `landing.css` (landing) como fonte da verdade.

| Aspecto | Atalaia v2 | Onde vive no Next |
| --- | --- | --- |
| Marca | **Atalaia** (ex-Central de Acolhimento), verso Ezequiel 33:7 | `metadata`, shells, landing |
| Tema | **Escuro por padrão**, claro via `data-theme="light"` no `<html>` | `globals.css` + toggle no shell |
| Fundo / superfícies | `--bg #0e0704`, `--sunken`, `--surface #17100a`, `--raised #221710` — profundidade por luminância, não por sombra | tokens CSS + `@theme` do Tailwind v4 |
| Borda | `--border #2a2018`, `--border-strong #3d3024` | idem |
| Texto | `--fg #fff0de`, `--muted #cdbfad`, `--subtle #a39582` | idem |
| Acento | Âmbar `--primary #f2b24c` (claro: `#9a5a00`), `--primary-fg`, `--primary-soft` | idem |
| Estados | `--danger`, `--success`, `--warning`, `--cold/--warm/--hot` + `*-soft` | idem; temperatura do contato |
| Tipografia | **Inter Tight** 500 (títulos, −0,035em), **Inter** (texto, 14px/1.5 no app, 16/24 na landing), **IBM Plex Mono** (rótulos maiúsculos, cabeçalhos de card/tabela, números) | `next/font/google` → `--font`, `--display`, `--mono` |
| Raio | 3px controles, 5px cards, 999px só na linha de cadastro/pílulas | `--r-control`, `--r-card` |
| Controles | altura 32px (`--control`) | Button, Input, Select |
| Largura | coluna 1200px; réguas 1320px (landing) | containers |
| Movimento | `--ease cubic-bezier(.2,.7,.2,1)`; reveal 16px/400ms; tudo respeita `prefers-reduced-motion` | utilitários CSS |

### Regras de UX (obrigatórias em todas as telas)

1. **Uma ação primária por contexto** — no máximo um botão primário por cabeçalho, painel ou drawer.
2. **"Precisa de alguém" primeiro** — chip com contagem em `role=status` nas listas/quadros; o que destrava num clique vem antes.
3. **Vazio que ensina** — estado vazio diz por que está vazio e cita o rótulo do botão que resolve.
4. **Ler na página, escrever no drawer** — cadastro/edição em drawer lateral (foco gerenciado, Esc fecha, salvar fecha + toast).
5. Estado sempre com texto (nunca só cor). Rótulos de 11–12px usam `--muted`.

### Mapa de telas (referência → rota Next)

| Referência (`#hash` / função em `app.js`/`landing.js`) | Rota Next | Atividade |
| --- | --- | --- |
| `#inicio` — `landing.js` (hero, rede, cadastro, mapa, fluxo, papeis, fechamento) | `/` | A2 |
| `#comecar` — `onboarding()` (criar a central em 3 passos) | `/cadastro/coordenacao`, `/login`, `/esqueci-senha`, `/redefinir-senha`, `/convite/[token]`, `/cadastro/cuidador/[token]` | A3 |
| `#painel` (coordenação) — `painel()`, `shell()` | `/coord` | A4 |
| `#contatos` — `contatos()`, `seedCard()`, `mapView()`, `seedDrawer()` | `/coord/contatos` (+ novo/editar → drawer) | A4 |
| `#ajustes › equipe` — `setEquipe()`, `caregiverDrawer()` | `/coord/cuidadores` | A4 |
| `#painel` (cuidador) — `painel()` com viewer cuidador, `followupForm()` | `/cuidador`, `/cuidador/contatos`, `/cuidador/acompanhamentos`, `/cuidador/perfil` | A5 |
| `#assistidos`, `#saidas`, `#encontros` (`frequencia()`, `tci()`), `#ajustes` | `/coord/membros`, `/coord/acompanhamentos`, `/coord/saidas`, `/coord/relatorios/saidas`, `/coord/tci`, `/coord/igreja`, `/coord/cidades`, `/coord/perfil` | A6 |

## Atividades

| # | Atividade | Branch | Depende de |
| --- | --- | --- | --- |
| A1 | Fundação: tokens, Tailwind v4 `@theme`, fontes, primitivas `src/ui/atalaia/*`, shells (coord desktop + cuidador mobile), tema escuro/claro | `atalaia-v2/foundation` | — |
| A2 | Landing page `/` (7 seções da referência, linha de cadastro, reduced motion) | `atalaia-v2/landing` | A1 |
| A3 | Cadastro e autenticação (onboarding 3 passos, login, recuperação, convite/canal do cuidador) | `atalaia-v2/auth-cadastro` | A1 |
| A4 | Dashboard da coordenação + contatos (quadro/lista/mapa + drawer) + gestão de cuidadores | `atalaia-v2/coord-dashboard` | A1 |
| A5 | App do cuidador (painel mobile, contatos, acompanhamentos, perfil) | `atalaia-v2/cuidador` | A1 |
| A6 | Demais telas da coordenação (assistidos, acompanhamentos, saídas, encontros/TCI, igreja, cidades, perfil) | `atalaia-v2/coord-gestao` | A1 |

### Status da consolidação (28/10/2026)

A1–A6 mescladas em `release/atalaia-v2`. `tsc`, `eslint src`, `vitest` (114 testes) e `next build` verdes.

Pendências conhecidas:
- **Avisar a coordenação** (registro do cuidador): sem backend próprio; hoje marca o assistido como urgente via `PUT /api/members/:id`.
- **Assumir responsabilidade** (cuidador): `listSeeds` filtra por `caregiverId`, então contatos sem cuidador não chegam ao cuidador — exige mudança no servidor.
- **Contatos da coordenação** carregam todos os contatos filtrados (com foto) de uma vez para quadro/mapa; a paginação de servidor deixou de ser usada.
- **Recusar cadastro pendente** e **registrar contato com data**: sem API.
- Estados com dados reais (grupos de saída, sessões TCI, chamada) e convites válidos não foram vistos renderizados — só vazios/estado em memória.
- Script de tema (`next/script beforeInteractive`) gera aviso no console na página 404 do convite.

### Regras para quem implementa

- **Não alterar** APIs, `src/server/**`, `src/auth/**`, repositórios, migrations ou contratos — é uma remodelagem visual e de fluxo sobre os dados reais existentes.
- Use as primitivas de `src/ui/atalaia/` (A1). Só A1 edita `src/ui/atalaia/`, `globals.css`, `layout.tsx` raiz e os shells. Componentes específicos de uma tela ficam junto da rota ou em `src/ui/mvp/`.
- Nada de texto, logo ou cor de terceiros (Postman/Linear). Português do Brasil.
- Gate por atividade: `npm run typecheck` e `npm run lint` verdes.
