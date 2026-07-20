# Comunicacao de contatos por cuidador

## Objetivo

Permitir que a coordenacao selecione membros na tela `Membros` e gere uma mensagem pratica, pronta para copiar e enviar a cada cuidador, contendo os nomes e telefones das pessoas sob sua responsabilidade.

A primeira versao nao envia mensagens automaticamente. Ela organiza os dados, gera a previa e copia o texto para a area de transferencia.

## Experiencia proposta

### 1. Selecionar membros

Cada card da lista em `/coord/membros` recebe um checkbox.

No cabecalho da lista deve existir o checkbox `Selecionar pagina`, com os estados:

- desmarcado: nenhum membro visivel selecionado;
- parcial: apenas parte dos membros visiveis selecionada;
- marcado: todos os membros visiveis selecionados.

Na V1, a selecao vale apenas para a pagina atual e e limpa quando a coordenacao troca de pagina ou altera os filtros. A interface deve informar `Selecao desta pagina` para nao sugerir que itens de outras paginas permanecem marcados.

### 2. Exibir a acao em lote

Quando existir pelo menos um membro selecionado, uma barra de acoes aparece acima da lista:

`3 membros selecionados | Gerar comunicado | Limpar selecao`

A acao `Gerar comunicado` abre uma previa sem alterar nenhum cadastro.

### 3. Agrupar por cuidador

Os membros selecionados sao agrupados pelo `caregiverId` atual. Cada cuidador recebe um bloco de mensagem separado.

Exemplo:

```text
Ola, Marta! Tudo bem?

Seguem os contatos das pessoas que estao sob o seu cuidado:

- Ana Souza — (83) 99999-1111
- Carlos Lima — (83) 99999-2222

Deus abencoe seu cuidado com cada um deles!
```

Para apenas uma pessoa, o texto deve usar o singular: `a pessoa que esta sob o seu cuidado` e `com ela`.

### 4. Copiar a mensagem

A previa apresenta um card por cuidador, contendo:

- nome do cuidador;
- telefone do cuidador, quando cadastrado;
- quantidade de membros no comunicado;
- mensagem em campo somente leitura;
- botao `Copiar mensagem`;
- confirmacao visual `Mensagem copiada`.

Tambem pode existir `Copiar todos`, separando as mensagens por uma linha divisoria. O fluxo principal, entretanto, e copiar uma mensagem por cuidador, porque cada texto tem um destinatario diferente.

## Regras e situacoes especiais

### Membro sem cuidador

Nao deve ser misturado a uma mensagem destinada a um cuidador. A previa mostra uma secao de atencao:

`2 membros sem cuidador atribuido. Atribua um cuidador antes de gerar o comunicado.`

Esses membros ficam fora dos textos copiaveis.

### Membro sem telefone

O membro permanece na mensagem com o texto `telefone nao informado`, e a previa exibe um alerta. O sistema nao deve omitir silenciosamente uma pessoa selecionada.

### Cuidador sem telefone

A mensagem ainda pode ser gerada e copiada. A previa informa que o telefone do destinatario nao esta cadastrado.

### Alteracao de cuidador durante a selecao

Ao trocar o cuidador no card de um membro, a selecao desse membro pode permanecer. A geracao deve usar o cuidador mais recente retornado apos a atualizacao da tela.

### Localidades diferentes

Se a coordenacao puder enxergar mais de uma localidade, o agrupamento continua sendo por `caregiverId`, nunca apenas pelo nome do cuidador. Isso evita unir pessoas diferentes que tenham o mesmo nome.

## Escopo da V1

### Entra

- checkbox em cada membro;
- selecionar todos os membros da pagina atual;
- contador e limpeza da selecao;
- agrupamento por cuidador;
- previa das mensagens;
- copiar uma mensagem;
- copiar todas as mensagens;
- avisos para membro sem cuidador ou telefone;
- feedback de sucesso ou erro ao copiar.

### Nao entra agora

- envio automatico por WhatsApp, SMS ou e-mail;
- historico de mensagens enviadas;
- editor de templates persistidos;
- selecao mantida entre paginas;
- selecao de todos os resultados de um filtro;
- alteracao de cuidador em lote;
- agendamento ou automacao de comunicacoes.

## Mapeamento na implementacao atual

### Interface

O ponto principal de alteracao e `src/ui/mvp/member-list.tsx`, que ja e um componente cliente e recebe:

- os membros visiveis da pagina;
- os cuidadores acessiveis;
- o `caregiverId` atribuido a cada membro;
- nome e telefone de membros e cuidadores.

Por isso, a V1 pode manter a selecao, agrupar os dados, montar o texto e usar `navigator.clipboard.writeText` inteiramente no navegador.

Uma funcao pura deve concentrar a montagem dos grupos e textos, em arquivo proprio, para permitir testes sem renderizar a interface.

Sugestao:

- `src/ui/mvp/member-communication-utils.ts`;
- `groupSelectedMembersByCaregiver(...)`;
- `buildCaregiverContactMessage(...)`.

### Backend e banco de dados

Nao sao necessarios endpoint, tabela ou migracao para a V1. A pagina ja entrega os dados necessarios ao componente.

O endpoint existente `/api/members/export` continua responsavel pelo CSV filtrado e nao deve ser reaproveitado para a comunicacao, pois ele retorna um arquivo administrativo com campos alem dos necessarios.

Uma API especifica somente passa a fazer sentido se a selecao precisar sobreviver a paginacao, representar todos os resultados filtrados ou registrar envios.

## Criterios de aceite

1. A coordenacao consegue marcar um ou varios membros da pagina atual.
2. A quantidade selecionada fica sempre visivel enquanto houver selecao.
3. Membros de cuidadores diferentes geram mensagens separadas.
4. Cada mensagem apresenta o nome do cuidador e o nome e telefone dos membros correspondentes.
5. `Copiar mensagem` coloca exatamente o texto exibido na area de transferencia.
6. A interface confirma a copia e apresenta erro caso o navegador a bloqueie.
7. Membros sem cuidador nao aparecem em mensagens destinadas a terceiros e sao destacados na previa.
8. Membros sem telefone aparecem como `telefone nao informado`.
9. Alterar filtros ou pagina nao pode manter uma selecao invisivel na V1.
10. A funcionalidade nao modifica membros, cuidadores ou acompanhamentos.

## Evolucao recomendada

Depois de validar o uso da copia manual, a proxima melhoria natural e adicionar `Abrir WhatsApp` ao card do cuidador. O botao pode abrir `wa.me` com o telefone do cuidador e a mensagem ja preenchida, ainda sem integracao ou envio automatico.
