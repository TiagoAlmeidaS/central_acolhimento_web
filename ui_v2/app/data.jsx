// app/data.jsx — multi-tenant data for Central de Acolhimento

// ─── TENANTS ──────────────────────────────────────────────────
// Each "localidade" (church locality) is a closed tenant. Data is scoped
// per tenant. A líder may operate over a network of tenants from the
// same region; a cuidador sees only their own tenant.
const TENANTS = [
  {
    id: 'manaus-adrianopolis',
    nome: 'Adrianópolis',
    cidade: 'Manaus, AM',
    sigla: 'AD',
    membros: 1240,
    cuidadores: 18,
    cor: '#2D7FF9',
  },
  {
    id: 'sp-vila-mariana',
    nome: 'Vila Mariana',
    cidade: 'São Paulo, SP',
    sigla: 'VM',
    membros: 2340,
    cuidadores: 32,
    cor: '#10B981',
  },
  {
    id: 'fortaleza-aldeota',
    nome: 'Aldeota',
    cidade: 'Fortaleza, CE',
    sigla: 'AL',
    membros: 890,
    cuidadores: 14,
    cor: '#F59E0B',
  },
];

// ─── STATUSES (matching references: pastel bg + saturated fg) ────
const STATUS = {
  urgente: { key: 'urgente', label: 'Urgente',
             fg: '#E11D48', bg: '#FFE4E6', dot: '#E11D48' },
  aguardando: { key: 'aguardando', label: 'Aguardando',
                fg: '#C2410C', bg: '#FFEDD5', dot: '#EA580C' },
  acompanhamento: { key: 'acompanhamento', label: 'Em Acompanhamento',
                    shortLabel: 'Acompanhando',
                    fg: '#1D4ED8', bg: '#DBEAFE', dot: '#2563EB' },
  concluido: { key: 'concluido', label: 'Concluído',
               fg: '#15803D', bg: '#DCFCE7', dot: '#16A34A' },
};
const STATUS_ORDER = ['urgente', 'aguardando', 'acompanhamento', 'concluido'];

// ─── ASSISTIDOS (per tenant) ─────────────────────────────────────
// Pravatar produces real-ish portrait images keyed by id.
const photo = (id) => `https://i.pravatar.cc/240?img=${id}`;

const ASSISTIDOS = [
  // tenant: manaus-adrianopolis (USER's tenant)
  { id: 'carlos', tenant: 'manaus-adrianopolis',
    nome: 'Carlos Silva', cidade: 'Manaus, AM',
    telefone: '+55 92 99812 4477', foto: photo(15),
    status: 'urgente', ultimoContato: 'há 2 horas atrás',
    ultimoContatoData: '2026-05-24',
    cuidador: 'Você',
    resumo: 'Pediu visita ainda hoje. Sinais de crise emocional após perda recente.',
    timeline: [
      { id: 1, kind: 'ai', autor: 'Agente IA', tempo: 'há 2h',
        texto: 'Mensagem recebida no WhatsApp com palavras de risco. Marcada como Urgente automaticamente.' },
      { id: 2, kind: 'nota', autor: 'Você', tempo: 'há 1h',
        texto: 'Liguei e conversei por ~15 min. Combinei visita presencial hoje às 19h.' },
      { id: 3, kind: 'sistema', autor: 'Sistema', tempo: 'há 40min',
        texto: 'Reunião criada: "Visita Carlos · hoje 19h" — link enviado.' },
    ] },

  { id: 'ana', tenant: 'manaus-adrianopolis',
    nome: 'Ana Soares', cidade: 'Manaus, AM',
    telefone: '+55 92 99432 1108', foto: photo(45),
    status: 'acompanhamento', ultimoContato: '15/10/2026',
    ultimoContatoData: '2026-05-22',
    cuidador: 'Você',
    resumo: 'Em processo de reintegração após período afastada. Conversas semanais combinadas.',
    timeline: [
      { id: 1, kind: 'nota', autor: 'Você', tempo: 'há 1 sem',
        texto: 'Primeiro encontro presencial. Ana abriu sobre dificuldades com o trabalho.' },
      { id: 2, kind: 'nota', autor: 'Você', tempo: 'há 3 dias',
        texto: 'Ligação rápida. Ana participou do culto de domingo.' },
    ] },

  { id: 'roberto', tenant: 'manaus-adrianopolis',
    nome: 'Roberto Mendes', cidade: 'Manaus, AM',
    telefone: '+55 92 99554 6601', foto: null, // shows initials
    status: 'aguardando', ultimoContato: '20/10/2026',
    ultimoContatoData: '2026-05-20',
    cuidador: null,
    resumo: 'Indicação de outro irmão. Aguardando vinculação com cuidador disponível.',
    timeline: [
      { id: 1, kind: 'ai', autor: 'Agente IA', tempo: 'há 4 dias',
        texto: 'Cadastro automático via formulário. Status definido como Aguardando.' },
    ] },

  { id: 'julia', tenant: 'manaus-adrianopolis',
    nome: 'Julia Pereira', cidade: 'Manaus, AM',
    telefone: '+55 92 99102 3344', foto: photo(48),
    status: 'concluido', ultimoContato: '05/09/2026',
    ultimoContatoData: '2026-05-12',
    cuidador: 'Você',
    resumo: 'Ciclo de acolhimento concluído com sucesso. Integrada à célula da quarta.',
    timeline: [
      { id: 1, kind: 'sistema', autor: 'Sistema', tempo: 'há 12 dias',
        texto: 'Ciclo marcado como concluído.' },
    ] },

  { id: 'lucia', tenant: 'manaus-adrianopolis',
    nome: 'Lúcia Helena', cidade: 'Manaus, AM',
    telefone: '+55 92 98321 4456', foto: photo(47),
    status: 'aguardando', ultimoContato: 'há 3 dias',
    ultimoContatoData: '2026-05-21',
    cuidador: null,
    resumo: 'Solicitou conversa após o batismo. Aguardando alguém disponível.',
    timeline: [
      { id: 1, kind: 'ai', autor: 'Agente IA', tempo: 'há 3 dias',
        texto: 'Cadastro via formulário do site.' },
    ] },

  { id: 'pedro', tenant: 'manaus-adrianopolis',
    nome: 'Pedro Henrique', cidade: 'Manaus, AM',
    telefone: '+55 92 99672 8890', foto: photo(33),
    status: 'acompanhamento', ultimoContato: 'ontem',
    ultimoContatoData: '2026-05-23',
    cuidador: 'Irmã Marta',
    resumo: 'Acompanhamento financeiro e espiritual.',
    timeline: [
      { id: 1, kind: 'nota', autor: 'Irmã Marta', tempo: 'ontem',
        texto: 'Indiquei vaga na rede de empregos. Entrevista marcada para quinta.' },
    ] },
];

// ─── AGENDA — upcoming meetings ──────────────────────────────────
const AGENDA = [
  {
    id: 'm1', tenant: 'manaus-adrianopolis',
    titulo: 'Visita · Carlos Silva',
    assistido: 'carlos',
    quando: 'Hoje · 19:00', data: 'today',
    duracao: '1h', tipo: 'presencial', local: 'Casa do Carlos',
    urgente: true,
  },
  {
    id: 'm2', tenant: 'manaus-adrianopolis',
    titulo: 'Acolhida semanal · Ana Soares',
    assistido: 'ana',
    quando: 'Amanhã · 14:30', data: 'tomorrow',
    duracao: '45min', tipo: 'online', local: 'Google Meet',
  },
  {
    id: 'm3', tenant: 'manaus-adrianopolis',
    titulo: 'Conversa inicial · Pedro Henrique',
    assistido: 'pedro',
    quando: 'Quinta · 20:00', data: 'thu',
    duracao: '1h', tipo: 'presencial', local: 'Igreja',
  },
  {
    id: 'm4', tenant: 'manaus-adrianopolis',
    titulo: 'Reunião de cuidadores',
    assistido: null,
    quando: 'Sábado · 09:00', data: 'sat',
    duracao: '2h', tipo: 'presencial', local: 'Igreja · sala 3',
  },
];

// ─── CUIDADORES ATIVOS (por tenant) ──────────────────────────────
const CUIDADORES_ATIVOS = [
  { id: 'c-daniel', tenant: 'manaus-adrianopolis',
    nome: 'Daniel Bemol', telefone: '+55 92 99988 7766',
    foto: photo(68), papel: 'Líder', online: true,
    casos: 4, desde: 'jan/2024' },
  { id: 'c-marta', tenant: 'manaus-adrianopolis',
    nome: 'Irmã Marta Souza', telefone: '+55 92 99432 8800',
    foto: photo(20), papel: 'Cuidador', online: true,
    casos: 3, desde: 'mar/2024' },
  { id: 'c-andre', tenant: 'manaus-adrianopolis',
    nome: 'André Costa', telefone: '+55 92 99811 2244',
    foto: photo(60), papel: 'Cuidador', online: false,
    casos: 2, desde: 'jul/2024' },
  { id: 'c-rebeca', tenant: 'manaus-adrianopolis',
    nome: 'Rebeca Lima', telefone: '+55 92 99765 4400',
    foto: photo(36), papel: 'Cuidador', online: true,
    casos: 1, desde: 'set/2024' },
];

// ─── APROVAÇÕES PENDENTES (líder view) ──────────────────────────
const APROVACOES_PENDENTES = [
  { id: 'p1', nome: 'Cláudia Ferreira', cidade: 'Manaus, AM',
    igreja: 'Adrianópolis', bio: 'Atendo na recepção há 3 anos.', quando: 'há 2 dias' },
  { id: 'p2', nome: 'Tiago Mendes', cidade: 'Manaus, AM',
    igreja: 'Adrianópolis', bio: 'Já fui acolhido. Quero retribuir.', quando: 'há 5 dias' },
  { id: 'p3', nome: 'Beatriz Nunes', cidade: 'Manaus, AM',
    igreja: 'Adrianópolis', bio: 'Psicóloga, disponível 2 noites por semana.', quando: 'há 1 semana' },
];

// ─── USUÁRIO ATUAL ──────────────────────────────────────────────
const USUARIO = {
  nome: 'Daniel Bemol',
  primeiroNome: 'Daniel',
  telefone: '+55 92 99988 7766',
  foto: photo(68),
  papel: 'Cuidador',
  tenantId: 'manaus-adrianopolis',
  online: true,
};

// ─── KPIs (visão Cuidador / Líder) ──────────────────────────────
function getKPIs(role) {
  if (role === 'lider') {
    return {
      ativos: 24, urgentes: 2, aguardando: 7,
      concluidosMes: 11, tempoMedio: '3h 12min',
      cuidadores: 18, pendentes: APROVACOES_PENDENTES.length,
      funil: [
        { key: 'urgente', label: 'Urgente', value: 2 },
        { key: 'aguardando', label: 'Aguardando', value: 7 },
        { key: 'acompanhamento', label: 'Em acompanhamento', value: 15 },
        { key: 'concluido', label: 'Concluído (mês)', value: 11 },
      ],
    };
  }
  return {
    acolhidos: 12, ativos: 4, tempoMedio: '2h 48min',
    concluidos: 8, semanaAtual: 3,
    funil: [
      { key: 'urgente', label: 'Urgente', value: 1 },
      { key: 'aguardando', label: 'Aguardando', value: 2 },
      { key: 'acompanhamento', label: 'Em acompanhamento', value: 3 },
      { key: 'concluido', label: 'Concluído (mês)', value: 6 },
    ],
  };
}

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase();
}

function tenantById(id) {
  return TENANTS.find(t => t.id === id) || TENANTS[0];
}

// Brazilian UF list (subset shown in dropdown)
const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
             'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

Object.assign(window, {
  TENANTS, STATUS, STATUS_ORDER, ASSISTIDOS, AGENDA,
  CUIDADORES_ATIVOS, APROVACOES_PENDENTES, USUARIO, UFS,
  getKPIs, initials, tenantById,
});
