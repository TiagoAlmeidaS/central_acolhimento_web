# Contratos Web ↔ Backend (central_ms)

**Fonte da verdade (backend):** [central_acolhimento_ms/docs/apis/use-cases-e-endpoints.md](../../central_acolhimento_ms/docs/apis/use-cases-e-endpoints.md) (repositório do microserviço).

Este documento descreve o mapeamento entre o front (central_acolhimento_web) e a API do central_ms: endpoints, request/response e enums.

---

## Base URL

Configurável via `VITE_API_URL` (ex.: `https://api.central.example.com`). Em desenvolvimento, o client usa `http://localhost:5000` por padrão.

---

## Enums (backend int → frontend)

| Enum | Valor (int) | Uso no Web |
|------|-------------|------------|
| **PerfilServico** | 0 = CasaAberta, 1 = RedeOracao, 2 = Coordenador | `api/types.ts` → `PerfilServico` |
| **StatusVida** | 0 = Novo, 1 = Visitado, 2 = FrequentaReuniao, 3 = Consolidado | `api/types.ts` → `StatusVida` |

O backend envia e recebe **inteiros**; o Web usa os enums em TypeScript para type-safety.

---

## Endpoints

| Método | Rota | Request | Response | Erros |
|--------|------|---------|----------|-------|
| POST | `/api/membros` | `CriarMembroRequest` (JSON PascalCase) | 201 + Membro | — |
| GET | `/api/membros` | Query opcional: `bairro` | 200 + Membro[] | — |
| GET | `/api/membros/{id}` | — | 200 + Membro | 404 |
| PUT | `/api/membros/{id}` | `AtualizarMembroRequest` | 200 + Membro | 404 |
| POST | `/api/contatos-tci` | `CriarContatoTciRequest` | 201 + ContatoTci | — |
| GET | `/api/contatos-tci` | — | 200 + ContatoTci[] | — |
| GET | `/api/contatos-tci/{id}` | — | 200 + ContatoTci | 404 |
| PUT | `/api/contatos-tci/{id}` | `AtualizarContatoTciRequest` | 200 + ContatoTci | 404 |
| POST | `/api/contatos-tci/{contatoId}/atribuir-responsavel/{membroId}` | — | 200 + ContatoTci | 400 `{ mensagemErro }` |

---

## Tipos no Web

- **Implementação:** `src/api/types.ts` (Membro, ContatoTci, requests, enums).
- **Cliente:** `src/api/client.ts` (getMembros, getMembro, createMembro, updateMembro, getContatosTci, getContatoTci, createContatoTci, updateContatoTci, atribuirResponsavel).

As propriedades no JSON são **PascalCase** (Id, Nome, Whatsapp, Bairro, PerfilServico, LimiteAcolhimento, UserId para Membro; Id, Nome, Whatsapp, StatusVida, ResponsavelId para ContatoTci).
