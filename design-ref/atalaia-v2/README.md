# Atalaia — experimento de produto pelo método Cortex

Sala de acolhimento para igrejas (ex-**Central de Acolhimento**): landing, onboarding, painel da
coordenação, gestão (contatos, assistidos, saídas, encontros) e ajustes, com dados fictícios da
Paraíba.

**v2 (27/10/2026).** A v1 foi rejeitada porque não partia de referências observadas. A v2 foi
refeita pelo método inspirado na Asimov, com engenharia reversa do postman.com. A matriz completa
de decisões está em `DESIGN.md`.

## Como foi feito

| Etapa                 | O que rodou                                                              | Saída                                                       |
| --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1. Extração           | `cortex-design extract https://www.postman.com/ --slug postman-home`     | `base/references/postman-home` (só medidas e Motion DNA)    |
| 2. Estudo             | Leitura das 8 seções da página em 1440px (capturas locais, fora do repo) | `notes.copy` e `notes.avoid` na referência                  |
| 3. Composição         | `compose recipe.json` com Postman + Linear + 4 regras Cortex             | `direcao/design-system.{md,json}`                           |
| 4. Brief e contexto   | `export-context --brief brief.json --target claude-code`                 | prompts por seção, `motion-plan.json`, `reference-evidence` |
| 5. Construção         | Uma seção por vez, com captura 1440/390 e correção antes de seguir       | `landing.js`, `landing.css`; app retokenizado               |
| 6. Prova de movimento | `verify-motion motion-plan.json --url http://127.0.0.1:5199/`            | `direcao/motion-report.json`                                |
| 7. Fumaça             | `scripts/smoke.mjs`                                                      | 119 verificações                                            |

Em cada checkpoint, o que a captura mostrou foi corrigido antes da seção seguinte. No hero, o arco
saiu fraco duas vezes e o campo de cadastro cortava o texto. No diagrama, o rótulo estourava o
chip. Nos papéis, uma regra mais específica punha os títulos em mono. No pré-rodapé, o brilho
ficava fora da seção.

## Abrir

Abra `index.html` no navegador; não há build. As fontes (Inter, Inter Tight e IBM Plex Mono) vêm
do Google Fonts e, offline, caem para a fonte do sistema. Tudo roda em memória.

| Rota          | Tela                                                      |
| ------------- | --------------------------------------------------------- |
| `#inicio`     | Landing (7 seções)                                        |
| `#comecar`    | Criar a central em três passos                            |
| `#painel`     | Painel da coordenação ou do cuidador                      |
| `#contatos`   | Quadro, lista e mapa                                      |
| `#assistidos` | Assistidos e linha do tempo de acompanhamentos            |
| `#saidas`     | Saídas com grupos por carro                               |
| `#encontros`  | Frequência e sessões TCI                                  |
| `#ajustes`    | Igreja e rede, equipe, canais, jornada, reuniões e avisos |

Na landing, a linha de cadastro cria o contato de verdade e abre o quadro. As perguntas abrem o app
já filtrado, e os botões redondos entram como coordenação ou como cuidador.

## Arquivos

- `DESIGN.md`: fontes, matriz selected/derived/authored, seções e correções feitas sobre a
  referência.
- `recipe.json`, `brief.json`: entradas do `compose` e do `export-context`.
- `direcao/`: design system composto, evidência de referência por movimento e relatórios do
  `verify-motion` (sem frames nem vídeos).
- `landing.js`, `landing.css`: a landing, uma função por seção do brief.
- `app.js`, `style.css`, `data.js`, `index.html`: o app e os dados fictícios determinísticos.
- `scripts/smoke.mjs`: teste de fumaça.

## Verificação

```bash
CHROMIUM_PATH=/caminho/do/chromium node examples/atalaia/scripts/smoke.mjs [pasta-de-capturas]
cd examples/atalaia && python3 -m http.server 5199 --bind 127.0.0.1 &
pnpm cli verify-motion <pacote>/generation/motion-plan.json --url http://127.0.0.1:5199/ --out <pasta-nova>
```

Execução de 27/10/2026 em Chromium:

- **Fumaça: 119/119.** Cobre landing e app em 390 e 1440, nos temas escuro e claro: sete seções
  presentes; os seis loops derivados com a duração medida (1050, 2000, 9000, 22000, 26000 e
  60000ms, infinitos); cadastro pela landing e mensagem de erro; passos por papel; os fluxos do
  app; nenhum erro de JavaScript, nenhuma rolagem lateral, nenhuma requisição externa além das
  fontes. Com movimento reduzido: palavra fixa, letreiro, cursor e arco parados e ponto do
  diagrama removido.
- **verify-motion: passed (8/8).** `hero-frame-rise` e `modules-reveal`, em 390 e 1440, nos modos
  normal e reduzido, com frames e vídeo gerados.
- **Achado.** A primeira rodada incluía o cursor (`hero-cursor`) e falhou. O verificador mede
  transições de ida única, com valor intermediário e estado final igual a `to`. O cursor é um loop
  em degrau que volta a 1. A troca 1→0 aparece nas observações (`direcao/motion-report-cursor-failed.json`).
  O contrato saiu do plano verificável, e os loops passaram a ser checados pela Web Animations API
  no teste de fumaça. A animação não foi alterada para passar.

Não foi feito: auditoria axe, leitor de tela, Safari ou Firefox, aparelho físico, medição de FPS do
canvas. A **aprovação visual é sua e está pendente**. Não há autenticação, persistência nem API.
