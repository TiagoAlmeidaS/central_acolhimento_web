# `src/ui/atalaia` — primitivas do Atalaia v2

Fonte da verdade visual: `design-ref/atalaia-v2/` (ver `docs/atalaia-v2/README.md`).
Importe sempre pelo barrel: `import { Button, Card, Drawer } from "@/ui/atalaia";`.
Componentes com estado/efeitos são client components (`"use client"`); os demais funcionam em server components.

## Tokens e utilitários Tailwind

Cores (`bg-*`, `text-*`, `border-*`): `bg`, `sunken`, `surface`, `raised`, `border`, `border-strong`, `fg`, `muted`,
`subtle`, `primary` (`-hover`, `-fg`, `-soft`), `danger`, `success`, `warning`, `cold`, `warm`, `hot` (cada um com `-soft`),
`lume` (`-ink`, `-soft`). Fontes: `font-sans` (Inter), `font-display` (Inter Tight), `font-mono` (IBM Plex Mono).
Raios: `rounded-control` (3px), `rounded-card` (5px). Classes globais: `.reveal` (entrada 16px/400ms), `.num`/`.mono`.
Escuro é o padrão; claro com `<html data-theme="light">` (chave `atalaia-theme` no `localStorage`).
Aliases antigos (`--accent`, `--text*`, `--surface-2`, `--status-*`, `bg-background-light`, `temp-*`) continuam valendo
para telas ainda não migradas — não use em código novo.

## Primitivas

| Componente | API (principais props) |
| --- | --- |
| `Button` | `variant` `primary \| neutral \| ghost \| danger`, `size` `sm \| md`, `icon` (`IconName` ou nó), `loading`, `href` (vira `next/link`), demais props de `<button>`/`<a>` |
| `IconButton` | `label` (obrigatório, nome acessível), `icon`, `variant` (padrão `ghost`), `size` |
| `Card` / `CardHeader` / `CardBody` | `CardHeader`: `title` (mono maiúsculo), `meta`, `action`, `level` 2 ou 3, `id` |
| `Eyebrow` (= `MonoLabel`) | rótulo mono 11px maiúsculo `muted` |
| `Pill` | `tone` (`neutral primary warning cold success danger muted warm hot lume`), `dot` |
| `StatusPill` | `status` (aceita `novo urgente aguardando esperando_visita acompanhamento concluido inativo` e `new contacted waiting_visit in_progress consolidated inactive`), `label?`, `short?` |
| `TempPill` | `temperature` `hot \| warm \| cold` |
| `Avatar` | `name` (iniciais; sem nome = tracejado "?"), `size` `sm \| md \| lg` |
| `Field`, `Input`, `Select`, `Textarea`, `SearchInput` | controles de 32px; `label`, `hint`, `error` (liga `aria-invalid`/`aria-describedby`); `Select` aceita `options` e `placeholder`; `SearchInput` tem lupa e rótulo oculto |
| `Chip` | `label`, `count`, `pressed`, `tone` `default \| alert` |
| `NeedsChip` | `count`, `pressed`, `onClick`, `label?`, `sentence?` — chip "Precisa de alguém" + frase em `role="status"` |
| `Segmented` | `options [{value,label}]`, `value`, `onChange`, `label` (grupo de `aria-pressed`) |
| `Tabs` | `tabs [{value,label,count?}]`, `value`, `onChange`, `label`, `idPrefix`; setas/Home/End |
| `Table`, `Th`, `Td`, `Tr` | `Table` rola na horizontal e aceita `caption`; `Tr onActivate` torna a linha clicável por mouse e teclado |
| `Stat` | `label`, `value`, `note?`, `tone` `default \| alert` |
| `PageHeader` | `title` (h1), `subtitle`, `action` (a única ação primária), `secondary` |
| `PageContainer` | respiro lateral + coluna de 1200px + `.reveal`; os shells não aplicam padding |
| `EmptyState` | `title`, `reason`, `hint` (cite o rótulo do botão), `action` |
| `Drawer` | `open`, `onClose`, `title`, `subtitle`, `footer`, `footerStart`, filhos = corpo; `role=dialog aria-modal`, foco preso e devolvido, Esc e clique no fundo fecham; `data-autofocus` marca o primeiro foco |
| `ToastProvider` / `useToast()` | `const { toast } = useToast(); toast("Contato salvo.")`; `{ tone: "error" }` para erro. Provider já montado em `AppProviders` |
| `ThemeToggle` / `useTheme()` | `variant` `button \| icon`; `useTheme()` devolve `{ theme, setTheme, toggleTheme }` |
| `Icon` / `AtalaiaMark` | `<Icon name="plus" size={16} />` (traço 1.7, `currentColor`); nomes em `IconName` |

Helpers: `cx(...)`, `buttonClass(variant, size, className)`, `CONTROL_CLASS`, `getInitials`, `normalizeStatusKey`.

## Regras de UX (valem em todas as telas)

1. **Uma ação primária por contexto** — no máximo um `Button variant="primary"` por cabeçalho, painel ou drawer.
2. **"Precisa de alguém" primeiro** — em listas e quadros, `NeedsChip` vem antes dos demais filtros e anuncia a frase em `role="status"`; o que destrava num clique vem antes.
3. **Vazio que ensina** — `EmptyState` diz por que está vazio e cita o rótulo do botão que resolve.
4. **Ler na página, escrever no drawer** — cadastro/edição em `Drawer` (foco gerenciado, Esc fecha, salvar fecha e chama `toast`).
5. **Estado sempre com texto** — `Pill`/`StatusPill` nunca dependem só da cor. Rótulos de 11–12px usam `text-muted`.
6. Controles de 32px (36px no celular), raio 3px; cards 5px com borda, sem sombra (profundidade por luminância).

## Compat layer

`src/ui/v2-components/ui.tsx` e `icons.tsx` mantêm as mesmas APIs e já usam os tokens Atalaia. Telas novas devem usar
estas primitivas; as antigas migram conforme cada atividade.
