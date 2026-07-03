# Notas de Implementação do Monólito Next

## O que foi feito nesta etapa

- base do projeto convertida de Vite para Next.js App Router;
- criação de estrutura inicial de monólito;
- criação de páginas iniciais em `src/app`;
- criação de autenticação local temporária para o novo app;
- criação de shells de navegação para coordenação e cuidador;
- criação de Route Handlers iniciais em `src/app/api`;
- criação de repositórios server-side do novo domínio MVP;
- criação de migration paralela para o novo schema do monólito;
- isolamento do código legado do Vite na configuração de TypeScript/ESLint.

## Observações

- O código antigo em `src/pages`, `src/components`, `src/contexts` e `src/api` foi preservado como referência de portabilidade.
- A nova base usa mocks em `src/server/mock-data.ts` até a modelagem definitiva do banco ser portada.
- A nova base já lê do Postgres quando as variaveis de banco estão configuradas, com fallback local quando nao estao.

## Próximas entregas sugeridas

1. aplicar a migration do novo schema no Postgres;
2. criar formulários de criação/edição para os módulos do MVP;
3. ligar as telas a POST/PUT reais do monólito;
4. adicionar controle por tenant na sessão;
5. publicar na Vercel com as variaveis de conexao Postgres injetadas pela integracao do Marketplace.
