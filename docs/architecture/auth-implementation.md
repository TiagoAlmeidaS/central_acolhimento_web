# Implementação de Autenticação (Supabase Auth + JWT na API)

**Referência de design:** [Design de Autenticação](auth-design.md).

Este documento descreve o que foi implementado: **Supabase Auth no Web** e **proteção da API com JWT** no central_ms.

---

## 1. Visão geral

| Camada | Implementação |
|--------|----------------|
| **Web (React)** | Login com e-mail/senha e Google (OAuth), sessão Supabase, rotas protegidas, cliente API envia `Authorization: Bearer <access_token>`. |
| **API (central_ms)** | Quando Supabase está configurado e `Supabase:JwtSecret` está preenchido, todos os endpoints em `/api/*` exigem JWT válido (emitido pelo Supabase Auth). Sem JwtSecret (ex.: ambiente InMemory ou testes), os endpoints permanecem abertos. |

---

## 2. Web (central_acolhimento_web)

### 2.1 Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API do central_ms (ex.: `http://localhost:5000` ou `https://api.seudominio.com`). |
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex.: `https://SEU_PROJECT_REF.supabase.co`). Dashboard → Settings → API. |
| `VITE_SUPABASE_ANON_KEY` | Chave **anon** (pública) do Supabase. Dashboard → Settings → API. |

**Comportamento:**

- Se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` **não** estiverem definidos (ou vazios), o app **não** exige login: todas as rotas ficam acessíveis e as chamadas à API não enviam token.
- Se estiverem definidos, a tela de login é exibida e as rotas internas são protegidas; após login, o cliente API envia o `access_token` da sessão Supabase em todas as requisições.

### 2.2 Componentes e fluxo

- **`AuthProvider`** — Context que mantém sessão Supabase (`session`, `user`, `loading`) e métodos `signInWithPassword`, `signInWithGoogle`, `signOut`, `getAccessToken`.
- **`ApiAuthBinder`** — Conecta `getAccessToken` ao cliente da API (`setApiAuthTokenGetter`), para que toda chamada HTTP inclua `Authorization: Bearer <token>` quando houver sessão.
- **`RequireAuth`** — Envolve rotas protegidas: se Supabase está configurado e não há sessão, redireciona para `/login`; caso contrário renderiza os filhos.
- **`LoginPage`** — Formulário e-mail/senha + botão “Entrar com Google”. Em modo sem Supabase, exibe mensagem e link para ir ao sistema.

### 2.3 Google OAuth

Para usar “Entrar com Google”, configure o provider Google no Dashboard do Supabase: **Authentication → Providers → Google** (Client ID e Secret do Google Cloud Console). A URL de redirecionamento deve incluir a URL do seu projeto Supabase (ex.: `https://SEU_REF.supabase.co/auth/v1/callback`).

---

## 3. API (central_acolhimento_ms)

### 3.1 Configuração

No `appsettings.json` ou `appsettings.Development.json` (ou variáveis de ambiente), a seção **Supabase** pode incluir:

| Chave | Uso |
|-------|-----|
| `Supabase:Url` | URL do projeto (já usado para persistência). |
| `Supabase:ServiceRoleKey` | Service role key (já usado para repositórios). |
| `Supabase:JwtSecret` | **JWT Secret** do projeto (Dashboard → Project Settings → API → JWT Secret). Usado para validar a assinatura dos tokens emitidos pelo Supabase Auth. |

**Comportamento:**

- Se **não** houver `Supabase:Url` + `Supabase:ServiceRoleKey`, o MS usa repositórios InMemory e **não** adiciona autenticação JWT (endpoints abertos; testes de integração continuam passando).
- Se houver Url + ServiceRoleKey e **também** `Supabase:JwtSecret`, o MS adiciona `Microsoft.AspNetCore.Authentication.JwtBearer`, valida o token (issuer = `{Supabase:Url}/auth/v1`, audience = `authenticated`, HS256) e exige usuário autenticado em todos os endpoints sob `/api/*`.

### 3.2 Testes de integração

Os testes de integração (`CentralAcolhimento.Api.IntegrationTests`) rodam a API em ambiente **Testing** com Supabase vazio (InMemory). Nenhum JWT é configurado, portanto os endpoints permanecem abertos e os 15 testes passam sem alteração.

---

## 4. Resumo

- **Web:** Login (e-mail/senha e Google) via Supabase Auth; rotas protegidas quando Supabase está configurado; cliente API envia Bearer token.
- **API:** JWT obrigatório em `/api/*` apenas quando `Supabase:JwtSecret` está configurado; caso contrário, endpoints abertos (dev/InMemory/testes).
- Documentação de design: [auth-design.md](auth-design.md). Configuração de deploy: [Integração e primeira release](../deployment/integracao-e-primeira-release.md).
