# Integração Web ↔ MS e primeira release

Este documento resume **o que falta para a integração** dos dois projetos (central_acolhimento_web e central_acolhimento_ms) e o **passo a passo para enviar a primeira versão** ao repositório remoto.

---

## 1. O que falta para a integração dos dois

A integração funcional (Web chamando a API do MS) já está implementada: contratos, client API, telas Cuidadores e Convidados, atribuir responsável. Os itens abaixo fecham o cenário de uso em ambiente real.

| Item | Onde | Status / Observação |
|------|------|---------------------|
| **CORS na API** | central_ms | **Já configurado:** o MS usa política padrão que permite qualquer origem/método/header (adequado para dev; em produção convém restringir a origens específicas). |
| **URL da API no Web** | central_acolhimento_web | Definir `VITE_API_URL` no build/deploy (ex.: `https://api.seudominio.com`). Em dev, o client já usa fallback para `http://localhost:5000` (ou a porta em que o MS sobe). |
| **Supabase (schema)** | Ambos | Rodar as [migrations](database/README.md) no projeto Supabase (`supabase db push`) ou executar o script SQL único. Sem isso, o MS em modo Supabase não encontra as tabelas. |
| **Configuração Supabase no MS** | central_ms | Preencher `Supabase:Url` e `Supabase:ServiceRoleKey` (em `appsettings.Development.json` ou variáveis de ambiente) quando for usar persistência real. Sem isso, o MS usa in-memory. |
| **Supabase Auth no Web** | central_acolhimento_web | Opcional para a primeira versão: login Google/Email, tabela `profiles`, proteção de rotas. Ver [auth-design](architecture/auth-design.md). |
| **Proteger API com JWT** | central_ms | Opcional: validar JWT do Supabase no MS para garantir que apenas usuários autenticados acessem a API. |

Resumo: para a **primeira versão** basta garantir **VITE_API_URL** no deploy do Web e, se for usar banco real, **migrations no Supabase** e **config do Supabase no MS**. CORS já está ativo no MS. Auth e JWT podem vir depois.

---

## 2. .gitignore

Os dois repositórios já possuem `.gitignore` configurado:

- **central_acolhimento_web:** `node_modules/`, `dist/`, `.env*`, `supabase/.temp/`, pastas de IDE e OS.
- **central_acolhimento_ms:** `bin/`, `obj/`, `secrets.json`, `appsettings.Production.json`, pastas de IDE e OS.

Não versionar: chaves de API, `.env` com secrets, Service Role Key do Supabase.

---

## 3. Primeiro push (primeira versão do aplicativo)

Seguir em **cada repositório** (Web e MS). Ajuste o `remote` e o branch se o seu remoto for outro.

### 3.1 Repositório central_acolhimento_web

Na pasta do projeto Web:

```bash
cd /caminho/para/central_acolhimento_web

# Ver estado (arquivos novos/modificados)
git status

# Adicionar tudo (respeitando .gitignore)
git add .

# Primeiro commit da primeira versão
git commit -m "chore: primeira versão - Web (Cuidadores, Convidados, atribuir responsável, migrations Supabase, docs)"

# Se ainda não tiver remote:
# git remote add origin https://github.com/SEU_USUARIO/central_acolhimento_web.git

# Enviar (substitua main pelo branch que usar)
git push -u origin main
```

Opcional: marcar a primeira release com tag:

```bash
git tag -a v0.1.0 -m "Primeira versão - Central de Acolhimento Web"
git push origin v0.1.0
```

### 3.2 Repositório central_acolhimento_ms

Na pasta do projeto MS:

```bash
cd /caminho/para/central_acolhimento_ms

git status
git add .
git commit -m "chore: primeira versão - API (Membros, Contatos TCI, atribuir responsável, persistência In-Memory + Supabase, docs)"

# git remote add origin https://github.com/SEU_USUARIO/central_acolhimento_ms.git   # se necessário
git push -u origin main
```

Opcional:

```bash
git tag -a v0.1.0 -m "Primeira versão - Central de Acolhimento API"
git push origin v0.1.0
```

### 3.3 Ordem sugerida

1. Fazer push primeiro no **MS** (API), depois no **Web** (depende da API).
2. Ou fazer os dois em paralelo; o importante é que os dois estejam versionados com a primeira versão que você considera “release inicial”.

Depois do push, para rodar a primeira versão: aplicar as migrations no Supabase (se for usar banco real), configurar CORS e `VITE_API_URL` conforme a seção 1.
