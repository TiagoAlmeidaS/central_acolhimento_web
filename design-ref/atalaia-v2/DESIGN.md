# Atalaia v2 — DESIGN.md da sessão

Sala de acolhimento para igrejas (ex-Central de Acolhimento). A v2 refaz a v1 pelo método
**referência → extração → composição → construção por seção → verificação**, a partir da
engenharia reversa do postman.com. A v1 foi rejeitada por não partir de referências observadas.

## Fontes e o que cada uma contribui

| Fonte                    | Como entrou                                                                                   | Contribuição                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `reference/postman-home` | `cortex-design extract https://www.postman.com/` em 27/10/2026 (robots respeitado, sem login) | Paleta de fundo, tipografia, raio, estrutura das 8 seções, Motion DNA dos loops     |
| `reference/linear-home`  | Já na base (13/10/2026)                                                                       | Ritmo de 4px e profundidade por degraus de superfície em vez de sombra              |
| Regras Cortex            | `ux-rule/*` da base                                                                           | Uma ação primária, precisa de alguém primeiro, vazio que ensina, escrever no drawer |

Receita em `recipe.json`; composição gerada em `direcao/design-system.{md,json}` com SHA-256 das
fontes. As capturas do Postman ficaram na pasta da sessão e **não** entram no repositório; a base
guarda só as medidas (`base/references/postman-home/reference.json`).

## Matriz de decisões

| Contribuição          | Evidência                                                                  | Decisão no Atalaia                                                                   | Classe   |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Fundo                 | `data.desktop.palette` background `#0e0704` (73% da área)                  | Fundo da landing e do app escuro                                                     | selected |
| Superfícies           | fundos observados `#17100a` (8%), `#221710` (5%)                           | `--surface` e `--raised`; profundidade por luminância, como no Linear                | selected |
| Borda                 | papel border `#2a2018`                                                     | `--border` em cards, tabelas e réguas                                                | selected |
| Texto                 | textos observados `#fff0de`, `#cdbfad` (57%)                               | `--fg` e `--muted`                                                                   | selected |
| Acento                | compositor escolheu `#0265d2` (cor de link); CTA real é laranja de marca   | Âmbar Atalaia `#f2b24c`; nem o azul de link nem o laranja do Postman                 | authored |
| Tipografia            | Inter 72%, IBM Plex Mono 21%; h1 63,36px/500; h2 36px/500; corpo 16/24     | Inter Tight 64px/500 (−0,035em) no título, Inter no texto, IBM Plex Mono nos rótulos | derived  |
| Rótulo mono maiúsculo | rótulos como INSTALL FOR YOUR AGENTS, STEP 1                               | CADASTRE NA RECEPÇÃO, PASSO 1, cabeçalhos de card e de tabela no app                 | derived  |
| Raio                  | 3px em 77% dos elementos                                                   | 3px em controles, 5px em cards, 999px só na linha de cadastro                        | selected |
| Largura               | `contentWidth` 1200px                                                      | Coluna de 1200px; réguas laterais em 1320px                                          | selected |
| Sombra luminosa       | `rgba(255,180,115,.22) 0 0 22px` + inset `.14`                             | Moldura do painel no hero                                                            | selected |
| Ação como comando     | pílula npm ▾ / comando / copiar                                            | Linha de cadastro: origem ▾ / nome · telefone · bairro / Cadastrar (funciona)        | derived  |
| Arco de horizonte     | 3 camadas: deriva 10,8px 22s; brilho .75↔1 9s; véu .5↔.85 −43,2px 26s      | Arco de **alvorada**: sol nascendo no centro, cores próprias, mesmos ritmos          | derived  |
| Cursor                | `snapshots[0].animations[3]`: 1050ms, opacidade 1→0→1                      | Cursor âmbar após a palavra que troca                                                | derived  |
| Letreiro              | `snapshots[0].animations[5]`: 60000ms linear                               | Igrejas da rede com número de contatos; **para** com movimento reduzido              | derived  |
| Ponto vivo            | `snapshots[0].animations[6]`: 2000ms, opacidade 1→.5→1                     | Ponto verde da linha de cadastro e urgentes no mapa                                  | derived  |
| Mapa pontilhado       | seção 5: card duas colunas, barras mono, A–D, campo pontilhado com legenda | Canvas próprio com as casas de João Pessoa por situação                              | derived  |
| Diagrama              | seção 6: nós, conectores, 01–03, fronteira tracejada                       | Recepção → cuidador → célula dentro de SUA IGREJA; ponto percorre o caminho          | derived  |
| Curvas de nível       | textura fora da coluna nas seções 3–7                                      | `repeating-radial-gradient` próprio nas laterais                                     | derived  |
| Reveal dos módulos    | nenhum reveal observado na amostra                                         | Sobe 16px em 400ms, uma vez                                                          | authored |
| Moldura sobe          | nenhuma entrada observada                                                  | 24px em 900ms, atraso de 150ms                                                       | authored |

Nada de HTML, CSS, JS, textos, logos, imagens ou cores de marca do Postman foi copiado.

## Mapa de seções (landing)

1. **hero**: palavra que troca (Acolhimento, Visitas, Cuidado, Consolidação) + "sem ninguém
   esquecido."; linha de cadastro; atalhos por papel; arco; moldura com o painel real.
2. **rede**: letreiro com as igrejas da rede.
3. **cadastro**: texto com códigos inline; passos por papel (Recepção, Coordenação, Cuidador);
   grade de seis módulos; quatro perguntas com contagem real que abrem o app filtrado.
4. **mapa**: comparação em barras, lista A–D e campo pontilhado.
5. **fluxo**: diagrama e três cards numerados sobre privacidade.
6. **papeis**: quatro frentes do produto.
7. **fechamento**: frase, igrejas, linha de cadastro repetida sobre o brilho e rodapé.

## App

Mesmos tokens: escuro por padrão (como a referência), claro derivado no seletor de tema.
Cabeçalhos de card, rótulos de número e cabeçalhos de tabela em IBM Plex Mono maiúsculo; títulos
de página em Inter Tight. Regras Cortex preservadas: controles de 32px, um primário por contexto,
estado sempre com texto, escrita em drawer.

## O que corrigimos em relação à referência

- O letreiro do Postman continua animando com `prefers-reduced-motion`; o nosso para e quebra em
  linhas.
- O hero do Postman tem 1200px de altura; no celular o nosso encolhe o arco para 260px.
- Rótulos de 11–12px usam `#cdbfad` (contraste 11,1:1 sobre `#0e0704`), não o `#8a8178` observado.
