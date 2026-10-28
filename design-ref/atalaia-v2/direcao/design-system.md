# Atalaia — direção v2 (Postman)

Refazer o Atalaia pelo método referência → extração → composição: estrutura, tipografia e movimento ambiente do Postman, espaçamento e degraus de superfície do Linear, identidade e conteúdo próprios de acolhimento pastoral.

Status: draft — revisão humana pendente.

## Decisões

- background: Papéis selecionados; superfície ausente usa fundo. [selected] reference/postman-home#data.desktop.palette.roles
- surface: Papéis selecionados; superfície ausente usa fundo. [selected] reference/postman-home#data.desktop.palette.roles
- accent: Papéis selecionados; superfície ausente usa fundo. [selected] reference/postman-home#data.desktop.palette.roles
- text: Texto preservado se AA nos dois fundos; caso contrário preto/branco de maior contraste. [derived] reference/postman-home#data.desktop.palette.roles
- accentText: Texto preservado se AA nos dois fundos; caso contrário preto/branco de maior contraste. [derived] reference/postman-home#data.desktop.palette.roles
- bodySize: Corpo mínimo de 16px; título deriva de 2,5× o corpo observado. [derived] reference/postman-home#data.desktop.typography.body.size
- headingSize: Corpo mínimo de 16px; título deriva de 2,5× o corpo observado. [derived] reference/postman-home#data.desktop.typography.body.size
- space: Ritmo entre 4 e 12px; raio próprio de 1,5 unidade. [derived] reference/linear-home#data.desktop.spacing.baseUnit
- radius: Ritmo entre 4 e 12px; raio próprio de 1,5 unidade. [derived] reference/linear-home#data.desktop.spacing.baseUnit
- contentWidth: Conteúdo limitado a 720–1280px, fluido no celular. [derived] reference/postman-home#data.desktop.layout.contentWidth
- motionMs: Seleção explícita: 1050ms observados, limitados a 400ms; fase load, viewport 1440, seletor html > body:nth-child(2) > main:nth-child(3) > section:nth-child(2) > div:nth-child(2) > div:nth-child(1) > h1:nth-child(1) > span:nth-child(1) > span:nth-child(2) > span:nth-child(1). [derived] reference/postman-home#data.motion.snapshots[0].animations[3].duration

## Padrões para implementar por seção

- ux-rule/uma-acao-primaria-por-contexto: Uma ação primária por contexto. Cada cabeçalho, painel ou drawer tem no máximo um botão primário; o resto é neutro ou fantasma. Orientações (dados da fonte, sujeitos a revisão): {"category":"Hierarquia","do":"Um .btn.primary por contexto (o \"Novo …\" do cabeçalho ou o Salvar do drawer).","dont":"Dois ou mais botões primários competindo na mesma área.","severity":"High"}
- ux-rule/precisa-de-alguem-primeiro: Precisa de alguém é filtro de primeira classe, ordenado pelo que uma pessoa destrava num clique. A barra do quadro e da lista tem um chip Precisa de alguém com contagem em role=status; a lista resultante põe primeiro o que uma pessoa resolve num clique (autorizar, decidir design) e por último o que depende de outro sistema (revisar PR). Orientações (dados da fonte, sujeitos a revisão): {"category":"Agentes","do":"Contagem anunciada como frase completa; razões ordenadas; ação de destravar no próprio card ou drawer.","dont":"Esconder o que espera uma pessoa numa aba separada; contagem solta em aria-live; ordenar só por data.","severity":"High"}
- ux-rule/vazio-que-ensina-o-proximo-passo: Estado vazio que ensina o próximo passo. Lista ou painel vazio diz por que está vazio e qual ação resolve, citando o rótulo do botão. Orientações (dados da fonte, sujeitos a revisão): {"category":"Estados","do":"\"Nenhum outcome. Use “Outcome” no cabeçalho para criar o primeiro resultado esperado.\"","dont":"\"Sem dados.\" ou uma área em branco.","severity":"Medium"}
- ux-rule/ler-na-pagina-escrever-no-drawer: Ler na página, escrever no drawer. Leitura acontece na página; cadastro e edição abrem num painel lateral que fecha ao salvar e confirma com toast. Orientações (dados da fonte, sujeitos a revisão): {"category":"Formulários","do":"Drawer com foco gerenciado, Esc fecha, sucesso fecha e mostra toast.","dont":"Formulário de edição misturado à leitura na mesma página.","severity":"Medium"}

## Atribuição

- reference/postman-home: API engineering for your agents; https://www.postman.com/; licença: medidas extraídas para referência interna; capturas e marca pertencem ao site; status: draft; sha256: 32b48c033235a6b784dc2037289ce679346574cd64e75d43c26e3750457fbb41
- reference/linear-home: Linear – The system for product development; https://linear.app/; licença: medidas extraídas para referência interna; capturas e marca pertencem ao site; status: draft; sha256: c30a61d60f14f284b1f99b50d36af65bf1af20b10eec82fcd5080b585dd5b397
- ux-rule/uma-acao-primaria-por-contexto: Uma ação primária por contexto; cortex-execution: apps/web/app/globals.css, docs/design/design-system.md; licença: interno; status: verified; sha256: fd16d9bb9701a367f848c0e47f476782ca48d4fa767bbf1a71c2fd4946043cc8
- ux-rule/precisa-de-alguem-primeiro: Precisa de alguém é filtro de primeira classe, ordenado pelo que uma pessoa destrava num clique; cortex-execution: docs/planning/specs/workspace-gestao-de-trabalho.md (F6, RN-U01..U21), docs/features/usabilidade-f6.md; licença: interno; status: verified; sha256: b29839b6693cf96164935d2034b39ee23bb6c72d733f9b45ceea52c88ef502d3
- ux-rule/vazio-que-ensina-o-proximo-passo: Estado vazio que ensina o próximo passo; cortex-execution: apps/web/app/globals.css, docs/design/design-system.md; licença: interno; status: verified; sha256: be8afdfd5ea8d1341cb1ba0485e41037711a7f7c55695122df30d41cdd12064f
- ux-rule/ler-na-pagina-escrever-no-drawer: Ler na página, escrever no drawer; cortex-execution: apps/web/app/globals.css, docs/design/design-system.md; licença: interno; status: verified; sha256: 11917cadd69feb1133209d48b9df09089edcb2bf5f6177b7676e9b567ada4164

## Limitações

- Sistema composto em draft: síntese determinística de tokens, não garantia automática de originalidade ou liberação de direitos.
- Nenhum HTML/CSS/JS, mídia, marca ou fonte de terceiros foi copiado. Tipografia usa system-ui.
- Padrões são orientações atribuídas para implementação por seção; não são componentes de terceiros transplantados.
- Contraste AA validado apenas para texto/fundo, texto/superfície e texto/acento; demais estados exigem revisão visual.
- Amostra limitada: 1000 nós examinados, 60 elementos visíveis e 30 animações por estado; keyframes limitados a 12.
- Declarações CSS não provam movimento; snapshots e Web Animations API são observações pontuais, sem inferência causal.
- Canvas, WebGL, shadow DOM, iframes, cliques e gestos não são inspecionados. Nenhuma biblioteca é inferida.
- Entrada anterior à amostragem pode ser perdida. Hover/foco cobrem apenas o primeiro controle visível; scroll cobre um passo.
- Reduced motion é amostrado em uma nova carga; não é auditoria completa de acessibilidade.
- Hover/foco indisponível: controle removido, coberto ou não acionável.
