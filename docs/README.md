# Documentação - Central de Acolhimento (Web)

Este repositório contém a aplicação **central_acolhimento_web**: interface PWA (React + Vite) para coordenadores e irmãos, com dashboards e formulários de cadastro de convidados (TCI) e gestão da Rede de Cuidado.

## Índice

- [System Design Document (SSD)](architecture/system-design-document.md) — Visão geral do ecossistema, arquitetura, modelagem de dados, requisitos não funcionais e roadmap.
- [Design de Autenticação](architecture/auth-design.md) — Login (Google, Email/Senha), perfil (Nome, Localidade: Igreja e Estado) e mapeamento com .NET 9 e Supabase.
- [Mapeamento das Telas Stitch](telas-stitch-mapping.md) — Mapeamento das telas exportadas do Stitch para rotas e componentes do app React.
- [Contratos Web ↔ Backend](apis/contratos-web-backend.md) — Endpoints, request/response e enums para integração com o central_ms.
- [Scripts SQL Supabase](database/README.md) — Schema (profiles, membros, contatos_tci, interacoes_cuidado) e trigger de sincronização com Auth.
- [Integração Web ↔ MS e primeira release](deployment/integracao-e-primeira-release.md) — O que falta para integração, .gitignore e passo a passo do primeiro push.

## Estrutura futura (estilo Backstage)

Conforme novas funcionalidades e APIs forem implementadas, a documentação será organizada em:

- **components/** — Catálogo de componentes e módulos do front-end.
- **apis/** — Registro de contratos e endpoints consumidos pelo Web (em uso: contratos-web-backend.md).
- **adr/** — Architecture Decision Records (decisões de design e arquitetura).
