# Mapeamento das Telas Exportadas do Stitch

**Projeto:** central_acolhimento_web  
**Origem:** Export HTML das telas desenhadas no Stitch  
**Objetivo:** Mapear cada tela para rota, página e componentes no app React + Vite.

---

## Resumo

| # | Nome no Stitch | Rota no App | Descrição |
|---|----------------|-------------|-----------|
| 1 | Login - Sistema de Acolhimento | `/login` | Tela de entrada (email/senha, "Esqueci minha senha", "Lembrar de mim") |
| 2 | Torre de Controle - Coordenação | `/` ou `/dashboard` | Dashboard principal: KPIs, Kanban Jornada Espiritual, Gestão de Capacidade |
| 3 | Gestão de Cuidadores | `/cuidadores` | Lista/grid de cuidadores com status (Livre/Atenção/Crítico), filtros, detalhe em overlay |
| 4 | Relatórios de Acolhimento | `/relatorios` | Relatórios de gestão: filtros, KPIs, gráficos, tabela por liderança |
| 5 | Configurações do Sistema | `/configuracoes` | Perfil, preferências (tema, notificações), Integração WhatsApp, Gestão de Equipe |
| 6 | **Dashboard Meu Serviço** (mobile) | `/meu-servico` | App irmão/cuidador: ações rápidas, Meus Cuidados, Próxima Oração, Últimas Mensagens |
| 7 | **Mapa de Acolhimento** (mobile) | `/mapa` | Kanban horizontal: Novo TCI, Em Visita, Em Consolidação, Casa de Deus; FAB + bottom nav |
| 8 | **Metabolismo da Alma** (mobile) | `/metabolismo` | Check-in de visita: Diário de Jornada, Estado Espiritual, Notificar Central, envio |

---

## 1. Login - Sistema de Acolhimento

- **Arquivo origem:** `telas/login_-_sistema_de_acolhimento/code.html`
- **Rota:** `/login`
- **Componente página:** `LoginPage`
- **Elementos principais:**
  - Logo + título "Torre de Controle" / "Sistema de Acolhimento"
  - Form: E-mail, Senha (com botão mostrar/ocultar), "Esqueci minha senha", "Lembrar de mim"
  - Botão "Entrar no Sistema"
  - Footer: "A serviço do Reino em Sapé", links Suporte / Privacidade / Termos
- **Design:** Fundo mesh (radial gradient), card central, `primary: #2463eb`, Inter, Material Symbols

---

## 2. Torre de Controle - Coordenação (Dashboard)

- **Arquivo origem:** `telas/torre_de_controle_-_coordenação/code.html`
- **Rota:** `/` ou `/dashboard`
- **Componente página:** `DashboardPage` (Torre de Controle)
- **Elementos principais:**
  - **Header:** Logo "Torre de Controle", nav (Dashboard, Relatórios, Cuidadores, Configurações), busca "Buscar convidado...", notificações, avatar
  - **KPIs:** Taxa de Retenção TCI (87.4%), Casas Ativas (92%), Alerta de Inatividade (14)
  - **Kanban "Jornada Espiritual":** Colunas Novo Contato, Primeira Visita, Em Acompanhamento, Integrado; cards de convidados; botão "Novo Convidado"
  - **Sidebar:** Gestão de Capacidade (lista de cuidadores com carga: 0-1, 2-3, 4+), barra "Capacidade Total", botão "Balancear Cargas"
  - **Footer:** Servidor Online, última sincronização, Manual / Termos / Suporte
- **Design:** `success`, `warning`, `danger` além de `primary`; scroll horizontal no Kanban; custom-scrollbar

---

## 3. Gestão de Cuidadores

- **Arquivo origem:** `telas/gestão_de_cuidadores/code.html`
- **Rota:** `/cuidadores`
- **Componente página:** `CuidadoresPage`
- **Elementos principais:**
  - **Sidebar:** Brand "CareAssist" (no mapeamento unificado usamos "Torre de Controle"), itens Dashboard, Cuidadores (ativo), Visitas, Relatórios, Configurações; perfil do usuário no rodapé
  - **Header da área:** Título "Gestão de Cuidadores", busca "Pesquisar cuidador...", botão "Adicionar Novo Cuidador"
  - **Filtros:** Todos / Disponíveis / Em Alerta; legenda Livre (verde) / Atenção (âmbar) / Crítico (rosa)
  - **Grid de cards:** Cada card = foto, nome, função, "Visitas Ativas", "Última Atividade", barra de status (emerald/amber/rose); card placeholder "Novo Cuidador"
  - **Overlay (drawer):** Painel lateral com detalhes do cuidador (perfil, contato, escala de atividade, histórico), ações Editar Perfil / Excluir
- **Design:** `background-light: #f6f6f8`; ícones Material Symbols com variante `filled` para item ativo

---

## 4. Relatórios de Acolhimento

- **Arquivo origem:** `telas/relatórios_de_acolhimento/code.html`
- **Rota:** `/relatorios`
- **Componente página:** `RelatoriosPage`
- **Elementos principais:**
  - **Sidebar:** "Torre de Controle - Coordenação Geral"; nav Dashboard, Acolhimento, Relatórios (ativo), Líderes; seção Administração → Configurações; botão "Novo Relatório"
  - **Header:** Busca "Pesquisar relatórios...", notificações, chat, perfil (Coord. Silva, Nível Master)
  - **Conteúdo:** Título "Relatórios de Gestão", botões Exportar PDF / Compartilhar
  - **Filtros globais:** Período (Este Mês / Últimos 3 Meses / Ano), Setor, Tipo (Acolhimento / Visita / Telefone), Status (Consolidação / Novo / Discipulado)
  - **KPIs:** Total Acolhidos (1,284), Taxa de Retenção (74.2%), Visitas Realizadas (456), Novas Decisões (89)
  - **Gráficos:** "Retenção ao Longo do Tempo" (barras), "Crescimento: Metabolismo da Alma" (barras de progresso por fase)
  - **Tabela:** "Resumo por Liderança e Transições" (Líder, Total Visitas, Conversões, Status Anterior/Atual, Ações)
  - **Footer:** Insight da IA Torre + "Ver Plano Detalhado"
- **Design:** `.active-nav` para item Relatórios; mesma paleta primary/background

---

## 5. Configurações do Sistema

- **Arquivo origem:** `telas/configurações_do_sistema/code.html`
- **Rota:** `/configuracoes`
- **Componente página:** `ConfiguracoesPage`
- **Elementos principais:**
  - **Sidebar:** "AdminPanel" (no app unificado: Torre de Controle / Configurações); itens Perfil (ativo), Preferências, Integrações, Usuários, Dados & PWA; card do usuário (Carlos Eduardo, Coordenador)
  - **Header:** "Configurações / Perfil & Sistema", notificações, botão "Salvar Alterações"
  - **Seção Perfil:** Foto, Nome, E-mail, Cargo (readonly), "Alterar Senha" → "Resetar Senha"
  - **Seção Aparência:** Modo Escuro (toggle), Notificações Push (toggle)
  - **Seção Dados & Offline:** Sincronização Offline PWA (toggle), "Exportar Relatório Mensal"
  - **Seção Integração WhatsApp:** Status "Conectado", Endpoint URL, Instância, API Key; botões "Testar Conexão", "Re-autenticar Instância"
  - **Seção Gestão de Equipe:** Tabela Usuário / Função / Permissões / Ações; "Novo Usuário"
  - **Rodapé da página:** Cancelar, "Salvar Todas as Configurações"
- **Design:** `.sidebar-item-active` (borda direita primary); mesmos tokens de cor

---

## 6. Dashboard Meu Serviço (mobile-first)

- **Arquivo origem:** `telas/dashboard_meu_serviço/code.html`
- **Rota:** `/meu-servico` (e sub-rotas: `/meu-servico/acolhidos`, `/meu-servico/oracoes`, `/meu-servico/perfil` para a mesma página até haver telas específicas)
- **Componente página:** `DashboardMeuServicoPage`
- **Layout:** `MobileLayout` com bottom nav (Início, Acolhidos, Orações, Perfil); container `max-w-md mx-auto`.
- **Elementos principais:**
  - **Header:** Avatar, "Bom dia, Tiago", status "WhatsApp Conectado" (indicador verde), botão notificações
  - **Ações rápidas:** 2 botões — "Registrar Visita" (primary, link para `/metabolismo`), "Novos Convidados"
  - **Meus Cuidados:** Texto "3 pessoas sob sua responsabilidade...", avatares empilhados + placeholder "add", link "Ver todos"
  - **Próxima Oração:** Card com horário (15:30), badge "Hoje", "Sala de Oração - Ala Sul"
  - **Últimas Mensagens:** Lista com nome, preview e hora (ex.: Maria Silva, "Obrigado pelo acolhimento...", 14:05)
- **Design:** `border-subtle`, ícone `filled` para "Início" ativo; `min-height: 100dvh`; bottom nav fixa com backdrop-blur

---

## 7. Mapa de Acolhimento (mobile-first)

- **Arquivo origem:** `telas/mapa_de_acolhimento/code.html`
- **Rota:** `/mapa` (e sub-rotas: `/mapa/equipe`, `/mapa/mapa-view`, `/mapa/dados`, `/mapa/ajustes` para a mesma página até haver telas específicas)
- **Componente página:** `MapaAcolhimentoPage`
- **Layout:** `MobileLayout` com bottom nav (Board, Equipe, Mapa, Dados, Ajustes) e FAB "add" (link para `/metabolismo`).
- **Elementos principais:**
  - **Header:** Menu, título "Mapa de Acolhimento", busca e filtro (ícones)
  - **Kanban horizontal:** Colunas fixas 280px — "Novo TCI" (badge 12), "Em Visita" (8), "Em Consolidação" (5, área vazia "Mova um cartão..."), "Casa de Deus" (20)
  - **Cards:** Borda esquerda por temperatura (Quente/Morno/Frio/Integrado), nome, nota, tempo, responsáveis ou tags; ícone drag ou check_circle
  - **FAB:** Botão circular fixo "add" (bottom-24 right-6)
- **Design:** Cores `temp-hot`, `temp-warm`, `temp-cold`, `success`; scroll horizontal sem barra (`.no-scrollbar`); `100dvh`; bottom nav fixa

---

## 8. Metabolismo da Alma (mobile-first)

- **Arquivo origem:** `telas/metabolismo_da_alma/code.html`
- **Rota:** `/metabolismo`
- **Componente página:** `MetabolismoAlmaPage`
- **Layout:** Sem bottom nav; header com voltar (link para `/meu-servico`), título e subtítulo "Relatório de Visita • Gabriel Santos"; footer fixo com botão "Finalizar e Enviar".
- **Elementos principais:**
  - **Diário de Jornada:** Textarea grande, placeholder reflexivo, badge "Modo Reflexivo Ativo"
  - **Estado Espiritual:** 3 opções em grid (radio) — Novo (🌱 Sementes), Raízes (🌿 Crescendo), Firme (🌳 Frutos); seleção com borda primary e bg primary/5
  - **Notificar Central:** Toggle com ícone hub e texto "Envio automático para supervisão"
  - **Footer:** Botão "Finalizar e Enviar" + texto "A jornada continua"
  - **Overlay de sucesso:** Drawer com check_circle, "Relatório Enviado", "Obrigado por nutrir...", botão "Fechar" (fecha e redireciona para `/meu-servico`)
- **Design:** `max-w-md mx-auto`; sticky header e footer; overlay com `backdrop-blur` e animação do drawer

---

## Design System (extraído das telas)

- **Primary:** `#2463eb`
- **Success:** `#10b981` (Torre de Controle)
- **Warning:** `#f59e0b`
- **Danger:** `#ef4444`
- **Background light:** `#f8fafc` (login) / `#f6f6f8` (outras)
- **Background dark:** `#111621`
- **Border subtle:** `#e2e8f0` (mobile)
- **Temp (Mapa):** `temp-hot` #ef4444, `temp-warm` #f59e0b, `temp-cold` #3b82f6
- **Fonte:** Inter (Google Fonts)
- **Ícones:** Material Symbols Outlined (Google Fonts)
- **Border radius:** default 0.25rem, lg 0.5rem, xl 0.75rem, full 9999px
- **Dark mode:** `class` (Tailwind)

---

## Navegação unificada (proposta para o app)

Para manter uma única identidade ("Torre de Controle - Sistema de Acolhimento"):

- **Layout desktop (coordenação):** Sidebar "Torre de Controle" com Dashboard | Relatórios | Cuidadores | Configurações.
- **Layout mobile (irmão/cuidador):** Sem sidebar; container `max-w-md mx-auto`, bottom nav e opcional FAB. Rotas: `/meu-servico`, `/mapa`, `/metabolismo`; "Registrar Visita" e FAB levam a `/metabolismo`.
- **Login:** Sem sidebar; após login redirecionar para `/` (Dashboard) ou, no futuro, para `/meu-servico` conforme perfil.
- **Rotas protegidas:** Todas exceto `/login` exigem autenticação (a integrar com Supabase Auth conforme auth-design.md).

---

## Checklist de integração

- [x] Documento de mapeamento criado
- [x] Projeto React + Vite criado
- [x] Design system (Tailwind theme, Inter, Material Symbols) aplicado
- [x] Layout base (sidebar ou header) compartilhado
- [x] Páginas: Login, Dashboard, Cuidadores, Relatórios, Configurações
- [x] React Router com rotas públicas/privadas
- [x] Links e navegação entre telas funcionando
- [x] Telas mobile-first: Dashboard Meu Serviço (`/meu-servico`), Mapa de Acolhimento (`/mapa`), Metabolismo da Alma (`/metabolismo`)
