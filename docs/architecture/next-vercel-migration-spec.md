# Spec de Migração para Next.js e Publicação na Vercel

**Projeto:** Central de Acolhimento  
**Data:** 2026-07-02  
**Objetivo:** definir o escopo, a estratégia e a estimativa para:

1. migrar o frontend atual de React + Vite para Next.js;
2. preparar a publicação na Vercel;
3. decidir a melhor abordagem para a API no contexto da Vercel.

---

## 1. Decisão de arquitetura

### Decisão recomendada

Para o MVP, a recomendação é:

- migrar o frontend para **Next.js App Router**;
- publicar o app web na **Vercel**;
- **não** tentar levar a API atual em `.NET` para Vercel como primeira opção;
- para a versão de demonstração, centralizar as operações simples do MVP em:
  - `Route Handlers`;
  - `Server Actions`;
  - acesso direto ao Supabase.

### Motivo

A Vercel tem suporte oficial forte para o ecossistema do Next.js e para runtimes como Node.js, Python, Ruby e Go. `.NET` não aparece como runtime oficial; para isso seria necessário depender de runtime comunitário/customizado, o que aumenta risco técnico, acoplamento e manutenção.

---

## 2. O que vamos migrar

### Escopo da migração para Next

- autenticação;
- layout desktop;
- layout mobile;
- navegação;
- design system/Tailwind;
- páginas principais do MVP;
- integração com Supabase;
- endpoints do MVP no próprio projeto Next, se necessário.

### O que não entra nesta primeira etapa

- IA;
- WhatsApp/Evolution API;
- relatórios avançados;
- upload de documentos;
- push notifications;
- billing/assinaturas;
- chat;
- automações complexas.

---

## 3. Estrutura alvo

### App Router

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

### Domínio

- `tenants`
- `users`
- `caregivers`
- `members`
- `seeds`
- `followups`
- `dashboard`

---

## 4. Estratégias possíveis para a API

### Opção A — Manter a API .NET fora da Vercel

**Como fica**

- Next.js na Vercel
- API `.NET` em outro host
- Supabase como banco/auth

**Prós**

- menor retrabalho no backend atual;
- mantém separação de responsabilidades;
- útil se a API for crescer em regras complexas.

**Contras**

- dois deploys;
- dois ambientes;
- mais custo operacional;
- menos velocidade para o MVP.

**Esforço estimado**

- baixo para frontend;
- médio para integração e ambiente.

### Opção B — Reescrever o MVP da API dentro do Next

**Como fica**

- Next.js na Vercel
- `app/api/*` e/ou `Server Actions`
- Supabase como banco/auth

**Prós**

- deployment único;
- menor tempo até demo;
- menor custo operacional;
- excelente encaixe na Vercel.

**Contras**

- parte da lógica atual da API terá de ser portada;
- exige decidir cedo o modelo de dados do MVP.

**Esforço estimado**

- médio;
- porém com o melhor custo-benefício para demo.

### Opção C — Levar a API .NET atual para Vercel

**Como fica**

- tentativa de empacotar `.NET` usando runtime não oficial/comunitário

**Prós**

- aparentemente reaproveita o backend existente.

**Contras**

- risco alto;
- suporte oficial fraco;
- troubleshooting mais difícil;
- pior previsibilidade para produção curta e demo.

**Esforço estimado**

- médio/alto;
- com alto risco de atraso.

### Recomendação

Escolher a **Opção B** para o MVP.

---

## 5. Estimativa de esforço

### 5.1 Migração estrutural para Next

Inclui:

- bootstrap do projeto;
- App Router;
- providers;
- auth;
- layouts;
- Tailwind;
- aliases;
- configuração de ambiente e deploy.

**Estimativa:** 1 a 2 dias

### 5.2 Port das telas e navegação

Inclui:

- login;
- shell do coordenador;
- shell do cuidador;
- páginas principais do MVP;
- adaptação mobile first.

**Estimativa:** 2 a 3 dias

### 5.3 Reestruturação do domínio MVP

Inclui:

- tenant/cidade;
- membros;
- cuidadores;
- acompanhamentos;
- seeds;
- status;
- métricas básicas.

**Estimativa:** 1 a 2 dias

### 5.4 API do MVP no próprio Next

Inclui:

- CRUD cidades;
- CRUD cuidadores;
- CRUD membros;
- designação de cuidador;
- registro de acompanhamento;
- queries do dashboard.

**Estimativa:** 2 a 4 dias

### 5.5 Publicação na Vercel

Inclui:

- projeto;
- variáveis de ambiente;
- domínio preview/produção;
- validação de build;
- smoke test;
- observabilidade básica.

**Estimativa:** 0.5 a 1 dia

---

## 6. Faixas de prazo por estratégia

### Estratégia recomendada

**Next + API MVP no próprio Next + Vercel**

**Prazo estimado total:** 6 a 10 dias úteis

### Estratégia híbrida

**Next na Vercel + API .NET separada**

**Prazo estimado total:** 7 a 12 dias úteis

### Estratégia não recomendada

**Next + API .NET tentando rodar na Vercel**

**Prazo estimado total:** 8 a 14 dias úteis  
**Risco:** alto

---

## 7. Complexidade por frente

### Migração para Next

**Complexidade:** média  
**Risco:** baixo/médio

Pontos de atenção:

- reorganização das rotas;
- separação server/client components;
- reuso do CSS/Tailwind;
- ajuste da autenticação.

### Modelo multi-tenant

**Complexidade:** média  
**Risco:** médio

Pontos de atenção:

- tenant obrigatório desde o começo;
- filtros e relacionamentos;
- escopo de dados por cidade.

### Dashboard real

**Complexidade:** média  
**Risco:** médio

Pontos de atenção:

- definir exatamente os indicadores do MVP;
- garantir consultas simples e confiáveis;
- evitar gráficos sofisticados cedo demais.

### API .NET na Vercel

**Complexidade:** alta  
**Risco:** alto

Pontos de atenção:

- runtime não oficial;
- build/deploy menos previsível;
- observabilidade e suporte piores;
- maior custo de manutenção.

---

## 8. Custos e operação na Vercel

### Baixo custo inicial

Para MVP e demonstração, a Vercel é favorável porque:

- o app Next entra muito bem no fluxo da plataforma;
- preview deployments por branch ajudam validação;
- CDN e SSR já vêm no modelo do Next;
- é simples operar um único projeto.

### Cuidado principal

Se a aplicação depender de muitas funções server-side, consultas frequentes e dashboards dinâmicos, o custo de Functions passa a importar. Para o MVP isso tende a ser controlável, mas a arquitetura precisa ser pensada para:

- cachear onde fizer sentido;
- não recalcular dashboard de forma pesada a cada request;
- manter queries simples;
- aproximar a região da compute do banco.

---

## 9. Critérios de pronto

### Fase 1 — Migração para Next concluída

- projeto Next criado;
- autenticação funcionando;
- layouts desktop e mobile portados;
- rotas principais do MVP operacionais;
- deploy de preview funcionando na Vercel.

### Fase 2 — MVP operacional publicado

- CRUD de cidade;
- CRUD de cuidadores;
- CRUD de membros;
- designação de cuidador;
- registro de acompanhamento;
- dashboard do coordenador;
- dashboard do cuidador;
- produção na Vercel com variáveis configuradas.

---

## 10. Recomendação final

### Melhor caminho

1. migrar imediatamente para **Next.js App Router**;
2. redesenhar o domínio mínimo do MVP;
3. portar a lógica essencial da API para o próprio Next;
4. publicar o MVP inteiro na **Vercel**;
5. reavaliar depois se ainda faz sentido manter um backend `.NET` separado.

### Síntese

- **Migrar o frontend para Next:** faz total sentido.
- **Publicar na Vercel:** faz total sentido.
- **Rodar a API .NET atual dentro da Vercel:** não é a melhor aposta para este momento.

---

## 11. Referências oficiais consultadas

- Vercel Functions e runtimes oficiais: https://vercel.com/docs/functions/configuring-functions/runtime
- Vercel runtimes suportados: https://vercel.com/docs/functions/runtimes
- Next.js na Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs
- Vercel Functions API Reference: https://vercel.com/docs/functions/functions-api-reference
- Vercel pricing: https://vercel.com/docs/pricing
- Vercel plans: https://vercel.com/pricing
