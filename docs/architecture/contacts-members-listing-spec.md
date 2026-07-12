# Contacts And Members Listing Spec

## Objetivo

Reestruturar as paginas de `Contatos` e `Membros` para separar claramente:

- `Listagem`
- `Filtros`
- `Paginacao`
- `Cadastro`
- `Edicao`

O objetivo e deixar o fluxo mais proximo de um CRUD real de operacao:

- a primeira tela mostra lista e filtros;
- criar e editar deixam de competir pelo mesmo espaco da listagem;
- o formulario passa a viver em tela dedicada ou drawer/modal controlado;
- o carregamento fica mais leve e escalavel conforme a base cresce.

## Problema atual

Hoje as paginas misturam:

- cards de resumo;
- formulario de criacao/edicao;
- listagem;
- acoes operacionais.

Isso traz alguns problemas:

- a listagem perde protagonismo;
- a pagina cresce demais no mobile;
- filtros ficam limitados;
- nao existe paginacao real;
- criar e editar disputam contexto com a triagem do dia a dia;
- a URL nao representa o estado da tela.

## Decisao de produto

Vamos adotar um modelo em duas camadas para `Contatos` e `Membros`.

### Camada 1: Listagem operacional

Tela principal voltada para consulta, filtro, triagem e acoes rapidas.

### Camada 2: Cadastro e edicao

Tela dedicada para criar ou editar registro, reaproveitando o mesmo formulario atual.

## Navegacao proposta

### Contatos

- `GET /coord/contatos`
  - listagem principal
  - filtros
  - cards resumidos
  - tabela/lista paginada
- `GET /coord/contatos/novo`
  - formulario de criacao
- `GET /coord/contatos/[contactId]/editar`
  - formulario de edicao

### Membros

- `GET /coord/membros`
  - listagem principal
  - filtros
  - cards resumidos
  - tabela/lista paginada
- `GET /coord/membros/novo`
  - formulario de criacao
- `GET /coord/membros/[memberId]/editar`
  - formulario de edicao

## Estrutura de UX

### Principio

A pagina inicial deve responder primeiro:

- quem esta na lista;
- quantos registros existem;
- como refinar;
- o que precisa de acao.

Criar ou editar vira uma acao secundaria acionada por:

- botao `Novo contato`
- botao `Novo membro`
- acao `Editar`

### Mobile first

No mobile:

- cards de resumo em carrossel horizontal ou grid compacto;
- filtros em sheet, drawer ou bloco expansivel;
- lista em cards por item;
- paginacao simplificada com `Anterior`, `Proxima` e resumo `Pagina X de Y`;
- CTA fixo no rodape ou header flutuante para `Novo contato` e `Novo membro`.

No desktop:

- filtros em barra superior e bloco expandido;
- tabela com colunas principais;
- pagina dedicada para cadastro/edicao;
- acao rapida por linha.

## Escopo funcional da tela de contatos

### Tela principal

Elementos:

- cards de resumo do funil;
- barra de busca;
- filtros avancados;
- listagem paginada;
- CTA de novo contato.

### Filtros de contatos

Filtros solicitados e recomendados:

- `Nome`
- `Cidade`
- `Localidade` (tenant)
- `Cuidador`
- `Data`
  - por padrao usar `firstContactAt`
- `Descricao`
  - busca em `notes`

Filtros adicionais pertinentes:

- `Status`
  - `new`
  - `contacted`
  - `in_progress`
  - `consolidated`
  - `inactive`
- `Origem do contato`
- `Casa aberta`
  - sim / nao
- `Sem cuidador`
  - sim / nao

### Colunas sugeridas para contatos

Desktop:

- Nome
- Telefone
- Cidade
- Localidade
- Cuidador
- Origem
- Primeiro contato
- Status
- Atualizado em ou criado em
- Acoes

Mobile card:

- Nome
- Cidade + localidade
- Telefone
- Status
- Primeiro contato
- Cuidador
- CTA `Ver`, `Editar`, `Converter`, `Excluir`

### Acoes por contato

- Ver detalhes
- Editar
- Converter para membro
- Excluir

## Escopo funcional da tela de membros

### Tela principal

Elementos:

- cards de resumo por status;
- barra de busca;
- filtros avancados;
- listagem paginada;
- CTA de novo membro.

### Filtros de membros

Filtros solicitados e recomendados:

- `Nome`
- `Cidade`
- `Localidade` (tenant)
- `Cuidador`
- `Data`
  - por padrao usar `createdAt`
- `Descricao`
  - busca em `notes`
- `Status`

Filtros adicionais pertinentes:

- `Idade`
  - faixa opcional
- `Data de nascimento`
- `Urgente`
  - sim / nao
- `Sem cuidador`
  - sim / nao
- `Ultimo contato`
  - faixa de data

### Colunas sugeridas para membros

Desktop:

- Nome
- Telefone
- Cidade
- Localidade
- Cuidador
- Status
- Ultimo contato
- Idade ou nascimento
- Criado em
- Acoes

Mobile card:

- Nome
- Cidade + localidade
- Status
- Cuidador
- Telefone
- Ultimo contato
- CTA `Ver`, `Editar`, `Alterar status`, `Excluir`

### Acoes por membro

- Ver detalhes
- Editar
- Alterar status
- Designar cuidador
- Excluir

## Paginacao

### Comportamento

As telas de contatos e membros devem ser paginadas no servidor.

Parametros sugeridos:

- `page`
- `pageSize`
- `sortBy`
- `sortOrder`

### Tamanhos recomendados

- mobile: `10` por pagina
- desktop: `20` por pagina

### Resposta esperada

Toda listagem deve retornar:

- `items`
- `page`
- `pageSize`
- `totalItems`
- `totalPages`

## Busca e filtros

### Estrategia

Os filtros devem ser refletidos na URL por query string.

Exemplo para contatos:

- `/coord/contatos?page=2&tenantId=2&city=Mamanguape&caregiverId=1&status=new&query=ana`

Exemplo para membros:

- `/coord/membros?page=1&tenantId=1&status=in_progress&city=Sape&query=maria`

### Beneficios

- refresh preserva estado;
- compartilhamento de link filtrado;
- navegacao consistente;
- preparacao para SSR e cache por query.

## Telas de cadastro e edicao

### Reaproveitamento

Nao precisamos criar formularios novos do zero.

Vamos reaproveitar o formulario atual de:

- `ContactManager`
- `MemberManager`

Mas extraindo a parte de formulario para componentes dedicados, por exemplo:

- `ContactForm`
- `MemberForm`

### Organizacao sugerida

- `ContactListPage`
- `ContactFormPage`
- `MemberListPage`
- `MemberFormPage`

Ou, no App Router:

- `app/(app)/coord/contatos/page.tsx`
- `app/(app)/coord/contatos/novo/page.tsx`
- `app/(app)/coord/contatos/[contactId]/editar/page.tsx`
- `app/(app)/coord/membros/page.tsx`
- `app/(app)/coord/membros/novo/page.tsx`
- `app/(app)/coord/membros/[memberId]/editar/page.tsx`

## Backend e contratos

### Novas necessidades para contatos

Evoluir `GET /api/seeds` para suportar:

- `page`
- `pageSize`
- `query`
- `city`
- `tenantId`
- `caregiverId`
- `status`
- `source`
- `openHouse`
- `dateFrom`
- `dateTo`
- `notes`

### Novas necessidades para membros

Evoluir `GET /api/members` para suportar:

- `page`
- `pageSize`
- `query`
- `city`
- `tenantId`
- `caregiverId`
- `status`
- `urgent`
- `dateFrom`
- `dateTo`
- `lastContactFrom`
- `lastContactTo`
- `notes`

### Ordenacao

Ordenacoes recomendadas:

Contatos:

- `firstContactAt desc` por padrao
- opcionalmente `createdAt desc`

Membros:

- `createdAt desc` por padrao
- opcionalmente `lastContact desc`

## Regras de negocio

### Contatos

- coordenacao multi-tenant pode listar e filtrar apenas tenants vinculados;
- cuidador continua restrito ao proprio tenant e ao proprio escopo;
- converter contato para membro deve manter contexto de tenant;
- excluir contato deve continuar respeitando permissao de tenant.

### Membros

- coordenacao multi-tenant pode listar e editar membros dos tenants vinculados;
- cuidador continua restrito ao proprio tenant e ao proprio vinculo quando aplicavel;
- mudanca de status deve continuar consistente com dashboard;
- designacao de cuidador deve limitar cuidadores da mesma localidade.

## Performance

### Por que essa mudanca importa

Hoje carregamos listas inteiras para depois operar em memoria na interface.

Isso nao escala bem para:

- centenas de contatos;
- centenas de membros;
- filtros compostos;
- multi-tenant na mesma conta.

### Direcao tecnica recomendada

- mover filtro e pagina para o servidor;
- retornar apenas o recorte da pagina;
- manter contadores resumidos em queries separadas ou agregadas;
- indexar campos usados em filtro e ordenacao.

## Indexacao sugerida

### Seeds

- `tenant_id`
- `caregiver_id`
- `status`
- `city`
- `first_contact_at`
- `created_at`

### Members

- `tenant_id`
- `caregiver_id`
- `status`
- `city`
- `created_at`
- `last_contact`

Observacao:

`Descricao` e busca textual em `notes` podem ficar inicialmente com `ILIKE` simples. Se crescer, vale evoluir para busca textual dedicada.

## Fases de implementacao

### Fase 1

- separar listagem e formulario em paginas diferentes;
- manter o formulario atual reaproveitado;
- adicionar filtros basicos em tela;
- implementar paginacao server-side;
- refletir filtros na URL.

### Fase 2

- refinar layout mobile first;
- adicionar filtros avancados colapsaveis;
- adicionar ordenacao configuravel;
- melhorar cards de resumo com base nos filtros atuais.

### Fase 3

- drawer de detalhes;
- salvar filtros recentes;
- exportacao simples;
- busca textual melhorada.

## Decisoes recomendadas

### Para implementacao imediata

1. `Contatos` passa a abrir em listagem, nao em formulario.
2. `Membros` passa a abrir em listagem, nao em formulario.
3. Criacao e edicao vao para telas dedicadas.
4. Filtros entram primeiro no servidor, nao apenas no client.
5. Paginacao e query string viram contrato obrigatorio dessas paginas.

### O que nao recomendo agora

- fazer filtro apenas visual no client para listas grandes;
- manter listagem e formulario gigantes na mesma tela;
- criar duas experiencias diferentes entre mobile e desktop em termos de regra de negocio.

## Resultado esperado

Ao final dessa reestruturacao:

- `Contatos` vira uma tela real de triagem operacional;
- `Membros` vira uma tela real de acompanhamento e consulta;
- o cadastro deixa de poluir a leitura da lista;
- a aplicacao fica pronta para crescimento de volume e multi-tenant com menos friccao.
