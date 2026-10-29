# Telas mobile — mapeamento e design

Mapeamento das 26 rotas de `src/app/` para renderizacao no celular, e as telas
desenhadas para a coordenacao e para o cuidador.

Canvas publicado: https://claude.ai/code/artifact/7207de66-2072-4963-92a3-6f53955d7668

## Artboards

Pagina **Mapa das telas**

| Arquivo | Conteudo |
| --- | --- |
| `Main.dc.html` | Inventario das 26 rotas: shell atual, o que renderiza, veredito mobile |

Pagina **Coordenacao**

| Arquivo | Conteudo |
| --- | --- |
| `Navegacao.dc.html` | Barra inferior de 5 destinos + folha "Mais" (interativo) |
| `PainelMobile.dc.html` | Painel segmentado em 390px (interativo) |
| `Pessoas.dc.html` | Contatos e Membros em abas, filtros e busca (interativo) |
| `IgrejaChamada.dc.html` | Marcacao de presenca com 4 estados e fechamento (interativo) |
| `MembroFicha.dc.html` | Ficha da pessoa: dados, presenca, historico de cuidado |
| `Saidas.dc.html` | Grupos montados, carros e alerta de grupo sem motorista |

Pagina **Cuidador**

| Arquivo | Conteudo |
| --- | --- |
| `CuidadorInicio.dc.html` | Meus assistidos / Sem cuidador + agenda do dia (interativo) |
| `ContatoNovo.dc.html` | Novo contato em 3 passos, com origem por lista (interativo) |
| `Acoes.dc.html` | Registrar acompanhamento e agendar a proxima acao (interativo) |

## Diagnostico

**15 das 26 telas nao tem navegacao no celular.** O menu lateral da coordenacao e
`className="hidden xl:flex"` em `src/ui/navigation/app-shell.tsx` e nao existe
substituto: nem gaveta, nem barra superior, nem barra inferior. Abaixo de 1280px o
conteudo renderiza, mas so da para sair da tela pelo botao voltar do navegador.

O projeto nao tem nenhuma media query em `globals.css` nem em `index.css`; esse unico
utilitario do Tailwind faz todo o corte responsivo da aplicacao.

Tres rotas da coordenacao sao resolvidas so com o shell, porque renderizam componentes
que o cuidador ja usa no celular:

- `ContactManager` — `/coord/contatos/novo`, `/coord/contatos/[id]/editar`, `/cuidador/contatos`
- `FollowupManager` — `/coord/acompanhamentos`, `/cuidador/acompanhamentos`
- `ProfileManager` — `/coord/perfil`, `/cuidador/perfil`

As tabelas, ao contrario do esperado, nao sao o problema: relatorio de saidas, membros e
igreja ja embrulham a tabela em rolagem horizontal propria.

## Proposta de navegacao

Barra inferior com 5 destinos, reaproveitando `src/ui/navigation/mobile-shell.tsx`
(barra fixa, largura maxima 440, respiro de 100px no conteudo):

**Painel · Pessoas · Igreja · Acoes · Mais**

- **Pessoas** reune Novos contatos e Membros em duas abas — no telefone, dois destinos
  raiz para a mesma pessoa desperdica slot.
- **Mais** abre uma folha com Cidades, Cuidadores, Saidas, TCI, Relatorio de saidas,
  Perfil e Sair.

O relatorio diario de saidas segue o mesmo padrao de cartao usado em `Saidas.dc.html`:
cada linha da tabela vira um cartao empilhado, preservando a rolagem horizontal como
alternativa.

Os numeros nos artboards sao de amostra — nenhum veio do banco.

## Reconstruir o canvas

```
node "<skill design>/seed-canvas.mjs" \
  --template "<skill design>/payload.template.html" \
  --out telas-mobile.html \
  --title "Telas Mobile da Central de Acolhimento" \
  --artboard Main.dc.html --artboard Navegacao.dc.html --artboard PainelMobile.dc.html \
  --artboard Pessoas.dc.html --artboard IgrejaChamada.dc.html --artboard MembroFicha.dc.html \
  --artboard Saidas.dc.html --artboard CuidadorInicio.dc.html --artboard ContatoNovo.dc.html \
  --artboard Acoes.dc.html \
  --canvas canvas.json
```
