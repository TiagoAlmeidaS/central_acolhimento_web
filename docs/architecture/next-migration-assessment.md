# Avaliação de Migração para Next.js

**Projeto:** Central de Acolhimento Web  
**Data:** 2026-07-02  
**Objetivo:** avaliar o estado atual do projeto, aderência ao MVP definido para demonstração e preparação para migração para Next.js com abordagem mobile first.

---

## 1. Resumo executivo

O projeto atual já possui:

- interface navegável para coordenação e cuidador;
- autenticação com Supabase no frontend;
- integração HTTP com a API `central_ms`;
- CRUD real de cuidadores (`membros`);
- CRUD real de convidados (`contatos_tci`);
- atribuição de responsável para convidados;
- schema inicial no Supabase.

O projeto **ainda não está pronto como MVP completo para demonstração de uso real** porque os fluxos mais importantes continuam parciais ou estáticos:

- dashboard de coordenação é mockado;
- dashboard do cuidador é mockado;
- acompanhamento/timeline não existe como fluxo funcional;
- cidade/tenant não existe no modelo nem na navegação;
- sementes não existem como entidade;
- indicadores do dashboard não são calculados a partir de dados reais;
- páginas de relatórios e configurações são majoritariamente visuais.

Conclusão: a base atual serve bem como **protótipo visual + início de backoffice**, mas ainda não como **MVP operacional de ponta a ponta**.

---

## 2. O que existe hoje

### Frontend atual

- Stack: React 18 + Vite + TypeScript + Tailwind.
- Roteamento: `react-router-dom`.
- Auth: Supabase Auth.
- Integração backend: `src/api/client.ts`.

### Rotas implementadas

- `/login`
- `/`
- `/cuidadores`
- `/convidados`
- `/relatorios`
- `/configuracoes`
- `/meu-servico`
- `/mapa`
- `/metabolismo`

### Backend consumido

O frontend já consome endpoints para:

- listar/criar/editar cuidadores;
- listar/criar convidados;
- atribuir cuidador a convidado.

### Banco/modelo atual

Entidades reais hoje:

- `profiles`
- `membros`
- `contatos_tci`
- `interacoes_cuidado`

---

## 3. Aderência ao MVP desejado

### 3.1 Login

**Status:** parcialmente pronto

Existe:

- login com email e senha;
- login com Google;
- proteção de rotas;
- logout no layout desktop.

Falta para o MVP:

- redirecionamento por papel;
- definição clara de papéis `coordenador` e `cuidador`;
- experiência de seleção de cidade/tenant após login.

### 3.2 Cidade / Tenant

**Status:** não implementado

Não existe hoje:

- tabela de tenant/cidade;
- vínculo de usuário com tenant;
- filtro por tenant;
- CRUD de cidade;
- ativação/inativação por cidade.

Esse é o maior gap estrutural para escalar.

### 3.3 Membros

**Status:** parcialmente pronto

Existe hoje:

- cadastro/listagem de convidados em `ConvidadosPage`;
- status de ciclo de vida;
- atribuição de responsável.

Problemas em relação ao MVP:

- o naming ainda está preso em `Convidados/TCI`, não em `Membros`;
- faltam campos do MVP, como endereço, cidade, data de nascimento, observações;
- a tela ainda é mais operacional do que mobile first;
- não existe histórico de acompanhamento exibido por pessoa.

### 3.4 Cuidadores

**Status:** parcialmente pronto

Existe hoje:

- CRUD funcional de cuidadores;
- listagem com busca/filtro;
- edição via modal.

Falta:

- campo de cidade vinculado ao tenant;
- campo ativo/inativo;
- visão de carga real por quantidade de pessoas acompanhadas;
- dashboard do cuidador baseado em dados reais.

### 3.5 Acompanhamento / Timeline

**Status:** modelado no banco, mas não implementado no produto

Existe no schema:

- `interacoes_cuidado` com tipo e relato.

Não existe no frontend:

- cadastro funcional de acompanhamento;
- timeline por membro;
- próximo contato/próxima ação;
- filtro por cuidador;
- contagem de visitas/acompanhamentos.

Hoje a tela `/metabolismo` é apenas um protótipo visual.

### 3.6 Dashboard do coordenador

**Status:** visual pronto, dados mockados

Existe:

- uma boa interface para vender a visão do sistema;
- cards, kanban e capacidade visual.

Falta:

- dados reais;
- indicadores do MVP;
- tabela de últimos acompanhamentos;
- próximas visitas;
- métricas por tenant;
- métricas de sementes.

### 3.7 Dashboard do cuidador

**Status:** visual pronto, não funcional

Existe:

- layout mobile;
- ações rápidas;
- páginas com linguagem amigável.

Falta:

- minhas pessoas reais;
- próximas ações reais;
- últimos registros reais;
- botão registrar acompanhamento persistindo no banco.

---

## 4. Diagnóstico de escalabilidade

### O que ajuda

- TypeScript já está presente.
- Separação entre frontend e backend já existe.
- Supabase Auth já reduz trabalho inicial.
- Há documentação de arquitetura e schema.
- O projeto já tem duas visões de produto: coordenação e cuidador.

### O que atrapalha

- modelo atual não é multi-tenant;
- domínio está misturado com linguagem de protótipo antigo (`TCI`, `metabolismo`, `rede oração`, `WhatsApp`, IA);
- várias telas centrais ainda estão hardcoded;
- frontend depende de um microserviço separado para operações simples que poderiam estar mais próximas do app;
- não há camada de queries/cache de dados no frontend;
- não há estrutura orientada a módulos de domínio;
- mobile first existe no layout de algumas telas, mas não na arquitetura geral do produto.

---

## 5. Next.js faz sentido?

**Sim, faz sentido migrar.**  
Mas a maior vantagem não é “performance mágica”; é **organização e capacidade de crescimento**.

### Benefícios reais da migração

- App Router facilita separar áreas por domínio: `(auth)`, `(coordenador)`, `(cuidador)`.
- Server Components ajudam em páginas de dashboard e listagens.
- Server Actions e Route Handlers podem reduzir parte da cola entre frontend e backend em operações simples.
- Melhor estrutura para layouts aninhados por papel e por tenant.
- Deploy simples na Vercel.
- Melhor base para padronizar mobile first desde o início.

### O que Next.js não resolve sozinho

- ausência de tenant;
- ausência de timeline funcional;
- dashboard mockado;
- modelo de dados incompleto;
- linguagem de negócio ainda indefinida.

Ou seja: migrar para Next ajuda, mas **o ganho real vem de remodelar o domínio junto**.

---

## 6. Recomendação de arquitetura para o MVP em Next

### Stack sugerido

- Next.js 15+ com App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- TanStack Query apenas se o app continuar consumindo `central_ms`

### Estrutura sugerida

- `app/(auth)/login/page.tsx`
- `app/(app)/selecionar-cidade/page.tsx`
- `app/(app)/coord/dashboard/page.tsx`
- `app/(app)/coord/cidades/page.tsx`
- `app/(app)/coord/membros/page.tsx`
- `app/(app)/coord/cuidadores/page.tsx`
- `app/(app)/coord/acompanhamentos/page.tsx`
- `app/(app)/cuidador/dashboard/page.tsx`
- `app/(app)/cuidador/pessoas/page.tsx`
- `app/(app)/cuidador/acompanhamentos/novo/page.tsx`

### Módulos de domínio sugeridos

- `tenants`
- `users`
- `caregivers`
- `members`
- `seeds`
- `followups`
- `dashboard`

---

## 7. Modelo de dados recomendado para escalar

### Entidades mínimas

- `tenants`
- `users`
- `caregivers`
- `members`
- `seeds`
- `followups`

### Relacionamentos

- um `tenant` possui muitos `users`
- um `tenant` possui muitos `caregivers`
- um `tenant` possui muitos `members`
- um `member` pode nascer de uma `seed`
- um `caregiver` acompanha muitos `members`
- um `member` possui muitos `followups`

### Campos importantes

#### tenants

- id
- nome
- cidade
- estado
- coordinator_user_id
- status

#### users

- id
- tenant_id
- nome
- email
- role (`coordinator` | `caregiver`)
- active

#### caregivers

- id
- tenant_id
- user_id opcional
- nome
- telefone
- email
- active

#### members

- id
- tenant_id
- caregiver_id
- seed_id opcional
- nome
- telefone
- endereco
- cidade
- data_nascimento
- status (`novo`, `em_acompanhamento`, `consolidado`, `inativo`)
- observacoes

#### seeds

- id
- tenant_id
- nome_referencia
- status
- created_at

#### followups

- id
- tenant_id
- member_id
- caregiver_id
- tipo (`visita`, `ligacao`, `mensagem`, `oracao`, `outro`)
- data
- observacao
- proxima_acao_em
- created_at

---

## 8. Estratégia recomendada até sábado

### Opção recomendada

Não tentar migrar tudo do Vite para Next antes da demonstração.

Fazer:

1. reaproveitar o protótipo atual como referência visual;
2. construir o MVP em Next focando só no fluxo operacional;
3. deixar relatórios avançados, IA, WhatsApp e configurações complexas fora do escopo.

### Motivo

Migrar toda a base agora carrega muito peso visual estático e pouco valor funcional.  
Para a demo, o que importa é:

- login;
- selecionar cidade;
- cadastrar membro;
- cadastrar cuidador;
- designar cuidador;
- registrar acompanhamento;
- ver dashboard simples atualizado.

---

## 9. Decisão prática

### Se o objetivo é demo até sábado

Criar um **novo app Next enxuto** e portar apenas:

- identidade visual;
- login;
- lista/cadastro de cuidadores;
- lista/cadastro de membros;
- atribuição de cuidador;
- registro de acompanhamento;
- dashboards simples.

### Se o objetivo é continuidade de longo prazo

Usar essa mesma base Next como produto principal e aposentar gradualmente o app Vite.

---

## 10. Conclusão final

O projeto atual **não está ainda alinhado ao MVP descrito**, embora já tenha peças úteis e reaproveitáveis.

Ele está mais próximo de:

- um protótipo navegável bem desenhado;
- um início de CRUD de backoffice;
- uma base documental razoável.

Ele ainda não está próximo de:

- uma Central de Acolhimento operando de ponta a ponta;
- um modelo multi-tenant pronto para crescer;
- um dashboard confiável baseado em dados reais.

A melhor decisão para escalar com menos atrito é:

- migrar para Next.js;
- simplificar o domínio para o MVP;
- introduzir tenant desde o começo;
- transformar acompanhamento em entidade central;
- priorizar fluxo funcional antes de relatórios e automações.
