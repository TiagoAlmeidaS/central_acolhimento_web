/* Atalaia — demonstração navegável. Tudo roda no navegador, em memória; recarregar volta ao início.
 * Regras do Cortex aplicadas: uma ação primária por contexto, ler na página e escrever no drawer,
 * "precisa de alguém" primeiro, vazio que ensina o próximo passo, cor de estado com texto,
 * arrastar é atalho (o drawer sempre tem o botão equivalente). */
(function () {
  'use strict';

  const A = window.AtalaiaData;
  const DB = A.build();
  const TODAY = A.TODAY;
  const DAY = A.DAY;

  const SEED_STATUS = {
    new: 'Novo',
    contacted: 'Contatado',
    waiting_visit: 'Aguardando visita',
    in_progress: 'Em acompanhamento',
    consolidated: 'Consolidado',
    inactive: 'Inativo',
  };
  const MEMBER_STATUS = {
    new: 'Novo',
    in_progress: 'Em acompanhamento',
    consolidated: 'Consolidado',
    inactive: 'Inativo',
  };
  const TEMP = { cold: 'Frio', warm: 'Morno', hot: 'Quente' };
  const FTYPE = {
    visit: 'Visita',
    call: 'Ligação',
    message: 'Mensagem',
    prayer: 'Oração',
    other: 'Outro',
  };
  const OUT_STATUS = {
    draft: 'Rascunho',
    generated: 'Grupos montados',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
  };
  const BOARD = ['new', 'contacted', 'waiting_visit', 'in_progress', 'consolidated'];
  const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const S = {
    route: 'inicio',
    tenantId: 't-jp',
    role: 'coordinator',
    asCaregiverId: null,
    seedView: 'quadro',
    seedQ: '',
    seedChip: '',
    seedSource: '',
    seedInactive: false,
    memberQ: '',
    memberTemp: '',
    memberStatus: '',
    memberCare: '',
    memberLate: false,
    outingId: null,
    meetTab: 'freq',
    meetType: null,
    setTab: 'igreja',
    onb: {
      step: 0,
      church: '',
      city: 'João Pessoa',
      name: '',
      email: '',
      phone: '',
      channel: 'Equipe de acolhimento',
      approval: true,
      maxUses: '25',
    },
  };

  /* ---------- Utilidades ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const initials = (n) => {
    const w = String(n).split(' ').filter(Boolean);
    return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
  };
  const firstName = (n) => String(n).split(' ')[0];
  const shortName = (n) => {
    const w = String(n).split(' ');
    return w.length > 1 ? `${w[0]} ${w[w.length - 1]}` : n;
  };
  const sod = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const dayDiff = (d) => Math.round((sod(d) - sod(TODAY)) / DAY);
  const daysSince = (d) => -dayDiff(d);
  const fmtDay = (d) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  const fmtDate = (d) => new Date(d).toLocaleDateString('pt-BR');
  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtLong = (d) =>
    new Date(d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const rel = (d) => {
    const n = dayDiff(d);
    if (n === 0) return 'hoje';
    if (n === -1) return 'ontem';
    if (n === 1) return 'amanhã';
    return n < 0 ? `há ${-n} dias` : `em ${n} dias`;
  };
  const shortAgo = (d) => {
    const n = daysSince(d);
    return n <= 0 ? 'hoje' : `${n}d`;
  };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const toLocalInput = (d) => {
    const x = new Date(d);
    const p = (v) => String(v).padStart(2, '0');
    return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
  };
  const toDateInput = (d) => toLocalInput(d).slice(0, 10);
  const age = (birth) => {
    const b = new Date(birth);
    let a = TODAY.getFullYear() - b.getFullYear();
    if (
      TODAY.getMonth() < b.getMonth() ||
      (TODAY.getMonth() === b.getMonth() && TODAY.getDate() < b.getDate())
    )
      a--;
    return a;
  };

  const ICONS = {
    painel: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z"/>',
    contatos:
      '<path d="M15 19c0-2.8-2.7-5-6-5s-6 2.2-6 5"/><circle cx="9" cy="8" r="3.5"/><path d="M19 8v6M16 11h6"/>',
    assistidos: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    saidas:
      '<path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2"/><circle cx="8" cy="13" r=".8"/><circle cx="16" cy="13" r=".8"/>',
    encontros: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    ajustes:
      '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    visit: '<path d="M4 11 12 4l8 7M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
    call: '<path d="M6 4h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2L20 15v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2z"/>',
    message: '<path d="M5 5h14v10H9l-4 4z"/>',
    prayer: '<path d="M12 3c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7zM7 21h10M9 21v-5h6v5"/>',
    other:
      '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    theme: '<path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  };
  const icon = (name, cls) =>
    `<svg ${cls ? `class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const MARK =
    '<svg viewBox="0 0 28 28" aria-hidden="true"><path class="mark-arch" d="M7.5 23.5V13a6.5 6.5 0 0 1 13 0v10.5M4 23.5h20"/><circle class="mark-lume" cx="14" cy="14.5" r="2.6"/></svg>';
  const brand = (href) =>
    `<a class="brand" href="${href || '#inicio'}">${MARK}<span>Atalaia</span></a>`;

  /* ---------- Dados por escopo ---------- */
  const tenant = () => DB.tenants.find((t) => t.id === S.tenantId);
  const settings = () => DB.settings[S.tenantId];
  const caregiverById = (id) => DB.caregivers.find((c) => c.id === id);
  const memberById = (id) => DB.members.find((m) => m.id === id);
  const seedById = (id) => DB.seeds.find((s) => s.id === id);
  const tCaregivers = () => DB.caregivers.filter((c) => c.tenantId === S.tenantId);
  const viewer = () => {
    if (S.role === 'caregiver') return caregiverById(S.asCaregiverId);
    return DB.users.find((u) => u.tenantId === S.tenantId && u.role === 'coordinator');
  };
  const mine = (x) => S.role !== 'caregiver' || x.caregiverId === S.asCaregiverId;
  const tSeeds = () => DB.seeds.filter((s) => s.tenantId === S.tenantId && mine(s));
  const tMembers = () => DB.members.filter((m) => m.tenantId === S.tenantId && mine(m));
  const followupsOf = (mid) =>
    DB.followups
      .filter((f) => f.memberId === mid)
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  const activeMembers = (cid) =>
    DB.members.filter((m) => m.caregiverId === cid && m.status !== 'inactive').length;
  const lastContact = (s) => s.lastContactAt || s.firstContactAt;

  function needs() {
    const set = settings();
    const out = [];
    for (const s of tSeeds()) {
      if (s.status === 'consolidated' || s.status === 'inactive') continue;
      const since = daysSince(lastContact(s));
      if (!s.caregiverId && s.isUrgent)
        out.push({
          sev: 3,
          kind: 'seed',
          id: s.id,
          name: s.referenceName,
          reason: 'Urgente e sem cuidador',
          action: 'Atribuir',
          days: since,
        });
      else if (!s.caregiverId && daysSince(s.firstContactAt) >= set.newWithoutCaregiverDays)
        out.push({
          sev: 2,
          kind: 'seed',
          id: s.id,
          name: s.referenceName,
          reason: `Sem cuidador há ${plural(daysSince(s.firstContactAt), 'dia', 'dias')}`,
          action: 'Atribuir',
          days: since,
        });
      else if (s.isUrgent && s.status !== 'in_progress')
        out.push({
          sev: 3,
          kind: 'seed',
          id: s.id,
          name: s.referenceName,
          reason: `Urgente · ${SEED_STATUS[s.status].toLowerCase()}`,
          action: 'Abrir',
          days: since,
        });
      else if (s.status !== 'in_progress' && since > set.staleDays)
        out.push({
          sev: 1,
          kind: 'seed',
          id: s.id,
          name: s.referenceName,
          reason: `Sem contato há ${since} dias`,
          action: 'Registrar contato',
          days: since,
        });
    }
    for (const m of tMembers()) {
      if (m.status === 'inactive' || !m.nextActionAt) continue;
      const late = -dayDiff(m.nextActionAt);
      if (late > 0)
        out.push({
          sev: late > 7 ? 2 : 1,
          kind: 'member',
          id: m.id,
          name: m.name,
          reason: `Próxima ação atrasada ${plural(late, 'dia', 'dias')}`,
          action: 'Registrar',
          days: late,
        });
    }
    // Primeiro o que uma pessoa resolve num clique (atribuir), depois gravidade e tempo.
    return out.sort(
      (a, b) =>
        b.sev - a.sev ||
        (a.action === 'Atribuir' ? -1 : 0) - (b.action === 'Atribuir' ? -1 : 0) ||
        b.days - a.days,
    );
  }

  /* ---------- Componentes ---------- */
  const pill = (cls, text) => `<span class="pill ${cls}">${esc(text)}</span>`;
  const seedPill = (s) => pill(`s-${s}`, SEED_STATUS[s]);
  const memberPill = (s) => pill(`s-${s}`, MEMBER_STATUS[s]);
  const tempPill = (t) => pill(`t-${t}`, TEMP[t]);
  const avatar = (c, cls) =>
    c
      ? `<span class="avatar ${cls || ''}" title="${esc(c.name)}" aria-hidden="true">${initials(c.name)}</span>`
      : `<span class="avatar none ${cls || ''}" title="Sem cuidador" aria-hidden="true">?</span>`;
  const empty = (title, text, btn) =>
    `<div class="empty"><h3>${esc(title)}</h3><p>${esc(text)}</p>${btn || ''}</div>`;
  const caregiverOptions = (sel, withNone) =>
    (withNone ? `<option value="">Sem cuidador</option>` : '') +
    tCaregivers()
      .filter((c) => c.active || c.id === sel)
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)} · ${activeMembers(c.id)} assistidos</option>`,
      )
      .join('');

  /* ---------- Landing (landing.js) ---------- */
  function landingCtx() {
    return {
      esc,
      icon,
      brand: brand(),
      sources: DB.sources,
      tenants: DB.tenants,
      network: DB.tenants
        .filter((t) => t.status === 'active')
        .map((t) => ({
          name: t.name,
          city: t.city,
          seeds: DB.seeds.filter((x) => x.tenantId === t.id).length,
          care: DB.caregivers.filter((x) => x.tenantId === t.id).length,
        })),
      mapStats() {
        const seeds = DB.seeds.filter((x) => x.tenantId === 't-jp' && x.status !== 'inactive');
        const members = DB.members.filter(
          (x) =>
            x.tenantId === 't-jp' &&
            x.status !== 'inactive' &&
            !seeds.some((sd) => sd.memberId === x.id),
        );
        return {
          city: 'João Pessoa',
          seeds: seeds.length,
          members: members.length,
          inProgress: members.filter((m) => m.status === 'in_progress' || m.status === 'new')
            .length,
          consolidated: members.filter((m) => m.status === 'consolidated').length,
          open: seeds.concat(members).filter((x) => x.openHouse).length,
          points: seeds
            .map((x) => ({
              lat: x.latitude,
              lng: x.longitude,
              kind: x.status,
              urgent: x.isUrgent,
              open: x.openHouse,
            }))
            .concat(
              members.map((x) => ({
                lat: x.latitude,
                lng: x.longitude,
                kind: x.status === 'consolidated' ? 'consolidated' : 'in_progress',
                urgent: false,
                open: x.openHouse,
              })),
            ),
        };
      },
      questions() {
        const keep = { tenantId: S.tenantId, role: S.role };
        Object.assign(S, { tenantId: 't-jp', role: 'coordinator' });
        const set = settings();
        const noCare = tSeeds().filter(
          (x) =>
            !x.caregiverId &&
            x.status !== 'inactive' &&
            daysSince(x.firstContactAt) >= set.newWithoutCaregiverDays,
        ).length;
        const late = tMembers().filter(
          (m) => m.status !== 'inactive' && m.nextActionAt && dayDiff(m.nextActionAt) < 0,
        ).length;
        const cultoId = (
          DB.meetingTypes.find((t) => t.tenantId === 't-jp' && t.kind === 'culto') || {}
        ).id;
        const occ = DB.occurrences
          .filter((o) => o.meetingTypeId === cultoId)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-3)
          .map((o) => o.id);
        const absent = DB.memberships.filter(
          (ms) =>
            ms.tenantId === 't-jp' &&
            occ.length &&
            occ.every(
              (id) =>
                !(
                  DB.attendance.find((x) => x.occurrenceId === id && x.memberId === ms.memberId) ||
                  {}
                ).present,
            ),
        ).length;
        const drivers = tCaregivers().filter((x) => x.active && x.hasCar).length;
        Object.assign(S, keep);
        return [
          {
            id: 'none',
            route: 'contatos',
            text: `Quem está sem cuidador há mais de ${set.newWithoutCaregiverDays} dias?`,
            count: noCare,
          },
          {
            id: 'late',
            route: 'assistidos',
            text: 'Quem passou da data da próxima visita?',
            count: late,
          },
          {
            id: 'absent',
            route: 'encontros',
            text: 'Quem faltou aos três últimos cultos de domingo?',
            count: absent,
          },
          {
            id: 'cars',
            route: 'saidas',
            text: 'Quantos cuidadores podem levar gente no sábado?',
            count: drivers,
          },
        ];
      },
      DB,
      TODAY,
      snapshot() {
        // Miniatura do painel com os dados reais da demonstração (igreja de João Pessoa, coordenação).
        const keep = { tenantId: S.tenantId, role: S.role };
        Object.assign(S, { tenantId: 't-jp', role: 'coordinator' });
        const seeds = tSeeds();
        const members = tMembers();
        const list = needs();
        const v = viewer();
        const out = {
          tenant: tenant().name,
          first: firstName(v.name),
          date: fmtLong(TODAY),
          needsCount: list.length,
          needs: list.slice(0, 5),
          kpis: [
            ['Novos · 7 dias', seeds.filter((x) => daysSince(x.firstContactAt) < 7).length],
            ['Precisam de alguém', list.length, true],
            [
              'Ações atrasadas',
              members.filter(
                (m) => m.status !== 'inactive' && m.nextActionAt && dayDiff(m.nextActionAt) < 0,
              ).length,
              true,
            ],
            ['Consolidados', members.filter((m) => m.status === 'consolidated').length],
          ],
          funnel: BOARD.map((st) => [SEED_STATUS[st], seeds.filter((x) => x.status === st).length]),
        };
        Object.assign(S, keep);
        return out;
      },
    };
  }
  const landing = () => window.AtalaiaLanding.html(landingCtx());

  // Linha de cadastro da landing: cria o contato de verdade e abre o quadro.
  function landingRegister(form) {
    const f = new FormData(form);
    const parts = String(f.get('who') || '')
      .split(/[·|,]/)
      .map((x) => x.trim())
      .filter(Boolean);
    const err = form.parentElement.querySelector('.l-cmd-err');
    const name = parts.find((x) => !/\d/.test(x)) || '';
    const phone = parts.find((x) => x.replace(/\D/g, '').length >= 10) || '';
    if (!name || !phone) {
      if (err)
        err.textContent =
          'Escreva nome, telefone com DDD e bairro, separados por ponto: Maria Silva · (83) 99999-0000 · Torre';
      return;
    }
    const hoodName = parts.filter((x) => x !== name && x !== phone)[0] || '';
    Object.assign(S, { tenantId: 't-jp', role: 'coordinator', seedView: 'quadro', seedChip: '' });
    const hood = hoodsOf(tenant().city).find(
      (h) => h.name.toLowerCase() === hoodName.toLowerCase(),
    );
    DB.seeds.push({
      id: DB.nextId('s'),
      tenantId: 't-jp',
      referenceName: name,
      age: null,
      phone,
      city: tenant().city,
      state: 'PB',
      neighborhood: hood ? hood.name : hoodName || 'Centro',
      street: hood ? hood.street : '',
      addressNumber: 's/n',
      postalCode: hood ? hood.cep : '58000-000',
      latitude: (hood ? hood.lat : -7.12) + (Math.random() - 0.5) * 0.004,
      longitude: (hood ? hood.lng : -34.86) + (Math.random() - 0.5) * 0.004,
      openHouse: false,
      source: String(f.get('source')),
      status: 'new',
      isUrgent: false,
      firstContactAt: TODAY.toISOString(),
      lastContactAt: null,
      notes: 'Cadastrado pela linha da página inicial.',
      caregiverId: null,
      memberId: null,
    });
    location.hash = 'contatos';
    toast(`${firstName(name)} entrou em Novos. Atribua um cuidador.`);
  }

  /* ---------- Onboarding ---------- */
  function onboarding() {
    const o = S.onb;
    const steps = ['Igreja', 'Coordenação', 'Equipe'];
    let form = '';
    if (o.step === 0)
      form = `<h1>Qual igreja vai usar a central?</h1>
        <label class="field" for="onb-church"><span>Nome da igreja</span><input class="input" id="onb-church" data-onb="church" value="${esc(o.church)}" placeholder="Igreja Central Sousa" required autocomplete="organization"/></label>
        <div class="row2">
          <label class="field" for="onb-city"><span>Cidade</span><select class="select" id="onb-city" data-onb="city">${DB.cities.map((c) => `<option ${c === o.city ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="field" for="onb-uf"><span>Estado</span><input class="input" id="onb-uf" value="PB" readonly/></label>
        </div>
        <p class="muted">Você pode adicionar outras igrejas da rede depois, em Ajustes.</p>`;
    if (o.step === 1)
      form = `<h1>Quem coordena o acolhimento?</h1>
        <label class="field" for="onb-name"><span>Seu nome</span><input class="input" id="onb-name" data-onb="name" value="${esc(o.name)}" placeholder="Conceição Medeiros" required autocomplete="name"/></label>
        <div class="row2">
          <label class="field" for="onb-email"><span>E-mail</span><input class="input" id="onb-email" type="email" data-onb="email" value="${esc(o.email)}" placeholder="voce@igreja.org.br" required autocomplete="email"/></label>
          <label class="field" for="onb-phone"><span>WhatsApp</span><input class="input" id="onb-phone" inputmode="tel" data-onb="phone" value="${esc(o.phone)}" placeholder="(83) 99999-0000" autocomplete="tel"/></label>
        </div>
        <p class="muted">A coordenação vê todos os contatos da igreja e gerencia os cuidadores.</p>`;
    if (o.step === 2)
      form = `<h1>Convide a equipe de cuidadores</h1>
        <p class="muted">Geramos um link de cadastro. Quem entrar por ele aparece em Ajustes, na Equipe.</p>
        <label class="field" for="onb-channel"><span>Nome do canal</span><input class="input" id="onb-channel" data-onb="channel" value="${esc(o.channel)}"/></label>
        <div class="row2">
          <label class="field" for="onb-max"><span>Limite de cadastros</span><input class="input" id="onb-max" type="number" min="1" inputmode="numeric" data-onb="maxUses" value="${esc(o.maxUses)}"/><small>Deixe vazio para não limitar.</small></label>
          <label class="check" style="align-self:center" for="onb-approval"><input type="checkbox" id="onb-approval" data-onb="approval" ${o.approval ? 'checked' : ''}/><span>Aprovar cada cadastro antes de liberar o acesso</span></label>
        </div>`;
    return `
<div class="onb">
  <aside class="onb-side">
    ${brand()}
    <ol>${steps.map((s, k) => `<li class="${k === o.step ? 'on' : ''} ${k < o.step ? 'done' : ''}"><b>${k < o.step ? '✓' : k + 1}</b><span>${s}</span></li>`).join('')}</ol>
    <p style="color:var(--night-muted);margin-top:auto">Leva uns dois minutos. Nada aqui é enviado: é uma demonstração.</p>
  </aside>
  <main class="onb-main" id="main">
    <form class="onb-form" data-form="onb" novalidate>
      ${form}
      <p class="err" id="onb-err" role="alert"></p>
      <div class="onb-actions">
        ${o.step === 0 ? '<a class="btn ghost" href="#inicio">Voltar ao site</a>' : '<button type="button" class="btn ghost" data-action="onb-back">Voltar</button>'}
        <button class="btn primary" type="submit">${o.step === 2 ? 'Criar a central' : 'Continuar'}</button>
      </div>
    </form>
  </main>
</div>`;
  }

  function onbSubmit() {
    const o = S.onb;
    const err = $('#onb-err');
    if (o.step === 0 && !o.church.trim())
      return (err.textContent = 'Informe o nome da igreja para continuar.');
    if (o.step === 1 && !o.name.trim())
      return (err.textContent = 'Informe seu nome para continuar.');
    if (o.step === 1 && !/^\S+@\S+\.\S+$/.test(o.email))
      return (err.textContent = 'Informe um e-mail válido, como voce@igreja.org.br.');
    if (o.step < 2) {
      o.step++;
      return render();
    }
    const id = DB.nextId('t');
    DB.tenants.push({
      id,
      name: o.church.trim(),
      short: o.church.trim().replace(/^Igreja\s+/i, ''),
      city: o.city,
      state: 'PB',
      status: 'active',
      domain: '',
      createdAt: toDateInput(TODAY),
      size: [0, 0, 0],
    });
    DB.users.push({
      id: DB.nextId('u'),
      tenantId: id,
      name: o.name.trim(),
      role: 'coordinator',
      email: o.email,
    });
    DB.settings[id] = {
      staleDays: 7,
      newWithoutCaregiverDays: 2,
      capacity: 6,
      urgentFirst: true,
      sources: DB.sources.slice(),
      notifyDaily: true,
      notifyUrgent: true,
    };
    DB.signupChannels.push({
      id: DB.nextId('sc'),
      tenantId: id,
      name: o.channel || 'Equipe de acolhimento',
      code: `${id}-${Math.floor(TODAY / 1e7) % 1000}`,
      maxUses: o.maxUses ? +o.maxUses : null,
      uses: 0,
      requireApproval: o.approval,
      allowedEmailDomain: '',
      expiresAt: '',
      active: true,
    });
    S.tenantId = id;
    S.role = 'coordinator';
    S.onb.step = 0;
    location.hash = 'painel';
    toast('Central criada. Comece pelo primeiro contato.');
  }

  /* ---------- Shell do app ---------- */
  function shell(content) {
    const n = needs().length;
    const v = viewer();
    const isCoord = S.role === 'coordinator';
    const items = [
      ['painel', 'Painel', n],
      ['contatos', 'Contatos'],
      ['assistidos', 'Assistidos'],
      ['saidas', 'Saídas'],
      ['encontros', 'Encontros'],
      ['ajustes', isCoord ? 'Ajustes' : 'Meu perfil'],
    ];
    const tenants = DB.tenants.filter((t) => t.status === 'active');
    return `
<div class="app">
  <aside class="side">
    ${brand()}
    <div class="tenant-select">
      <label for="tenant">Igreja</label>
      <select id="tenant" data-bind="tenant" ${isCoord ? '' : 'disabled'}>${tenants.map((t) => `<option value="${t.id}" ${t.id === S.tenantId ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
    </div>
    <nav class="nav" aria-label="Seções">
      ${items.map(([r, label, badge]) => `<a href="#${r}" ${S.route === r ? 'aria-current="page"' : ''}>${icon(r)}<span>${label}</span>${badge ? `<span class="badge" aria-label="${badge} precisam de alguém">${badge}</span>` : ''}</a>`).join('')}
    </nav>
    <div class="side-foot">
      <button class="btn ghost" data-action="theme" style="justify-content:flex-start">${icon('theme')}<span id="theme-label">${themeLabel()}</span></button>
      <div class="who">${avatar(v)}<div><b>${esc(v ? shortName(v.name) : '—')}</b><small>${isCoord ? 'Coordenação' : 'Cuidador'}</small></div></div>
    </div>
  </aside>
  <main class="main" id="main" tabindex="-1">
    <div class="demo-banner">
      <span>Demonstração com dados fictícios. Ver como</span>
      <div class="seg" role="group" aria-label="Ver como">
        <button data-action="role" data-role="coordinator" aria-pressed="${isCoord}">Coordenação</button>
        <button data-action="role" data-role="caregiver" aria-pressed="${!isCoord}">Cuidador</button>
      </div>
      ${
        !isCoord
          ? `<select class="select" style="width:auto;min-height:28px;padding:2px 6px" id="as-caregiver" data-bind="as-caregiver" aria-label="Cuidador">${tCaregivers()
              .filter((c) => c.active)
              .map(
                (c) =>
                  `<option value="${c.id}" ${c.id === S.asCaregiverId ? 'selected' : ''}>${esc(shortName(c.name))}</option>`,
              )
              .join('')}</select>`
          : ''
      }
    </div>
    ${content}
  </main>
</div>`;
  }

  /* ---------- Painel ---------- */
  function painel() {
    const t = tenant();
    const v = viewer();
    const seeds = tSeeds();
    const members = tMembers();
    const list = needs();
    const isCoord = S.role === 'coordinator';
    const newWeek = seeds.filter((s) => daysSince(s.firstContactAt) < 7).length;
    const weeks = Array.from(
      { length: 8 },
      (_, k) => seeds.filter((s) => Math.floor(daysSince(s.firstContactAt) / 7) === 7 - k).length,
    );
    const late = members.filter(
      (m) => m.status !== 'inactive' && m.nextActionAt && dayDiff(m.nextActionAt) < 0,
    ).length;
    const following = members.filter(
      (m) => m.status === 'in_progress' || m.status === 'new',
    ).length;
    const consolidated = members.filter((m) => m.status === 'consolidated').length;
    const urgent = list.filter((x) => x.sev === 3).length;
    const maxW = Math.max(1, ...weeks);
    const spark = `<svg viewBox="0 0 80 28" preserveAspectRatio="none" role="img" aria-label="Novos contatos por semana nas últimas 8 semanas: ${weeks.join(', ')}">${weeks.map((w, k) => `<rect x="${k * 10 + 1}" y="${28 - Math.max(2, (w / maxW) * 26)}" width="8" height="${Math.max(2, (w / maxW) * 26)}" rx="1.5" fill="${k === 7 ? 'var(--primary)' : 'var(--primary-soft)'}"/>`).join('')}</svg>`;

    const head = `<div class="page-head"><div><h1>Bom dia, ${esc(v ? firstName(v.name) : '')}</h1><p>${fmtLong(TODAY)} · ${esc(t.name)}</p></div><div class="actions"><button class="btn primary" data-action="new-seed">${icon('plus')}Novo contato</button></div></div>`;

    if (!seeds.length && !members.length && isCoord)
      return `${head}${empty('A central está pronta. Falta a primeira pessoa.', 'Cadastre quem chegou no último culto ou convide a equipe para cadastrar pela recepção.', `<div class="inline"><button class="btn primary" data-action="new-seed">${icon('plus')}Cadastrar o primeiro contato</button><a class="btn" href="#ajustes" data-action="set-tab" data-tab="canais">Convidar a equipe</a></div>`)}`;

    const kpis = `<div class="grid kpis">
      <div class="card kpi"><span class="label">Novos contatos · 7 dias</span><div class="value">${newWeek}<small>${seeds.length} na jornada</small></div>${spark}</div>
      <div class="card kpi ${list.length ? 'alert' : ''}"><span class="label">Precisam de alguém</span><div class="value">${list.length}<small>${plural(urgent, 'urgente', 'urgentes')}</small></div></div>
      <div class="card kpi ${late ? 'alert' : ''}"><span class="label">Ações atrasadas</span><div class="value">${late}<small>de ${following} em acompanhamento</small></div></div>
      <div class="card kpi"><span class="label">Consolidados</span><div class="value">${consolidated}<small>de ${members.length} assistidos</small></div></div>
    </div>`;

    const needsCard = `<section class="card" aria-labelledby="needs-h">
      <div class="card-head"><h2 id="needs-h">Precisa de alguém</h2><span class="muted" role="status">${list.length ? `${plural(list.length, 'pessoa espera', 'pessoas esperam')} uma ação` : 'Ninguém esperando'}</span></div>
      <div class="card-body" style="padding:8px 0 4px">
        ${
          list.length
            ? `<ul class="needs">${list
                .slice(0, 7)
                .map(
                  (x) =>
                    `<li><span class="sev ${x.sev === 3 ? 'high' : x.sev === 1 ? 'low' : ''}" aria-hidden="true"></span><div class="who-line"><b>${esc(x.name)}</b><small>${esc(x.reason)} · ${x.kind === 'seed' ? 'contato' : 'assistido'}</small></div><button class="btn sm" data-action="need" data-kind="${x.kind}" data-id="${x.id}" data-act="${esc(x.action)}">${esc(x.action)}</button></li>`,
                )
                .join('')}</ul>`
            : `<div style="padding:8px 16px 12px">${empty('Tudo em dia.', 'Ninguém urgente, sem cuidador ou com ação atrasada. Bom momento para planejar a próxima saída.', '<a class="btn" href="#saidas">Ver saídas</a>')}</div>`
        }
        ${list.length > 7 ? `<div style="padding:8px 16px"><a href="#contatos" data-action="seed-chip" data-chip="needs">Ver as ${list.length} no quadro</a></div>` : ''}
      </div>
    </section>`;

    const allSeeds = DB.seeds.filter((s) => s.tenantId === S.tenantId && mine(s));
    const counts = BOARD.map((st) => allSeeds.filter((s) => s.status === st).length);
    const maxC = Math.max(1, ...counts);
    const conv = allSeeds.length ? Math.round((counts[4] / allSeeds.length) * 100) : 0;
    const funnel = `<section class="card" aria-labelledby="fun-h"><div class="card-head"><h2 id="fun-h">Jornada dos contatos</h2><span class="muted">${conv}% já consolidados</span></div><div class="card-body"><div class="funnel">${BOARD.map((st, k) => `<a class="funnel-row" href="#contatos" style="color:inherit;text-decoration:none" data-action="seed-status-link"><span>${SEED_STATUS[st]}</span><span class="track"><span class="fill" style="display:block;width:${(counts[k] / maxC) * 100}%;--o:${1 - k * 0.12}"></span></span><span class="num">${counts[k]}</span></a>`).join('')}</div></div></section>`;

    const feedItems = DB.followups
      .filter(
        (f) =>
          f.tenantId === S.tenantId &&
          (S.role !== 'caregiver' || f.caregiverId === S.asCaregiverId),
      )
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
      .slice(0, 6);
    const feed = `<section class="card" aria-labelledby="feed-h"><div class="card-head"><h2 id="feed-h">Atividade recente</h2></div><div class="card-body">${
      feedItems.length
        ? `<ul class="feed">${feedItems
            .map((f) => {
              const m = memberById(f.memberId);
              const c = caregiverById(f.caregiverId);
              return `<li><span class="ficon">${icon(f.type)}</span><div><div class="meta"><b>${FTYPE[f.type]}</b><span>com <button class="row-btn" data-action="open-member" data-id="${m.id}" style="color:var(--primary)">${esc(shortName(m.name))}</button></span><span class="muted">por ${esc(c ? shortName(c.name) : '—')}</span><time datetime="${f.occurredAt}">${rel(f.occurredAt)}</time></div><p>${esc(f.notes)}</p></div></li>`;
            })
            .join('')}</ul>`
        : empty(
            'Sem acompanhamentos ainda.',
            'Quando um cuidador registrar uma visita ou ligação, ela aparece aqui.',
          )
    }</div></section>`;

    const set = settings();
    const loads = tCaregivers()
      .filter((c) => c.active)
      .map((c) => [c, activeMembers(c.id)])
      .sort((a, b) => b[1] - a[1]);
    const loadCard = isCoord
      ? `<section class="card" aria-labelledby="load-h"><div class="card-head"><h2 id="load-h">Carga dos cuidadores</h2><span class="muted">limite de ${set.capacity}</span></div><div class="card-body">${loads.length ? loads.map(([c, n]) => `<div class="load-row"><span class="name">${avatar(c)}<span>${esc(shortName(c.name))}</span></span><span class="meter ${n > set.capacity ? 'over' : n === set.capacity ? 'warn' : ''}" role="img" aria-label="${n} de ${set.capacity}"><b style="width:${Math.min(100, (n / set.capacity) * 100)}%"></b></span><span class="num" style="text-align:right">${n}/${set.capacity}</span></div>`).join('') : empty('Nenhum cuidador ainda.', 'Convide a equipe por um canal de cadastro.', '<a class="btn" href="#ajustes" data-action="set-tab" data-tab="canais">Criar canal</a>')}</div></section>`
      : `<section class="card" aria-labelledby="week-h"><div class="card-head"><h2 id="week-h">Minhas próximas ações</h2></div><div class="card-body">${(() => {
          const up = members
            .filter((m) => m.nextActionAt && m.status !== 'inactive')
            .sort((a, b) => new Date(a.nextActionAt) - new Date(b.nextActionAt))
            .slice(0, 6);
          return up.length
            ? `<ul class="feed">${up.map((m) => `<li><span class="ficon">${icon('call')}</span><div><div class="meta"><button class="row-btn" data-action="open-member" data-id="${m.id}"><b>${esc(shortName(m.name))}</b></button>${tempPill(m.spiritualTemperature)}<time class="${dayDiff(m.nextActionAt) < 0 ? 'late' : ''}" style="${dayDiff(m.nextActionAt) < 0 ? 'color:var(--danger)' : ''}">${rel(m.nextActionAt)}</time></div><p>${esc(m.neighborhood)} · ${esc(m.phone)}</p></div></li>`).join('')}</ul>`
            : empty('Nada agendado.', 'Registre um acompanhamento e marque a próxima ação.');
        })()}</div></section>`;

    const temps = ['cold', 'warm', 'hot'].map(
      (k) => members.filter((m) => m.spiritualTemperature === k && m.status !== 'inactive').length,
    );
    const tt = Math.max(1, temps[0] + temps[1] + temps[2]);
    const tempCard = `<section class="card" aria-labelledby="temp-h"><div class="card-head"><h2 id="temp-h">Temperatura espiritual</h2><span class="muted">assistidos ativos</span></div><div class="card-body"><div class="temp-bar" role="img" aria-label="Frio ${temps[0]}, morno ${temps[1]}, quente ${temps[2]}">${['cold', 'warm', 'hot'].map((k, i) => (temps[i] ? `<span style="width:${(temps[i] / tt) * 100}%;background:var(--${k})"></span>` : '')).join('')}</div><div class="temp-legend">${['cold', 'warm', 'hot'].map((k, i) => `<span><i style="background:var(--${k})"></i>${TEMP[k]} <b class="num">${temps[i]}</b></span>`).join('')}</div></div></section>`;

    const sessions = DB.tciSessions
      .filter(
        (x) =>
          x.tenantId === S.tenantId &&
          new Date(x.startsAt) >= TODAY &&
          (isCoord || x.caregiverIds.includes(S.asCaregiverId)),
      )
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 3);
    const nextOuting = DB.outings
      .filter((o) => o.tenantId === S.tenantId && new Date(o.scheduledFor) >= TODAY)
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))[0];
    const agenda = `<section class="card" aria-labelledby="ag-h"><div class="card-head"><h2 id="ag-h">Agenda</h2><a href="#encontros" class="muted">Encontros</a></div><div class="card-body"><ul class="feed">
      ${nextOuting ? `<li><span class="ficon">${icon('car')}</span><div><div class="meta"><a href="#saidas" data-action="open-outing" data-id="${nextOuting.id}"><b>${esc(nextOuting.name)}</b></a><time>${rel(nextOuting.scheduledFor)}</time></div><p>${fmtLong(nextOuting.scheduledFor)}, ${fmtTime(nextOuting.scheduledFor)} · ${OUT_STATUS[nextOuting.status]}</p></div></li>` : ''}
      ${sessions
        .map((x) => {
          const ch = DB.chambers.find((c) => c.id === x.chamberId);
          const m = memberById(x.memberId);
          return `<li><span class="ficon">${icon('encontros')}</span><div><div class="meta"><b>TCI · ${esc(ch.name)}</b><time>${rel(x.startsAt)}</time></div><p>${fmtTime(x.startsAt)} com ${esc(shortName(m.name))}</p></div></li>`;
        })
        .join('')}
      ${!nextOuting && !sessions.length ? `<li style="grid-template-columns:1fr">${empty('Agenda livre.', 'Nenhuma saída ou sessão TCI marcada.')}</li>` : ''}
    </ul></div></section>`;

    return `${head}${kpis}<div class="grid dash"><div class="stack">${needsCard}${funnel}${feed}</div><div class="stack">${loadCard}${tempCard}${agenda}</div></div>`;
  }

  /* ---------- Contatos ---------- */
  function filteredSeeds() {
    const q = S.seedQ.trim().toLowerCase();
    const needIds = new Set(
      needs()
        .filter((x) => x.kind === 'seed')
        .map((x) => x.id),
    );
    return tSeeds().filter((s) => {
      if (!S.seedInactive && s.status === 'inactive') return false;
      if (q && !`${s.referenceName} ${s.neighborhood} ${s.phone}`.toLowerCase().includes(q))
        return false;
      if (S.seedSource && s.source !== S.seedSource) return false;
      if (S.seedChip === 'needs' && !needIds.has(s.id)) return false;
      if (S.seedChip === 'urgent' && !s.isUrgent) return false;
      if (S.seedChip === 'open' && !s.openHouse) return false;
      if (S.seedChip === 'none' && s.caregiverId) return false;
      return true;
    });
  }

  function contatos() {
    const all = tSeeds().filter((s) => S.seedInactive || s.status !== 'inactive');
    const list = filteredSeeds();
    const needN = needs().filter((x) => x.kind === 'seed').length;
    const isCoord = S.role === 'coordinator';
    const chip = (id, label, n) =>
      `<button class="chip" data-action="seed-chip" data-chip="${id}" aria-pressed="${S.seedChip === id}">${label}<span class="count">${n}</span></button>`;
    const head = `<div class="page-head"><div><h1>Contatos</h1><p>Pessoas que chegaram e ainda estão na jornada de acolhimento.</p></div><div class="actions"><div class="seg" role="group" aria-label="Visualização">${['quadro', 'lista', 'mapa'].map((v) => `<button data-action="seed-view" data-view="${v}" aria-pressed="${S.seedView === v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div><button class="btn primary" data-action="new-seed">${icon('plus')}Novo contato</button></div></div>`;
    const toolbar = `<div class="toolbar">
      <label class="search" for="seed-q"><span class="sr">Buscar contatos</span>${icon('search')}<input class="input" id="seed-q" data-bind="seedQ" value="${esc(S.seedQ)}" placeholder="Buscar por nome, bairro ou telefone" autocomplete="off"/></label>
      ${chip('needs', 'Precisa de alguém', needN)}
      ${chip('urgent', 'Urgentes', all.filter((s) => s.isUrgent).length)}
      ${chip('open', 'Casa aberta', all.filter((s) => s.openHouse).length)}
      ${isCoord ? chip('none', 'Sem cuidador', all.filter((s) => !s.caregiverId).length) : ''}
      <label class="sr" for="seed-source">Origem</label>
      <select class="select" id="seed-source" style="width:auto" data-bind="seedSource"><option value="">Todas as origens</option>${settings()
        .sources.map((x) => `<option ${x === S.seedSource ? 'selected' : ''}>${esc(x)}</option>`)
        .join('')}</select>
      <label class="check" for="seed-inactive" style="align-items:center"><input type="checkbox" id="seed-inactive" data-bind="seedInactive" ${S.seedInactive ? 'checked' : ''}/><span>Inativos</span></label>
      <span class="spacer"></span>
      <span class="muted" role="status">${plural(list.length, 'contato', 'contatos')}</span>
    </div>`;
    if (!tSeeds().length)
      return (
        head +
        empty(
          isCoord ? 'Nenhum contato ainda.' : 'Ninguém atribuído a você ainda.',
          isCoord
            ? 'Cadastre quem chegou no culto. Leva menos de um minuto: nome, telefone e bairro.'
            : 'Quando a coordenação atribuir uma pessoa a você, ela aparece aqui.',
          isCoord
            ? `<button class="btn primary" data-action="new-seed">${icon('plus')}Cadastrar contato</button>`
            : '',
        )
      );
    let body = '';
    if (S.seedView === 'quadro') {
      const cols = BOARD.concat(S.seedInactive ? ['inactive'] : []);
      body = `<div class="board-scroll"><div class="board">${cols
        .map((st) => {
          const items = list.filter((s) => s.status === st);
          return `<section class="col" data-drop="${st}" aria-label="${SEED_STATUS[st]}"><div class="col-head">${SEED_STATUS[st]}<span class="num">${items.length}</span></div><div class="col-body">${
            items.length
              ? items
                  .sort(
                    (a, b) =>
                      b.isUrgent - a.isUrgent ||
                      new Date(lastContact(a)) - new Date(lastContact(b)),
                  )
                  .map(seedCard)
                  .join('')
              : `<div class="col-empty">${st === 'new' ? 'Ninguém novo. Cadastre pela recepção.' : 'Arraste um card para cá ou use Avançar no contato.'}</div>`
          }</div></section>`;
        })
        .join('')}</div></div>`;
    } else if (S.seedView === 'lista') {
      body = list.length
        ? `<div class="card table-wrap"><table><thead><tr><th>Nome</th><th>Situação</th><th>Bairro</th><th>Origem</th><th>Cuidador</th><th>Primeiro contato</th><th>Último contato</th></tr></thead><tbody>${list
            .map((s) => {
              const c = caregiverById(s.caregiverId);
              const since = daysSince(lastContact(s));
              return `<tr tabindex="0" data-action="open-seed" data-id="${s.id}"><td><span class="name">${esc(s.referenceName)}${s.isUrgent ? pill('urgent', 'Urgente') : ''}</span></td><td>${seedPill(s.status)}</td><td>${esc(s.neighborhood)}</td><td>${esc(s.source)}</td><td>${c ? esc(shortName(c.name)) : '<span class="muted">Sem cuidador</span>'}</td><td class="num">${fmtDay(s.firstContactAt)}</td><td class="num ${since > settings().staleDays && s.status !== 'consolidated' ? 'late' : ''}">${rel(lastContact(s))}</td></tr>`;
            })
            .join('')}</tbody></table></div>`
        : empty(
            'Nenhum contato com esses filtros.',
            'Limpe a busca ou escolha outro filtro.',
            '<button class="btn" data-action="seed-clear">Limpar filtros</button>',
          );
    } else {
      body = mapView(list);
    }
    return head + toolbar + body;
  }

  function seedCard(s) {
    const c = caregiverById(s.caregiverId);
    const since = daysSince(lastContact(s));
    const late =
      since > settings().staleDays &&
      !['consolidated', 'inactive', 'in_progress'].includes(s.status);
    return `<button class="tcard" draggable="true" data-drag="${s.id}" data-action="open-seed" data-id="${s.id}" aria-label="${esc(s.referenceName)}, ${SEED_STATUS[s.status]}${s.isUrgent ? ', urgente' : ''}">
      <span class="top"><b>${esc(s.referenceName)}</b>${s.isUrgent ? pill('urgent', 'Urgente') : ''}</span>
      <small>${s.age} anos · ${esc(s.neighborhood)}${s.openHouse ? ' · casa aberta' : ''}</small>
      <span class="bottom">${avatar(c)}<span>${c ? esc(firstName(c.name)) : 'Sem cuidador'}</span><span class="ago ${late ? 'late' : ''}" title="Último contato">${late ? 'sem contato ' : ''}${shortAgo(lastContact(s))}</span></span>
    </button>`;
  }

  function mapView(list) {
    const pts = DB.seeds
      .filter((s) => s.tenantId === S.tenantId)
      .concat(DB.members.filter((m) => m.tenantId === S.tenantId));
    if (!list.length)
      return empty(
        'Nenhum ponto para mostrar.',
        'Ajuste os filtros ou cadastre um contato com endereço.',
      );
    const lats = pts.map((p) => p.latitude);
    const lngs = pts.map((p) => p.longitude);
    const [la0, la1, lo0, lo1] = [
      Math.min(...lats),
      Math.max(...lats),
      Math.min(...lngs),
      Math.max(...lngs),
    ];
    const W = 800;
    const H = 460;
    const pad = 40;
    const sx = (lo) => pad + ((lo - lo0) / Math.max(1e-6, lo1 - lo0)) * (W - pad * 2);
    const sy = (la) => pad + ((la1 - la) / Math.max(1e-6, la1 - la0)) * (H - pad * 2);
    const hoods = {};
    for (const p of pts) (hoods[p.neighborhood] = hoods[p.neighborhood] || []).push(p);
    const color = {
      new: 'var(--primary)',
      contacted: 'var(--warning)',
      waiting_visit: 'var(--warning)',
      in_progress: 'var(--cold)',
      consolidated: 'var(--success)',
      inactive: 'var(--subtle)',
    };
    const grid =
      Array.from(
        { length: 9 },
        (_, k) => `<line class="grid-line" x1="${k * 100}" x2="${k * 100}" y1="0" y2="${H}"/>`,
      ).join('') +
      Array.from(
        { length: 5 },
        (_, k) =>
          `<line class="grid-line" y1="${k * 100 + 30}" y2="${k * 100 + 30}" x1="0" x2="${W}"/>`,
      ).join('');
    // Rótulo acima do círculo; se colidir com outro rótulo ou bairro, tenta abaixo, à direita e à esquerda.
    const centers = Object.entries(hoods).map(([name, ps]) => ({
      name,
      x: ps.reduce((s, p) => s + sx(p.longitude), 0) / ps.length,
      y: ps.reduce((s, p) => s + sy(p.latitude), 0) / ps.length,
    }));
    const placed = [];
    const rings = centers
      .slice()
      .sort((a, b) => a.y - b.y)
      .map(({ name, x, y }) => {
        const w = name.length * 7.5;
        const box = (cx, cy) => ({ x0: cx - w / 2, x1: cx + w / 2, y0: cy - 12, y1: cy + 2 });
        const free = (b) =>
          b.x0 > 2 &&
          b.x1 < W - 2 &&
          b.y0 > 2 &&
          b.y1 < H - 2 &&
          !placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) &&
          !centers.some(
            (c) =>
              c.name !== name &&
              Math.hypot(
                Math.max(b.x0, Math.min(c.x, b.x1)) - c.x,
                Math.max(b.y0, Math.min(c.y, b.y1)) - c.y,
              ) < 32,
          );
        const opts = [
          [x, y - 40],
          [x, y + 50],
          [x + 38 + w / 2, y + 5],
          [x - 38 - w / 2, y + 5],
        ];
        const [lx, ly] = opts.find(([cx, cy]) => free(box(cx, cy))) || opts[0];
        placed.push(box(lx, ly));
        return `<circle class="hood-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="32"/><text class="hood" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${esc(name)}</text>`;
      })
      .join('');
    const dots = list
      .map(
        (s) =>
          `<circle class="pt" tabindex="0" role="button" data-action="open-seed" data-id="${s.id}" cx="${sx(s.longitude).toFixed(1)}" cy="${sy(s.latitude).toFixed(1)}" r="${s.isUrgent ? 8 : 6}" fill="${color[s.status]}" ${s.isUrgent ? 'stroke="var(--danger)"' : ''} aria-label="${esc(s.referenceName)}, ${esc(s.neighborhood)}, ${SEED_STATUS[s.status]}"><title>${esc(s.referenceName)} · ${esc(s.neighborhood)}</title></circle>${s.openHouse ? `<circle cx="${sx(s.longitude).toFixed(1)}" cy="${sy(s.latitude).toFixed(1)}" r="${s.isUrgent ? 12 : 10}" fill="none" stroke="var(--lume)" stroke-width="1.5" pointer-events="none"/>` : ''}`,
      )
      .join('');
    return `<div class="map"><svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Mapa de contatos por bairro em ${esc(tenant().city)}">${grid}${rings}${dots}</svg>
      <div class="map-legend">${BOARD.map((st) => `<span><i style="background:${color[st]}"></i>${SEED_STATUS[st]}</span>`).join('')}<span><i style="background:transparent;border:1.5px solid var(--lume)"></i>Casa aberta</span><span><i style="background:transparent;border:2px solid var(--danger)"></i>Urgente</span><span style="margin-left:auto">Posições aproximadas por bairro</span></div></div>`;
  }

  /* ---------- Assistidos ---------- */
  function assistidos() {
    const isCoord = S.role === 'coordinator';
    const q = S.memberQ.trim().toLowerCase();
    const all = tMembers();
    const list = all
      .filter(
        (m) =>
          (!q || `${m.name} ${m.neighborhood}`.toLowerCase().includes(q)) &&
          (!S.memberTemp || m.spiritualTemperature === S.memberTemp) &&
          (!S.memberStatus || m.status === S.memberStatus) &&
          (!S.memberCare || m.caregiverId === S.memberCare) &&
          (!S.memberLate ||
            (m.nextActionAt && m.status !== 'inactive' && dayDiff(m.nextActionAt) < 0)),
      )
      .sort(
        (a, b) =>
          (a.nextActionAt ? new Date(a.nextActionAt) : Infinity) -
          (b.nextActionAt ? new Date(b.nextActionAt) : Infinity),
      );
    const lateN = all.filter(
      (m) => m.nextActionAt && m.status !== 'inactive' && dayDiff(m.nextActionAt) < 0,
    ).length;
    const head = `<div class="page-head"><div><h1>Assistidos</h1><p>Pessoas em acompanhamento pastoral contínuo.</p></div><div class="actions"><button class="btn primary" data-action="new-member">${icon('plus')}Novo assistido</button></div></div>`;
    if (!all.length)
      return (
        head +
        empty(
          isCoord ? 'Nenhum assistido ainda.' : 'Ninguém sob o seu cuidado ainda.',
          'Um contato em acompanhamento vira assistido pelo botão Converter, no próprio contato.',
          '<a class="btn" href="#contatos">Ir para contatos</a>',
        )
      );
    const toolbar = `<div class="toolbar">
      <label class="search" for="member-q"><span class="sr">Buscar assistidos</span>${icon('search')}<input class="input" id="member-q" data-bind="memberQ" value="${esc(S.memberQ)}" placeholder="Buscar por nome ou bairro" autocomplete="off"/></label>
      <div class="seg" role="group" aria-label="Temperatura">${[
        ['', 'Todas'],
        ['cold', 'Frio'],
        ['warm', 'Morno'],
        ['hot', 'Quente'],
      ]
        .map(
          ([v, l]) =>
            `<button data-action="member-temp" data-v="${v}" aria-pressed="${S.memberTemp === v}">${l}</button>`,
        )
        .join('')}</div>
      <label class="sr" for="member-status">Situação</label><select class="select" id="member-status" style="width:auto" data-bind="memberStatus"><option value="">Todas as situações</option>${Object.entries(
        MEMBER_STATUS,
      )
        .map(
          ([k, v]) =>
            `<option value="${k}" ${S.memberStatus === k ? 'selected' : ''}>${v}</option>`,
        )
        .join('')}</select>
      ${
        isCoord
          ? `<label class="sr" for="member-care">Cuidador</label><select class="select" id="member-care" style="width:auto" data-bind="memberCare"><option value="">Todos os cuidadores</option>${tCaregivers()
              .map(
                (c) =>
                  `<option value="${c.id}" ${S.memberCare === c.id ? 'selected' : ''}>${esc(shortName(c.name))}</option>`,
              )
              .join('')}</select>`
          : ''
      }
      <button class="chip" data-action="member-late" aria-pressed="${S.memberLate}">Ação atrasada<span class="count">${lateN}</span></button>
      <span class="spacer"></span><span class="muted" role="status">${plural(list.length, 'assistido', 'assistidos')}</span>
    </div>`;
    const table = list.length
      ? `<div class="card table-wrap"><table><thead><tr><th>Nome</th><th>Idade</th><th>Bairro</th><th>Temperatura</th><th>Situação</th>${isCoord ? '<th>Cuidador</th>' : ''}<th>Último acompanhamento</th><th>Próxima ação</th></tr></thead><tbody>${list
          .map((m) => {
            const c = caregiverById(m.caregiverId);
            const f = followupsOf(m.id)[0];
            const late = m.nextActionAt && m.status !== 'inactive' && dayDiff(m.nextActionAt) < 0;
            return `<tr tabindex="0" data-action="open-member" data-id="${m.id}"><td><span class="name">${avatar({ name: m.name })}${esc(m.name)}</span></td><td class="num">${age(m.birthDate)}</td><td>${esc(m.neighborhood)}</td><td>${tempPill(m.spiritualTemperature)}</td><td>${memberPill(m.status)}</td>${isCoord ? `<td>${c ? esc(shortName(c.name)) : '—'}</td>` : ''}<td>${f ? `${FTYPE[f.type]} · <span class="num">${rel(f.occurredAt)}</span>` : '<span class="muted">nenhum</span>'}</td><td class="num ${late ? 'late' : ''}">${m.nextActionAt && m.status !== 'inactive' ? `${fmtDay(m.nextActionAt)}${late ? ` · atrasada ${-dayDiff(m.nextActionAt)}d` : ''}` : '<span class="muted">—</span>'}</td></tr>`;
          })
          .join('')}</tbody></table></div>`
      : empty(
          'Ninguém com esses filtros.',
          'Limpe a busca ou escolha outra temperatura.',
          '<button class="btn" data-action="member-clear">Limpar filtros</button>',
        );
    return head + toolbar + table;
  }

  /* ---------- Saídas ---------- */
  function partName(p) {
    const x = p.kind === 'caregiver' ? caregiverById(p.refId) : memberById(p.refId);
    return x ? x.name : '—';
  }
  function saidas() {
    const isCoord = S.role === 'coordinator';
    const list = DB.outings
      .filter(
        (o) =>
          o.tenantId === S.tenantId &&
          (isCoord ||
            o.participants.some((p) => p.kind === 'caregiver' && p.refId === S.asCaregiverId)),
      )
      .sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));
    const head = `<div class="page-head"><div><h1>Saídas</h1><p>Visitas em grupo: quem vai, em qual carro e para onde.</p></div><div class="actions">${isCoord ? `<button class="btn primary" data-action="new-outing">${icon('plus')}Nova saída</button>` : ''}</div></div>`;
    if (!list.length)
      return (
        head +
        empty(
          'Nenhuma saída planejada.',
          isCoord
            ? 'Monte uma saída de sábado: escolha a data e quem vai. O Atalaia distribui as pessoas pelos carros.'
            : 'Quando você for incluído numa saída, ela aparece aqui.',
          isCoord
            ? `<button class="btn primary" data-action="new-outing">${icon('plus')}Planejar saída</button>`
            : '',
        )
      );
    if (!list.find((o) => o.id === S.outingId))
      S.outingId = (list.find((o) => new Date(o.scheduledFor) >= TODAY) || list[0]).id;
    const o = list.find((x) => x.id === S.outingId);
    const drivers = o.participants.filter((p) => p.hasCar && p.carSeats > 0);
    const seats = drivers.reduce((s, p) => s + p.carSeats + 1, 0);
    const byId = (id) => o.participants.find((p) => p.id === id);
    const placed = new Set(o.groups.flatMap((g) => g.ids));
    const unplaced = o.status === 'draft' ? [] : o.participants.filter((p) => !placed.has(p.id));
    const partChip = (p) =>
      `<span class="part">${avatar({ name: partName(p) })}${esc(shortName(partName(p)))}${p.hasCar ? ` · ${icon('car').replace('<svg', '<svg width="14" height="14"')}<span class="num">${p.carSeats}</span>` : ''}</span>`;
    let actions = '';
    if (isCoord && o.status === 'draft')
      actions = `<button class="btn primary" data-action="make-groups" data-id="${o.id}">Montar grupos</button>`;
    if (isCoord && o.status === 'generated')
      actions = `<button class="btn" data-action="make-groups" data-id="${o.id}">Remontar</button><button class="btn primary" data-action="confirm-outing" data-id="${o.id}">Confirmar saída</button>`;
    const past = new Date(o.scheduledFor) < TODAY;
    const detail = `<section class="card">
      <div class="card-head" style="align-items:flex-start;padding-bottom:4px"><div><h2 style="font-size:18px">${esc(o.name)}</h2><p class="muted" style="margin-top:4px">${fmtLong(o.scheduledFor)}, ${fmtTime(o.scheduledFor)} · ${esc(o.meetingPoint)}</p></div><div class="inline">${pill(o.status === 'confirmed' ? 'ok' : o.status === 'generated' ? 's-in_progress' : 's-new', past && o.status === 'confirmed' ? 'Realizada' : OUT_STATUS[o.status])}${actions}</div></div>
      <div class="card-body" style="display:grid;gap:18px">
        <div class="inline muted"><span><b class="num" style="color:var(--fg)">${o.participants.length}</b> participantes</span>·<span><b class="num" style="color:var(--fg)">${drivers.length}</b> carros</span>·<span><b class="num" style="color:var(--fg)">${seats}</b> lugares</span>·${isCoord && o.status === 'draft' ? `<label class="inline" for="target-size">Pessoas por grupo <input class="input num" id="target-size" type="number" min="2" max="6" style="width:64px" data-bind="target-size" data-id="${o.id}" value="${o.targetGroupSize}"/></label>` : `<span>grupos de até <b class="num" style="color:var(--fg)">${o.targetGroupSize}</b></span>`}</div>
        ${
          o.status === 'draft'
            ? `<div><div class="section-title" style="margin-bottom:8px">Cuidadores</div><div class="parts">${o.participants
                .filter((p) => p.kind === 'caregiver')
                .map(partChip)
                .join(
                  '',
                )}</div><div class="section-title" style="margin:14px 0 8px">Assistidos que vão junto</div><div class="parts">${
                o.participants
                  .filter((p) => p.kind === 'member')
                  .map(partChip)
                  .join('') || '<span class="muted">Ninguém ainda.</span>'
              }</div>${seats < o.participants.length ? `<p class="muted" style="margin-top:12px">Faltam ${o.participants.length - seats} lugares nos carros. Quem não couber fica na lista de espera.</p>` : ''}</div>`
            : `<div class="cars">${o.groups
                .map(
                  (g, k) =>
                    `<div class="car"><div class="car-head">${icon('car')}Carro ${k + 1}<span class="num">${g.ids.length}/${Math.min(g.seats, o.targetGroupSize)}</span></div><ul>${g.ids
                      .map((id) => {
                        const p = byId(id);
                        return `<li>${avatar({ name: partName(p) })}<span>${esc(shortName(partName(p)))}</span>${id === g.driverId ? pill('plain lume', 'Motorista') : p.kind === 'caregiver' ? pill('plain s-new', 'Cuidador') : ''}</li>`;
                      })
                      .join('')}</ul></div>`,
                )
                .join(
                  '',
                )}${unplaced.length ? `<div class="car unplaced"><div class="car-head">Sem lugar<span class="num">${unplaced.length}</span></div><ul>${unplaced.map((p) => `<li>${avatar({ name: partName(p) })}<span>${esc(shortName(partName(p)))}</span></li>`).join('')}</ul><p class="muted" style="padding:0 12px 12px;font-size:12px">Peça mais um motorista ou aumente o tamanho do grupo.</p></div>` : ''}</div>`
        }
      </div>
    </section>`;
    return `${head}<div class="outings"><div class="outing-list">${list.map((x) => `<button class="outing-item" data-action="open-outing" data-id="${x.id}" aria-current="${x.id === o.id}"><b>${esc(x.name)}</b><span class="meta"><span class="num">${fmtDay(x.scheduledFor)} · ${fmtTime(x.scheduledFor)}</span><span>${plural(x.participants.length, 'pessoa', 'pessoas')}</span></span><span>${pill(x.status === 'confirmed' ? 'ok' : x.status === 'generated' ? 's-in_progress' : 's-new', new Date(x.scheduledFor) < TODAY && x.status === 'confirmed' ? 'Realizada' : OUT_STATUS[x.status])}</span></button>`).join('')}</div>${detail}</div>`;
  }

  /* ---------- Encontros ---------- */
  function encontros() {
    const tabs = `<div class="tabs" role="tablist">${[
      ['freq', 'Frequência'],
      ['tci', 'Sessões TCI'],
    ]
      .map(
        ([k, l]) =>
          `<button role="tab" id="tab-${k}" aria-selected="${S.meetTab === k}" data-action="meet-tab" data-tab="${k}">${l}</button>`,
      )
      .join('')}</div>`;
    const head = `<div class="page-head"><div><h1>Encontros</h1><p>Frequência nas reuniões e sessões de cuidado nas câmaras.</p></div></div>`;
    return (
      head +
      tabs +
      `<div role="tabpanel" aria-labelledby="tab-${S.meetTab}">${S.meetTab === 'freq' ? frequencia() : tci()}</div>`
    );
  }
  function frequencia() {
    const types = DB.meetingTypes.filter((t) => t.tenantId === S.tenantId && t.active);
    if (!types.length)
      return empty(
        'Nenhuma reunião cadastrada.',
        'Cadastre o culto, a célula e a EBD em Ajustes para começar a marcar presença.',
        '<a class="btn" href="#ajustes" data-action="set-tab" data-tab="reunioes">Cadastrar reuniões</a>',
      );
    if (!types.find((t) => t.id === S.meetType)) S.meetType = types[0].id;
    const occ = DB.occurrences
      .filter((o) => o.meetingTypeId === S.meetType)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const occIds = new Set(occ.map((o) => o.id));
    const att = DB.attendance.filter((a) => occIds.has(a.occurrenceId));
    const ms = DB.memberships
      .filter((m) => m.tenantId === S.tenantId)
      .map((m) => memberById(m.memberId))
      .filter((m) => m && mine(m));
    const rows = ms
      .map((m) => {
        const marks = occ.map(
          (o) => (att.find((a) => a.occurrenceId === o.id && a.memberId === m.id) || {}).present,
        );
        const pct = marks.length
          ? Math.round((marks.filter(Boolean).length / marks.length) * 100)
          : 0;
        return { m, marks, pct };
      })
      .sort((a, b) => a.pct - b.pct);
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : 0;
    const lastOcc = occ[occ.length - 1];
    const lastPresent = lastOcc
      ? att.filter((a) => a.occurrenceId === lastOcc.id && a.present).length
      : 0;
    const cooling = rows.filter((r) => r.marks.slice(-3).every((x) => !x)).length;
    return `<div class="toolbar"><div class="seg" role="group" aria-label="Reunião">${types.map((t) => `<button data-action="meet-type" data-id="${t.id}" aria-pressed="${t.id === S.meetType}">${esc(t.name)}</button>`).join('')}</div></div>
      <div class="grid kpis" style="margin-bottom:16px">
        <div class="card kpi"><span class="label">Presença média · 6 semanas</span><div class="value">${avg}%</div></div>
        <div class="card kpi"><span class="label">Última reunião</span><div class="value">${lastPresent}<small>${lastOcc ? fmtDay(lastOcc.date) : ''}</small></div></div>
        <div class="card kpi ${cooling ? 'alert' : ''}"><span class="label">Faltaram as 3 últimas</span><div class="value">${cooling}<small>avisar o cuidador</small></div></div>
        <div class="card kpi"><span class="label">Membros oficiais</span><div class="value">${DB.memberships.filter((m) => m.tenantId === S.tenantId && m.official).length}<small>de ${ms.length} acompanhados</small></div></div>
      </div>
      ${rows.length ? `<div class="card table-wrap"><table class="att"><thead><tr><th>Pessoa</th>${occ.map((o) => `<th class="num">${fmtDay(o.date)}</th>`).join('')}<th>Presença</th></tr></thead><tbody>${rows.map((r) => `<tr><td><button class="row-btn" data-action="open-member" data-id="${r.m.id}"><b>${esc(shortName(r.m.name))}</b></button> ${tempPill(r.m.spiritualTemperature)}</td>${r.marks.map((x) => `<td><span class="dot ${x ? 'on' : ''}" role="img" aria-label="${x ? 'presente' : 'ausente'}"></span></td>`).join('')}<td class="num ${r.pct < 40 ? 'late' : ''}">${r.pct}%</td></tr>`).join('')}</tbody></table></div>` : empty('Ninguém na lista de frequência.', 'Assistidos entram aqui quando viram membros da igreja.')}`;
  }
  function tci() {
    const isCoord = S.role === 'coordinator';
    const chambers = DB.chambers.filter((c) => c.tenantId === S.tenantId);
    if (!chambers.length)
      return empty(
        'Nenhuma câmara cadastrada.',
        'Câmaras são as salas onde acontecem as sessões de cuidado individual. Cadastre a primeira em Ajustes.',
        '<a class="btn" href="#ajustes" data-action="set-tab" data-tab="reunioes">Cadastrar câmara</a>',
      );
    const sessions = DB.tciSessions.filter(
      (x) => x.tenantId === S.tenantId && (isCoord || x.caregiverIds.includes(S.asCaregiverId)),
    );
    const up = sessions
      .filter((x) => new Date(x.startsAt) >= sod(TODAY))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    const past = sessions
      .filter((x) => new Date(x.startsAt) < sod(TODAY))
      .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
    const groupBy = (arr) =>
      arr.reduce((acc, x) => {
        const k = toDateInput(x.startsAt);
        (acc[k] = acc[k] || []).push(x);
        return acc;
      }, {});
    const statusPill = (x) =>
      x.status === 'done'
        ? pill('ok', 'Realizada')
        : x.status === 'missed'
          ? pill('bad', 'Faltou')
          : pill('s-new', 'Agendada');
    const sessionRow = (x) => {
      const ch = chambers.find((c) => c.id === x.chamberId);
      const m = memberById(x.memberId);
      return `<div class="session"><time>${fmtTime(x.startsAt)}</time><div><b>${esc(ch.name)} · ${esc(m ? shortName(m.name) : '—')}</b><small>${esc(ch.room)} · ${x.durationMin} min · ${x.caregiverIds.map((id) => esc(shortName(caregiverById(id).name))).join(' e ')}</small></div>${statusPill(x)}</div>`;
    };
    const block = (title, arr) => {
      const g = groupBy(arr);
      return `<div class="sessions"><h2 class="section-title">${title}</h2>${
        Object.keys(g).length
          ? Object.entries(g)
              .map(
                ([d, xs]) =>
                  `<div class="day-group"><h3>${fmtLong(d + 'T12:00:00')}</h3>${xs.map(sessionRow).join('')}</div>`,
              )
              .join('')
          : '<p class="muted">Nada por aqui.</p>'
      }</div>`;
    };
    return `<div class="toolbar">${chambers.map((c) => `<span class="chip" style="cursor:default">${esc(c.name)}<span class="count">${c.capacity} lugares</span></span>`).join('')}</div><div class="grid dash" style="margin-top:0">${block('Próximas', up)}${block('Últimas', past.slice(0, 8))}</div>`;
  }

  /* ---------- Ajustes ---------- */
  function ajustes() {
    const isCoord = S.role === 'coordinator';
    const pend = DB.pendingSignups.filter((p) => p.tenantId === S.tenantId).length;
    const tabs = isCoord
      ? [
          ['igreja', 'Igreja'],
          ['equipe', 'Equipe', pend],
          ['canais', 'Canais de cadastro'],
          ['jornada', 'Jornada e alertas'],
          ['reunioes', 'Reuniões e câmaras'],
          ['notificacoes', 'Notificações'],
        ]
      : [
          ['perfil', 'Meu perfil'],
          ['notificacoes', 'Notificações'],
        ];
    if (!tabs.find((t) => t[0] === S.setTab)) S.setTab = tabs[0][0];
    const views = {
      igreja: setIgreja,
      equipe: setEquipe,
      canais: setCanais,
      jornada: setJornada,
      reunioes: setReunioes,
      notificacoes: setNotif,
      perfil: setPerfil,
    };
    const head = `<div class="page-head"><div><h1>${isCoord ? 'Ajustes' : 'Meu perfil'}</h1><p>${isCoord ? `Configuração da ${esc(tenant().name)}. As mudanças valem na hora.` : 'Seus dados de contato e avisos.'}</p></div></div>`;
    return `${head}<div class="settings"><nav class="settings-nav" aria-label="Ajustes">${tabs.map(([k, l, b]) => `<button data-action="set-tab" data-tab="${k}" aria-current="${S.setTab === k}">${l}${b ? `<span class="pill bad plain">${b}</span>` : ''}</button>`).join('')}</nav><div class="set-section">${views[S.setTab]()}</div></div>`;
  }
  const setRow = (title, text, ctl) =>
    `<div class="set-row"><div><h3>${title}</h3><p>${text}</p></div><div class="ctl">${ctl}</div></div>`;
  function setIgreja() {
    const t = tenant();
    const net = DB.tenants;
    return `<section class="card">
      ${setRow('Nome da igreja', 'Aparece no topo do painel e nos links de cadastro.', `<input class="input" id="set-name" data-set="tenant.name" value="${esc(t.name)}"/>`)}
      ${setRow('Cidade', 'Usada no mapa e para sugerir bairros no cadastro.', `<div class="inline"><select class="select" id="set-city" style="width:auto" data-set="tenant.city">${DB.cities.map((c) => `<option ${c === t.city ? 'selected' : ''}>${c}</option>`).join('')}</select><input class="input" style="width:64px" value="PB" readonly aria-label="Estado"/></div>`)}
      ${setRow('Central ativa', 'Desativar bloqueia o acesso dos cuidadores sem apagar nenhum dado.', `<label class="check" for="set-active" style="align-items:center"><input type="checkbox" class="switch" id="set-active" data-set="tenant.status" ${t.status === 'active' ? 'checked' : ''}/><span>${t.status === 'active' ? 'Ativa' : 'Inativa'}</span></label>`)}
    </section>
    <section class="card"><div class="card-head"><h2>Igrejas da rede</h2><span class="muted">cada uma com dados isolados</span></div><div class="card-body table-wrap" style="padding:8px 0 0"><table><thead><tr><th>Igreja</th><th>Cidade</th><th>Situação</th><th>Cuidadores</th><th>Contatos</th><th>Desde</th></tr></thead><tbody>${net.map((x) => `<tr style="cursor:default"><td><b>${esc(x.name)}</b></td><td>${esc(x.city)}/${x.state}</td><td>${x.status === 'active' ? pill('ok', 'Ativa') : pill('s-inactive', 'Inativa')}</td><td class="num">${DB.caregivers.filter((c) => c.tenantId === x.id).length}</td><td class="num">${DB.seeds.filter((s) => s.tenantId === x.id).length}</td><td class="num">${fmtDate(x.createdAt + 'T12:00:00')}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  function setEquipe() {
    const pend = DB.pendingSignups.filter((p) => p.tenantId === S.tenantId);
    const set = settings();
    const cg = tCaregivers();
    return `${pend.length ? `<section class="card"><div class="card-head"><h2>Aguardando aprovação</h2><span class="muted">${plural(pend.length, 'pedido', 'pedidos')}</span></div><div class="card-body" style="padding:8px 0 4px"><ul class="needs">${pend.map((p) => `<li><span class="sev" aria-hidden="true"></span><div class="who-line"><b>${esc(p.name)}</b><small>${esc(p.email)} · ${esc(p.phone)} · pelo canal ${esc(p.channel)}, ${rel(p.requestedAt)}</small></div><div class="inline"><button class="btn sm ghost" data-action="reject" data-id="${p.id}">Recusar</button><button class="btn sm" data-action="approve" data-id="${p.id}">${icon('check')}Aprovar</button></div></li>`).join('')}</ul></div></section>` : ''}
    <section class="card"><div class="card-head"><h2>Cuidadores</h2><button class="btn primary sm" data-action="edit-caregiver" data-id="">${icon('plus')}Adicionar cuidador</button></div>
      <div class="card-body table-wrap" style="padding:8px 0 0">${
        cg.length
          ? `<table><thead><tr><th>Nome</th><th>Contato</th><th>Assistidos</th><th>Carro</th><th>Ativo</th></tr></thead><tbody>${cg
              .map((c) => {
                const n = activeMembers(c.id);
                return `<tr tabindex="0" data-action="edit-caregiver" data-id="${c.id}"><td><span class="name">${avatar(c)}${esc(c.name)}</span>${c.notes ? `<small class="muted">${esc(c.notes)}</small>` : ''}</td><td><span class="num">${esc(c.phone)}</span><br/><small class="muted">${esc(c.email)}</small></td><td><div class="inline" style="flex-wrap:nowrap"><span class="meter ${n > set.capacity ? 'over' : n === set.capacity ? 'warn' : ''}" style="width:80px"><b style="width:${Math.min(100, (n / set.capacity) * 100)}%"></b></span><span class="num">${n}/${set.capacity}</span></div></td><td>${c.hasCar ? 'Sim' : '<span class="muted">Não</span>'}</td><td>${c.active ? pill('ok', 'Ativo') : pill('s-inactive', 'Inativo')}</td></tr>`;
              })
              .join('')}</tbody></table>`
          : `<div style="padding:0 16px 16px">${empty('Nenhum cuidador ainda.', 'Crie um canal de cadastro e mande o link no grupo da equipe.', '<button class="btn" data-action="set-tab" data-tab="canais">Ir para canais</button>')}</div>`
      }</div></section>`;
  }
  function setCanais() {
    const list = DB.signupChannels.filter((c) => c.tenantId === S.tenantId);
    return `<div class="inline" style="justify-content:space-between"><p class="muted">Links para cuidadores se cadastrarem sozinhos. Quem entrar aparece na Equipe.</p><button class="btn primary" data-action="new-channel">${icon('plus')}Novo canal</button></div>
    ${
      list.length
        ? list
            .map((c) => {
              const expired = c.expiresAt && new Date(c.expiresAt + 'T23:59:59') < TODAY;
              const full = c.maxUses && c.uses >= c.maxUses;
              const state = !c.active
                ? pill('s-inactive', 'Desativado')
                : expired
                  ? pill('bad', 'Expirado')
                  : full
                    ? pill('bad', 'Esgotado')
                    : pill('ok', 'Aceitando cadastros');
              return `<section class="card"><div class="card-head"><h2>${esc(c.name)}</h2>${state}</div><div class="card-body" style="display:grid;gap:12px">
      <div class="inline" style="flex-wrap:nowrap"><div class="channel-link" style="flex:1"><span id="link-${c.id}">atalaia.app/entrar/${esc(c.code)}</span></div><button class="btn sm" data-action="copy" data-id="${c.id}">${icon('copy')}Copiar</button></div>
      <dl class="kv"><dt>Usos</dt><dd><span class="num">${c.uses}${c.maxUses ? ` de ${c.maxUses}` : ''}</span>${c.maxUses ? `<span class="meter ${full ? 'over' : ''}" style="display:block;margin-top:6px;max-width:220px"><b style="width:${Math.min(100, (c.uses / c.maxUses) * 100)}%"></b></span>` : ' · sem limite'}</dd><dt>Aprovação</dt><dd>${c.requireApproval ? 'A coordenação aprova cada cadastro' : 'Entrada direta'}</dd><dt>Domínio de e-mail</dt><dd>${c.allowedEmailDomain ? `<span class="num">@${esc(c.allowedEmailDomain)}</span>` : 'Qualquer e-mail'}</dd><dt>Validade</dt><dd>${c.expiresAt ? fmtDate(c.expiresAt + 'T12:00:00') : 'Sem validade'}</dd></dl>
      <label class="check" for="ch-${c.id}" style="align-items:center"><input type="checkbox" class="switch" id="ch-${c.id}" data-set="channel.active" data-id="${c.id}" ${c.active ? 'checked' : ''}/><span>Canal ativo</span></label>
    </div></section>`;
            })
            .join('')
        : empty(
            'Nenhum canal ainda.',
            'Crie um link e mande no grupo da equipe. Você escolhe se cada cadastro precisa de aprovação.',
          )
    }`;
  }
  function setJornada() {
    const s = settings();
    return `<section class="card">
      ${setRow('Alerta de contato parado', 'Quantos dias sem contato até a pessoa entrar em Precisa de alguém.', `<label class="inline" for="set-stale"><input class="input num" id="set-stale" type="number" min="1" max="60" style="width:80px" data-set="settings.staleDays" value="${s.staleDays}"/> dias</label>`)}
      ${setRow('Contato novo sem cuidador', 'Depois de quantos dias um contato sem cuidador vira alerta.', `<label class="inline" for="set-newcare"><input class="input num" id="set-newcare" type="number" min="0" max="30" style="width:80px" data-set="settings.newWithoutCaregiverDays" value="${s.newWithoutCaregiverDays}"/> dias</label>`)}
      ${setRow('Limite por cuidador', 'Assistidos ativos por cuidador. Acima disso a carga aparece em vermelho.', `<label class="inline" for="set-cap"><input class="input num" id="set-cap" type="number" min="1" max="30" style="width:80px" data-set="settings.capacity" value="${s.capacity}"/> assistidos</label>`)}
      ${setRow('Urgentes no topo', 'Casos marcados como urgentes aparecem primeiro no quadro e no painel.', `<label class="check" for="set-urgent" style="align-items:center"><input type="checkbox" class="switch" id="set-urgent" data-set="settings.urgentFirst" ${s.urgentFirst ? 'checked' : ''}/><span>Ligado</span></label>`)}
      ${setRow('Origens do contato', 'Como as pessoas chegam. Aparece no cadastro e nos filtros.', `<div class="tag-list">${s.sources.map((x, k) => `<span class="tag">${esc(x)}<button data-action="del-source" data-k="${k}" aria-label="Remover ${esc(x)}">${icon('x').replace('<svg', '<svg width="12" height="12"')}</button></span>`).join('')}</div><form class="inline" data-form="source"><label class="sr" for="new-source">Nova origem</label><input class="input" id="new-source" placeholder="Ex.: Evento de jovens" style="max-width:240px"/><button class="btn" type="submit">Adicionar</button></form>`)}
    </section>
    <section class="card"><div class="card-head"><h2>Etapas da jornada</h2><span class="muted">iguais em toda a rede</span></div><div class="card-body"><ol class="needs">${Object.entries(
      SEED_STATUS,
    )
      .map(
        ([k, v]) =>
          `<li style="grid-template-columns:auto minmax(0,1fr)">${seedPill(k)}<span class="muted">${{ new: 'Cadastrado, ainda sem contato do cuidador.', contacted: 'Primeiro contato feito por ligação ou mensagem.', waiting_visit: 'Pediu visita; entra na próxima saída.', in_progress: 'Recebe visitas e acompanhamento regular.', consolidated: 'Frequência estável e vínculo com uma célula.', inactive: 'Pediu para não ser procurado ou mudou de cidade.' }[k]}</span></li>`,
      )
      .join('')}</ol></div></section>`;
  }
  function setReunioes() {
    const types = DB.meetingTypes.filter((t) => t.tenantId === S.tenantId);
    const ch = DB.chambers.filter((c) => c.tenantId === S.tenantId);
    return `<section class="card"><div class="card-head"><h2>Reuniões com frequência</h2></div><div class="card-body">${types.length ? `<ul class="needs">${types.map((t) => `<li style="grid-template-columns:minmax(0,1fr) auto"><div class="who-line"><b>${esc(t.name)}</b><small>Toda ${WEEKDAYS[t.weekday]}, ${String(t.hour).padStart(2, '0')}h</small></div><label class="check" for="mt-${t.id}" style="align-items:center"><input type="checkbox" class="switch" id="mt-${t.id}" data-set="meeting.active" data-id="${t.id}" ${t.active ? 'checked' : ''}/><span class="sr">Ativa</span></label></li>`).join('')}</ul>` : '<p class="muted">Nenhuma reunião ainda.</p>'}
      <form class="inline" data-form="meeting" style="margin-top:12px"><label class="sr" for="mt-name">Nome</label><input class="input" id="mt-name" placeholder="Ex.: Culto de jovens" style="max-width:220px" required/><label class="sr" for="mt-day">Dia</label><select class="select" id="mt-day" style="width:auto">${WEEKDAYS.map((d, k) => `<option value="${k}">${d}</option>`).join('')}</select><label class="sr" for="mt-hour">Hora</label><input class="input num" id="mt-hour" type="number" min="0" max="23" value="19" style="width:70px"/><button class="btn" type="submit">Adicionar reunião</button></form></div></section>
      <section class="card"><div class="card-head"><h2>Câmaras de TCI</h2><span class="muted">salas para sessões individuais</span></div><div class="card-body">${ch.length ? `<ul class="needs">${ch.map((c) => `<li style="grid-template-columns:minmax(0,1fr) auto"><div class="who-line"><b>${esc(c.name)}</b><small>${esc(c.room)} · ${c.capacity} lugares</small></div><span class="num muted">${DB.tciSessions.filter((x) => x.chamberId === c.id && new Date(x.startsAt) >= TODAY).length} sessões marcadas</span></li>`).join('')}</ul>` : '<p class="muted">Nenhuma câmara ainda.</p>'}
      <form class="inline" data-form="chamber" style="margin-top:12px"><label class="sr" for="ch-name">Nome da câmara</label><input class="input" id="ch-name" placeholder="Ex.: Câmara Getsêmani" style="max-width:220px" required/><label class="sr" for="ch-room">Sala</label><input class="input" id="ch-room" placeholder="Sala 5" style="max-width:120px"/><button class="btn" type="submit">Adicionar câmara</button></form></div></section>`;
  }
  function setNotif() {
    const s = settings();
    return `<section class="card">
      ${setRow('Resumo diário', 'Às 7h, um WhatsApp com quem precisa de alguém hoje.', `<label class="check" for="n-daily" style="align-items:center"><input type="checkbox" class="switch" id="n-daily" data-set="settings.notifyDaily" ${s.notifyDaily ? 'checked' : ''}/><span>Ligado</span></label>`)}
      ${setRow('Caso urgente', 'Aviso imediato quando a recepção marcar um contato como urgente.', `<label class="check" for="n-urgent" style="align-items:center"><input type="checkbox" class="switch" id="n-urgent" data-set="settings.notifyUrgent" ${s.notifyUrgent ? 'checked' : ''}/><span>Ligado</span></label>`)}
    </section><p class="muted">Na demonstração nenhuma mensagem é enviada.</p>`;
  }
  function setPerfil() {
    const c = viewer();
    return `<section class="card">${setRow('Nome', 'Como a coordenação e os assistidos veem você.', `<input class="input" value="${esc(c.name)}" readonly id="pf-name"/>`)}${setRow('Telefone', 'Usado no resumo diário.', `<input class="input num" value="${esc(c.phone)}" readonly id="pf-phone"/>`)}${setRow('Carro para saídas', 'Se você pode levar pessoas nas saídas de sábado.', `<label class="check" for="pf-car" style="align-items:center"><input type="checkbox" class="switch" id="pf-car" data-set="caregiver.hasCar" data-id="${c.id}" ${c.hasCar ? 'checked' : ''}/><span>${c.hasCar ? 'Tenho carro' : 'Sem carro'}</span></label>`)}</section>`;
  }

  /* ---------- Drawers ---------- */
  let drawerReturn = null;
  function openDrawer(html) {
    drawerReturn = document.activeElement;
    const d = $('#drawer');
    d.innerHTML = html;
    $('#drawer-layer').hidden = false;
    document.body.style.overflow = 'hidden';
    const f = d.querySelector('[autofocus]') || d;
    f.focus();
  }
  function closeDrawer() {
    $('#drawer-layer').hidden = true;
    document.body.style.overflow = '';
    $('#drawer').innerHTML = '';
    if (drawerReturn && document.body.contains(drawerReturn)) drawerReturn.focus();
  }
  const drawerHead = (title, sub) =>
    `<div class="drawer-head"><div><h2 id="drawer-title">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button class="btn ghost icon-btn" data-action="close-drawer" aria-label="Fechar">${icon('x')}</button></div>`;

  function seedDrawer(id) {
    const s = seedById(id);
    const isCoord = S.role === 'coordinator';
    const i = BOARD.indexOf(s.status);
    const next = i >= 0 && i < BOARD.length - 1 ? BOARD[i + 1] : null;
    const canConvert = !s.memberId && (s.status === 'in_progress' || s.status === 'consolidated');
    openDrawer(`${drawerHead(esc(s.referenceName), `${seedPill(s.status)} ${s.isUrgent ? pill('urgent', 'Urgente') : ''}`)}
      <div class="drawer-body">
        <dl class="kv">
          <dt>Idade</dt><dd>${s.age} anos</dd>
          <dt>Telefone</dt><dd class="num">${esc(s.phone)}</dd>
          <dt>Endereço</dt><dd>${esc(s.street)}, ${esc(s.addressNumber)} · ${esc(s.neighborhood)}<br/><span class="muted">${esc(s.city)}/${s.state} · CEP <span class="num">${esc(s.postalCode)}</span></span></dd>
          <dt>Coordenadas</dt><dd class="num muted">${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}</dd>
          <dt>Origem</dt><dd>${esc(s.source)}</dd>
          <dt>Casa aberta</dt><dd>${s.openHouse ? 'Sim, recebe vizinhos para visitas' : 'Não'}</dd>
          <dt>Primeiro contato</dt><dd>${fmtDate(s.firstContactAt)} · ${rel(s.firstContactAt)}</dd>
          <dt>Último contato</dt><dd>${s.lastContactAt ? `${fmtDate(s.lastContactAt)} · ${rel(s.lastContactAt)}` : '<span class="muted">nenhum ainda</span>'}</dd>
        </dl>
        <label class="field" for="seed-care"><span>Cuidador</span>${isCoord ? `<select class="select" id="seed-care" data-seed="${s.id}" data-field="caregiverId" ${!s.caregiverId ? 'autofocus' : ''}>${caregiverOptions(s.caregiverId, true)}</select>` : `<input class="input" id="seed-care" readonly value="${esc(caregiverById(s.caregiverId).name)}"/>`}</label>
        <label class="check" for="seed-urgent" style="align-items:center"><input type="checkbox" class="switch" id="seed-urgent" data-seed="${s.id}" data-field="isUrgent" ${s.isUrgent ? 'checked' : ''}/><span>Caso urgente</span></label>
        <div class="field"><span>Observações</span><p>${esc(s.notes)}</p></div>
        ${s.memberId ? `<p class="pill ok plain" style="height:auto;padding:8px 10px">Já é assistido. <button class="row-btn" style="text-decoration:underline" data-action="open-member" data-id="${s.memberId}">Abrir ficha</button></p>` : ''}
      </div>
      <div class="drawer-foot">
        ${s.status !== 'inactive' ? `<button class="btn ghost left" data-action="seed-inactive" data-id="${s.id}">Marcar inativo</button>` : `<button class="btn ghost left" data-action="seed-move" data-id="${s.id}" data-to="contacted">Reativar</button>`}
        <button class="btn" data-action="seed-contact" data-id="${s.id}">${icon('call')}Registrar contato</button>
        ${canConvert ? `<button class="btn primary" data-action="seed-convert" data-id="${s.id}">Converter em assistido</button>` : next ? `<button class="btn primary" data-action="seed-move" data-id="${s.id}" data-to="${next}">Avançar para ${SEED_STATUS[next].toLowerCase()}</button>` : ''}
      </div>`);
  }

  function hoodsOf(city) {
    const pts = DB.seeds.concat(DB.members).filter((p) => p.city === city);
    const map = {};
    for (const p of pts) (map[p.neighborhood] = map[p.neighborhood] || []).push(p);
    return Object.entries(map).map(([name, ps]) => ({
      name,
      lat: ps.reduce((s, p) => s + p.latitude, 0) / ps.length,
      lng: ps.reduce((s, p) => s + p.longitude, 0) / ps.length,
      street: ps[0].street,
      cep: ps[0].postalCode,
    }));
  }

  function personForm(kind) {
    const isCoord = S.role === 'coordinator';
    const t = tenant();
    const hoods = hoodsOf(t.city);
    openDrawer(`${drawerHead(kind === 'seed' ? 'Novo contato' : 'Novo assistido', kind === 'seed' ? 'O essencial é nome e telefone. O resto pode vir depois.' : 'Para quem já está em acompanhamento sem ter passado pelo quadro.')}
      <form class="drawer-body" data-form="${kind}" novalidate id="person-form">
        <div class="form-grid">
          <label class="field full" for="pf-ref"><span>Nome *</span><input class="input" id="pf-ref" name="name" required autofocus autocomplete="off"/></label>
          <label class="field" for="pf-tel"><span>Telefone *</span><input class="input" id="pf-tel" name="phone" inputmode="tel" placeholder="(83) 9 9999-0000" required/></label>
          <label class="field" for="pf-age"><span>${kind === 'seed' ? 'Idade' : 'Nascimento'}</span><input class="input" id="pf-age" name="age" ${kind === 'seed' ? 'type="number" min="0" max="120" inputmode="numeric"' : 'type="date"'}/></label>
          <label class="field" for="pf-hood"><span>Bairro</span>${hoods.length ? `<select class="select" id="pf-hood" name="hood">${hoods.map((h) => `<option>${esc(h.name)}</option>`).join('')}</select>` : `<input class="input" id="pf-hood" name="hood"/>`}</label>
          <label class="field" for="pf-num"><span>Número</span><input class="input" id="pf-num" name="number" inputmode="numeric"/></label>
          <label class="field full" for="pf-street"><span>Rua</span><input class="input" id="pf-street" name="street" autocomplete="off"/></label>
          ${
            kind === 'seed'
              ? `<label class="field" for="pf-src"><span>Como chegou</span><select class="select" id="pf-src" name="source">${settings()
                  .sources.map((x) => `<option>${esc(x)}</option>`)
                  .join('')}</select></label>`
              : `<label class="field" for="pf-temp"><span>Temperatura</span><select class="select" id="pf-temp" name="temp">${Object.entries(
                  TEMP,
                )
                  .map(
                    ([k, v]) =>
                      `<option value="${k}" ${k === 'warm' ? 'selected' : ''}>${v}</option>`,
                  )
                  .join('')}</select></label>`
          }
          <label class="field" for="pf-care"><span>Cuidador</span>${isCoord ? `<select class="select" id="pf-care" name="caregiver">${caregiverOptions(null, kind === 'seed')}</select>` : `<input class="input" id="pf-care" readonly value="${esc(viewer().name)}"/>`}</label>
          <label class="check full" for="pf-open"><input type="checkbox" id="pf-open" name="open"/><span>Casa aberta para visitas</span></label>
          ${kind === 'seed' ? `<label class="check full" for="pf-urg"><input type="checkbox" id="pf-urg" name="urgent"/><span>Caso urgente: alguém precisa ligar hoje</span></label>` : ''}
          <label class="field full" for="pf-notes"><span>Observações</span><textarea class="textarea" id="pf-notes" name="notes" placeholder="Ex.: Frequentou o culto pela primeira vez com a vizinha."></textarea></label>
        </div>
        <p class="err" id="pf-err" role="alert"></p>
      </form>
      <div class="drawer-foot"><button class="btn ghost" data-action="close-drawer">Cancelar</button><button class="btn primary" type="submit" form="person-form">${kind === 'seed' ? 'Cadastrar contato' : 'Cadastrar assistido'}</button></div>`);
  }

  function savePerson(kind, form) {
    const f = new FormData(form);
    const name = String(f.get('name') || '').trim();
    const phone = String(f.get('phone') || '').trim();
    const err = $('#pf-err');
    if (!name) return ((err.textContent = 'Informe o nome da pessoa.'), $('#pf-ref').focus());
    if (phone.replace(/\D/g, '').length < 10)
      return (
        (err.textContent = 'Informe o telefone com DDD, como (83) 9 9999-0000.'),
        $('#pf-tel').focus()
      );
    const t = tenant();
    const hoodName = String(f.get('hood') || '').trim() || 'Centro';
    const hood = hoodsOf(t.city).find((h) => h.name === hoodName);
    const jitter = () => (Math.random() - 0.5) * 0.006;
    const base = {
      tenantId: t.id,
      phone,
      city: t.city,
      state: 'PB',
      neighborhood: hoodName,
      street: String(f.get('street') || '').trim() || (hood ? hood.street : ''),
      addressNumber: String(f.get('number') || '').trim() || 's/n',
      postalCode: hood ? hood.cep : '58000-000',
      latitude: (hood ? hood.lat : -7.12) + jitter(),
      longitude: (hood ? hood.lng : -34.86) + jitter(),
      openHouse: f.get('open') === 'on',
      caregiverId:
        S.role === 'caregiver' ? S.asCaregiverId : String(f.get('caregiver') || '') || null,
    };
    if (kind === 'seed') {
      DB.seeds.push({
        id: DB.nextId('s'),
        ...base,
        referenceName: name,
        age: +f.get('age') || null,
        source: String(f.get('source')),
        status: 'new',
        isUrgent: f.get('urgent') === 'on',
        firstContactAt: TODAY.toISOString(),
        lastContactAt: null,
        notes: String(f.get('notes') || '').trim() || 'Sem observações.',
        memberId: null,
      });
      S.seedChip = '';
      closeDrawer();
      toast(`${firstName(name)} entrou em Novos.`);
    } else {
      const birth =
        String(f.get('age') || '') || toDateInput(new Date(TODAY.getFullYear() - 35, 0, 1));
      DB.members.push({
        id: DB.nextId('m'),
        ...base,
        name,
        birthDate: birth,
        spiritualTemperature: String(f.get('temp')),
        status: 'new',
        caregiverId: base.caregiverId || (tCaregivers()[0] || {}).id || null,
        seedId: null,
        createdAt: TODAY.toISOString(),
        nextActionAt: new Date(TODAY.getTime() + 3 * DAY).toISOString(),
      });
      closeDrawer();
      toast(`${firstName(name)} agora é assistido. Primeira ação em 3 dias.`);
    }
    render();
  }

  function memberDrawer(id) {
    const m = memberById(id);
    const c = caregiverById(m.caregiverId);
    const fs = followupsOf(id);
    const isCoord = S.role === 'coordinator';
    const late = m.nextActionAt && m.status !== 'inactive' && dayDiff(m.nextActionAt) < 0;
    openDrawer(`${drawerHead(esc(m.name), `${tempPill(m.spiritualTemperature)} ${memberPill(m.status)}`)}
      <div class="drawer-body">
        <dl class="kv">
          <dt>Idade</dt><dd>${age(m.birthDate)} anos · nasceu em ${fmtDate(m.birthDate + 'T12:00:00')}</dd>
          <dt>Telefone</dt><dd class="num">${esc(m.phone)}</dd>
          <dt>Endereço</dt><dd>${esc(m.street)}, ${esc(m.addressNumber)} · ${esc(m.neighborhood)}<br/><span class="muted">${esc(m.city)}/${m.state} · CEP <span class="num">${esc(m.postalCode)}</span></span></dd>
          <dt>Casa aberta</dt><dd>${m.openHouse ? 'Sim' : 'Não'}</dd>
          <dt>Cuidador</dt><dd>${isCoord ? `<select class="select" id="member-care-${m.id}" data-member="${m.id}" data-field="caregiverId" aria-label="Cuidador">${caregiverOptions(m.caregiverId, false)}</select>` : esc(c ? c.name : '—')}</dd>
          <dt>Próxima ação</dt><dd class="${late ? 'err' : ''}" style="font-size:13px">${m.nextActionAt && m.status !== 'inactive' ? `${fmtDate(m.nextActionAt)} · ${rel(m.nextActionAt)}${late ? ' (atrasada)' : ''}` : '<span class="muted">nenhuma</span>'}</dd>
        </dl>
        <div class="field"><span>Temperatura espiritual</span><div class="seg" role="group" aria-label="Temperatura espiritual">${Object.entries(
          TEMP,
        )
          .map(
            ([k, v]) =>
              `<button data-action="member-set-temp" data-id="${m.id}" data-v="${k}" aria-pressed="${m.spiritualTemperature === k}">${v}</button>`,
          )
          .join('')}</div></div>
        <div class="field"><span>Situação</span><div class="seg" role="group" aria-label="Situação">${Object.entries(
          MEMBER_STATUS,
        )
          .map(
            ([k, v]) =>
              `<button data-action="member-set-status" data-id="${m.id}" data-v="${k}" aria-pressed="${m.status === k}">${v}</button>`,
          )
          .join('')}</div></div>
        <div><div class="section-title" style="margin-bottom:10px">Acompanhamentos · ${fs.length}</div>${
          fs.length
            ? `<ol class="timeline">${fs
                .map((f) => {
                  const cc = caregiverById(f.caregiverId);
                  return `<li><div class="meta"><b style="color:var(--fg)">${FTYPE[f.type]}</b><span class="num">${fmtDate(f.occurredAt)} ${fmtTime(f.occurredAt)}</span><span>· ${esc(cc ? shortName(cc.name) : '—')}</span></div><p>${esc(f.notes)}</p></li>`;
                })
                .join('')}</ol>`
            : '<p class="muted">Nenhum acompanhamento ainda. O primeiro costuma ser uma ligação.</p>'
        }</div>
      </div>
      <div class="drawer-foot"><button class="btn primary" data-action="new-followup" data-id="${m.id}" autofocus>${icon('plus')}Registrar acompanhamento</button></div>`);
  }

  function followupForm(mid) {
    const m = memberById(mid);
    openDrawer(`${drawerHead('Registrar acompanhamento', esc(m.name))}
      <form class="drawer-body" data-form="followup" data-id="${mid}" id="fu-form" novalidate>
        <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">Tipo</legend><div class="type-pick">${Object.entries(
          FTYPE,
        )
          .map(
            ([k, v], i) =>
              `<label>${icon(k)}<input type="radio" name="type" value="${k}" ${i === 0 ? 'checked autofocus' : ''}/>${v}</label>`,
          )
          .join('')}</div></fieldset>
        <label class="field" for="fu-at"><span>Quando aconteceu</span><input class="input" id="fu-at" type="datetime-local" name="at" value="${toLocalInput(TODAY)}"/></label>
        <label class="field" for="fu-notes"><span>O que foi conversado *</span><textarea class="textarea" id="fu-notes" name="notes" placeholder="Ex.: Pessoa receptiva. Solicitou oração pela saúde da esposa."></textarea></label>
        <div class="form-grid">
          <label class="field" for="fu-next"><span>Próximo contato</span><input class="input" id="fu-next" type="date" name="next" value="${toDateInput(new Date(TODAY.getTime() + 7 * DAY))}"/><small>Entra no painel como próxima ação.</small></label>
          <label class="field" for="fu-temp"><span>Temperatura agora</span><select class="select" id="fu-temp" name="temp">${Object.entries(
            TEMP,
          )
            .map(
              ([k, v]) =>
                `<option value="${k}" ${k === m.spiritualTemperature ? 'selected' : ''}>${v}</option>`,
            )
            .join('')}</select></label>
        </div>
        <p class="err" id="fu-err" role="alert"></p>
      </form>
      <div class="drawer-foot"><button class="btn ghost" data-action="open-member" data-id="${mid}">Voltar</button><button class="btn primary" type="submit" form="fu-form">Salvar acompanhamento</button></div>`);
  }

  function saveFollowup(form) {
    const mid = form.dataset.id;
    const m = memberById(mid);
    const f = new FormData(form);
    const notes = String(f.get('notes') || '').trim();
    if (!notes)
      return (
        ($('#fu-err').textContent = 'Escreva pelo menos uma frase sobre o encontro.'),
        $('#fu-notes').focus()
      );
    const at = new Date(String(f.get('at')) || TODAY);
    const next = f.get('next') ? new Date(String(f.get('next')) + 'T09:00:00') : null;
    DB.followups.push({
      id: DB.nextId('f'),
      tenantId: m.tenantId,
      memberId: mid,
      caregiverId: S.role === 'caregiver' ? S.asCaregiverId : m.caregiverId,
      type: String(f.get('type')),
      occurredAt: at.toISOString(),
      notes,
      nextActionAt: next ? next.toISOString() : null,
    });
    m.nextActionAt = next ? next.toISOString() : null;
    m.spiritualTemperature = String(f.get('temp'));
    if (m.status === 'new') m.status = 'in_progress';
    closeDrawer();
    render();
    toast(`${FTYPE[f.get('type')]} registrada. Próximo contato ${next ? rel(next) : 'sem data'}.`);
  }

  function caregiverDrawer(id) {
    const c = id
      ? caregiverById(id)
      : { name: '', phone: '', email: '', notes: '', active: true, hasCar: false };
    openDrawer(`${drawerHead(id ? esc(c.name) : 'Adicionar cuidador', id ? `${activeMembers(id)} assistidos ativos` : 'Para quem não vai entrar por um canal de cadastro.')}
      <form class="drawer-body" data-form="caregiver" data-id="${id || ''}" id="cg-form" novalidate>
        <label class="field" for="cg-name"><span>Nome *</span><input class="input" id="cg-name" name="name" value="${esc(c.name)}" required autofocus/></label>
        <div class="form-grid"><label class="field" for="cg-phone"><span>Telefone</span><input class="input" id="cg-phone" name="phone" inputmode="tel" value="${esc(c.phone)}"/></label><label class="field" for="cg-email"><span>E-mail</span><input class="input" id="cg-email" name="email" type="email" value="${esc(c.email)}"/></label></div>
        <label class="field" for="cg-notes"><span>Observações</span><textarea class="textarea" id="cg-notes" name="notes">${esc(c.notes)}</textarea></label>
        <label class="check" for="cg-car" style="align-items:center"><input type="checkbox" class="switch" id="cg-car" name="hasCar" ${c.hasCar ? 'checked' : ''}/><span>Tem carro para as saídas</span></label>
        <label class="check" for="cg-active" style="align-items:center"><input type="checkbox" class="switch" id="cg-active" name="active" ${c.active ? 'checked' : ''}/><span>Ativo: pode receber novas pessoas</span></label>
        <p class="err" id="cg-err" role="alert"></p>
      </form>
      <div class="drawer-foot"><button class="btn ghost" data-action="close-drawer">Cancelar</button><button class="btn primary" type="submit" form="cg-form">${id ? 'Salvar' : 'Adicionar'}</button></div>`);
  }

  function channelDrawer() {
    openDrawer(`${drawerHead('Novo canal de cadastro', 'Um link para a equipe entrar sozinha.')}
      <form class="drawer-body" data-form="channel" id="chn-form" novalidate>
        <label class="field" for="chn-name"><span>Nome *</span><input class="input" id="chn-name" name="name" placeholder="Ex.: Equipe de recepção" required autofocus/></label>
        <div class="form-grid"><label class="field" for="chn-max"><span>Limite de usos</span><input class="input" id="chn-max" name="max" type="number" min="1" inputmode="numeric" placeholder="Sem limite"/></label><label class="field" for="chn-exp"><span>Válido até</span><input class="input" id="chn-exp" name="exp" type="date"/></label></div>
        <label class="field" for="chn-dom"><span>Só e-mails do domínio</span><input class="input" id="chn-dom" name="dom" placeholder="${esc(tenant().domain || 'igreja.org.br')}"/><small>Deixe vazio para aceitar qualquer e-mail.</small></label>
        <label class="check" for="chn-appr" style="align-items:center"><input type="checkbox" class="switch" id="chn-appr" name="appr" checked/><span>Aprovar cada cadastro</span></label>
        <p class="err" id="chn-err" role="alert"></p>
      </form>
      <div class="drawer-foot"><button class="btn ghost" data-action="close-drawer">Cancelar</button><button class="btn primary" type="submit" form="chn-form">Criar canal</button></div>`);
  }

  function outingDrawer() {
    const cg = tCaregivers().filter((c) => c.active);
    const ms = tMembers()
      .filter((m) => m.status !== 'inactive')
      .slice(0, 12);
    const sat = new Date(TODAY);
    sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
    sat.setHours(8, 0, 0, 0);
    openDrawer(`${drawerHead('Nova saída', 'Escolha quem vai. Os grupos são montados depois.')}
      <form class="drawer-body" data-form="outing" id="out-form" novalidate>
        <label class="field" for="out-name"><span>Nome *</span><input class="input" id="out-name" name="name" placeholder="Ex.: Saída de sábado em Mangabeira" required autofocus/></label>
        <div class="form-grid"><label class="field" for="out-at"><span>Quando</span><input class="input" id="out-at" type="datetime-local" name="at" value="${toLocalInput(sat)}"/></label><label class="field" for="out-size"><span>Pessoas por grupo</span><input class="input" id="out-size" type="number" min="2" max="6" name="size" value="4"/></label></div>
        <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">Cuidadores</legend>${cg.map((c) => `<label class="check" for="oc-${c.id}"><input type="checkbox" id="oc-${c.id}" name="c" value="${c.id}" checked/><span>${esc(c.name)}${c.hasCar ? ' · tem carro' : ''}</span></label>`).join('') || '<p class="muted">Nenhum cuidador ativo.</p>'}</fieldset>
        <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">Assistidos que vão junto</legend>${ms.map((m) => `<label class="check" for="om-${m.id}"><input type="checkbox" id="om-${m.id}" name="m" value="${m.id}"/><span>${esc(m.name)}</span></label>`).join('') || '<p class="muted">Nenhum assistido.</p>'}</fieldset>
        <p class="err" id="out-err" role="alert"></p>
      </form>
      <div class="drawer-foot"><button class="btn ghost" data-action="close-drawer">Cancelar</button><button class="btn primary" type="submit" form="out-form">Criar saída</button></div>`);
  }

  /* ---------- Toast e tema ---------- */
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${icon('check').replace('<svg', '<svg width="16" height="16"')}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3600);
  }
  const THEMES = ['system', 'light'];
  let theme = 'system';
  try {
    theme = localStorage.getItem('atalaia-theme') || 'system';
  } catch (e) {
    /* armazenamento indisponível */
  }
  function applyTheme() {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }
  const themeLabel = () =>
    ({ system: 'Tema escuro', light: 'Tema claro', dark: 'Tema escuro' })[theme];

  /* ---------- Render e rotas ---------- */
  const ROUTES = {
    inicio: landing,
    comecar: onboarding,
    painel,
    contatos,
    assistidos,
    saidas,
    encontros,
    ajustes,
  };
  const APP = ['painel', 'contatos', 'assistidos', 'saidas', 'encontros', 'ajustes'];
  const ANCHORS = ['cadastro', 'mapa', 'fluxo', 'papeis'];

  function render() {
    const a = document.activeElement;
    const keep =
      a && a.id && !$('#drawer').contains(a)
        ? { id: a.id, s: a.selectionStart, e: a.selectionEnd }
        : null;
    if (S.role === 'caregiver' && !caregiverById(S.asCaregiverId)) {
      const c = tCaregivers().find((x) => x.active);
      if (c) S.asCaregiverId = c.id;
      else S.role = 'coordinator';
    }
    const view = ROUTES[S.route]();
    $('#root').innerHTML = APP.includes(S.route) ? shell(view) : view;
    document.title = {
      inicio: 'Atalaia',
      comecar: 'Criar central · Atalaia',
      painel: 'Painel · Atalaia',
      contatos: 'Contatos · Atalaia',
      assistidos: 'Assistidos · Atalaia',
      saidas: 'Saídas · Atalaia',
      encontros: 'Encontros · Atalaia',
      ajustes: 'Ajustes · Atalaia',
    }[S.route];
    if (keep) {
      const el = document.getElementById(keep.id);
      if (el) {
        el.focus();
        try {
          if (keep.s != null) el.setSelectionRange(keep.s, keep.e);
        } catch (e) {
          /* campos sem seleção */
        }
      }
    }
    if (S.route === 'inicio') window.AtalaiaLanding.start();
    else window.AtalaiaLanding.stop();
  }

  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (ANCHORS.includes(h)) {
      if (S.route !== 'inicio') {
        S.route = 'inicio';
        render();
      }
      const el = document.getElementById(h);
      if (el) el.scrollIntoView();
      return;
    }
    const next = ROUTES[h] ? h : 'inicio';
    const changed = next !== S.route;
    S.route = next;
    if (!$('#drawer-layer').hidden) closeDrawer();
    render();
    if (changed) {
      window.scrollTo(0, 0);
      if (APP.includes(next)) {
        const m = $('#main');
        if (m && document.activeElement === document.body) m.focus({ preventScroll: true });
      }
    }
  }

  /* ---------- Ações ---------- */
  function moveSeed(id, to) {
    const s = seedById(id);
    if (!s || s.status === to) return;
    const from = s.status;
    s.status = to;
    if (to !== 'new' && from === 'new' && !s.lastContactAt) s.lastContactAt = TODAY.toISOString();
    if (to === 'consolidated' || to === 'inactive') s.isUrgent = false;
    render();
    toast(`${firstName(s.referenceName)}: ${SEED_STATUS[from]} → ${SEED_STATUS[to]}.`);
  }

  function convertSeed(id) {
    const s = seedById(id);
    const mid = DB.nextId('m');
    DB.members.push({
      id: mid,
      tenantId: s.tenantId,
      name: s.referenceName,
      phone: s.phone,
      birthDate: toDateInput(new Date(TODAY.getFullYear() - (s.age || 30), 5, 15)),
      city: s.city,
      state: s.state,
      neighborhood: s.neighborhood,
      street: s.street,
      addressNumber: s.addressNumber,
      postalCode: s.postalCode,
      latitude: s.latitude,
      longitude: s.longitude,
      openHouse: s.openHouse,
      spiritualTemperature: 'warm',
      status: 'in_progress',
      caregiverId: s.caregiverId || (tCaregivers()[0] || {}).id,
      seedId: s.id,
      createdAt: TODAY.toISOString(),
      nextActionAt: new Date(TODAY.getTime() + 7 * DAY).toISOString(),
    });
    s.memberId = mid;
    if (s.status === 'in_progress') s.status = 'consolidated';
    render();
    memberDrawer(mid);
    toast(`${firstName(s.referenceName)} agora é assistido.`);
  }

  const actions = {
    scroll: (d, el, ev) => {
      ev.preventDefault();
      const t = document.getElementById(d.to);
      if (t)
        t.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    },
    'landing-map': () => {
      Object.assign(S, { tenantId: 't-jp', role: 'coordinator', seedView: 'mapa', seedChip: '' });
    },
    'landing-q': (d) => {
      Object.assign(S, { tenantId: 't-jp', role: 'coordinator', seedView: 'quadro' });
      if (d.q === 'none') S.seedChip = 'none';
      if (d.q === 'late') S.memberLate = true;
      if (d.q === 'absent') S.meetTab = 'freq';
    },
    'as-role': (d) => {
      Object.assign(S, { tenantId: 't-jp', role: d.role });
      if (d.role === 'caregiver')
        S.asCaregiverId = (tCaregivers().find((c) => c.active) || {}).id || null;
    },
    'onb-back': () => {
      S.onb.step = Math.max(0, S.onb.step - 1);
      render();
    },
    role: (d) => {
      S.role = d.role;
      if (d.role === 'caregiver')
        S.asCaregiverId = (tCaregivers().find((c) => c.active) || {}).id || null;
      S.memberCare = '';
      S.seedChip = '';
      render();
    },
    theme: () => {
      theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
      try {
        localStorage.setItem('atalaia-theme', theme);
      } catch (e) {
        /* armazenamento indisponível */
      }
      applyTheme();
      const l = $('#theme-label');
      if (l) l.textContent = themeLabel();
    },
    'close-drawer': () => closeDrawer(),
    'new-seed': () => personForm('seed'),
    'new-member': () => personForm('member'),
    'open-seed': (d) => seedDrawer(d.id),
    'open-member': (d) => memberDrawer(d.id),
    'new-followup': (d) => followupForm(d.id),
    need: (d) => {
      if (d.kind === 'member')
        return d.act === 'Registrar' ? followupForm(d.id) : memberDrawer(d.id);
      seedDrawer(d.id);
    },
    'seed-move': (d) => {
      moveSeed(d.id, d.to);
      seedDrawer(d.id);
    },
    'seed-inactive': (d) => {
      moveSeed(d.id, 'inactive');
      closeDrawer();
    },
    'seed-contact': (d) => {
      const s = seedById(d.id);
      s.lastContactAt = TODAY.toISOString();
      if (s.status === 'new') s.status = 'contacted';
      render();
      seedDrawer(d.id);
      toast(`Contato com ${firstName(s.referenceName)} registrado hoje.`);
    },
    'seed-convert': (d) => convertSeed(d.id),
    'seed-view': (d) => {
      S.seedView = d.view;
      render();
    },
    'seed-chip': (d, el, ev) => {
      if (el.tagName === 'A') {
        ev.preventDefault();
        S.seedChip = d.chip;
        location.hash = 'contatos';
        return;
      }
      S.seedChip = S.seedChip === d.chip ? '' : d.chip;
      render();
    },
    'seed-status-link': () => {
      S.seedView = 'quadro';
    },
    'seed-clear': () => {
      Object.assign(S, { seedQ: '', seedChip: '', seedSource: '' });
      render();
    },
    'member-temp': (d) => {
      S.memberTemp = d.v;
      render();
    },
    'member-late': () => {
      S.memberLate = !S.memberLate;
      render();
    },
    'member-clear': () => {
      Object.assign(S, {
        memberQ: '',
        memberTemp: '',
        memberStatus: '',
        memberCare: '',
        memberLate: false,
      });
      render();
    },
    'member-set-temp': (d) => {
      memberById(d.id).spiritualTemperature = d.v;
      render();
      memberDrawer(d.id);
      toast(`Temperatura atualizada para ${TEMP[d.v].toLowerCase()}.`);
    },
    'member-set-status': (d) => {
      memberById(d.id).status = d.v;
      render();
      memberDrawer(d.id);
      toast(`Situação: ${MEMBER_STATUS[d.v].toLowerCase()}.`);
    },
    'open-outing': (d, el, ev) => {
      if (el.tagName === 'A') {
        ev.preventDefault();
        S.outingId = d.id;
        location.hash = 'saidas';
        return;
      }
      S.outingId = d.id;
      render();
    },
    'make-groups': (d) => {
      const o = DB.outings.find((x) => x.id === d.id);
      const res = A.makeGroups(o.participants, o.targetGroupSize);
      o.groups = res.groups;
      o.status = res.groups.length ? 'generated' : 'draft';
      render();
      toast(
        res.groups.length
          ? `${plural(res.groups.length, 'grupo montado', 'grupos montados')}${res.unplaced.length ? `, ${res.unplaced.length} sem lugar` : ''}.`
          : 'Ninguém com carro nesta saída. Marque pelo menos um motorista.',
      );
    },
    'confirm-outing': (d) => {
      DB.outings.find((x) => x.id === d.id).status = 'confirmed';
      render();
      toast('Saída confirmada. Os cuidadores recebem o grupo e o horário.');
    },
    'new-outing': () => outingDrawer(),
    'meet-tab': (d) => {
      S.meetTab = d.tab;
      render();
    },
    'meet-type': (d) => {
      S.meetType = d.id;
      render();
    },
    'set-tab': (d, el, ev) => {
      S.setTab = d.tab;
      if (el.tagName === 'A') {
        ev.preventDefault();
        if (S.route !== 'ajustes') return (location.hash = 'ajustes');
      }
      render();
    },
    approve: (d) => {
      const i = DB.pendingSignups.findIndex((p) => p.id === d.id);
      const p = DB.pendingSignups.splice(i, 1)[0];
      DB.caregivers.push({
        id: DB.nextId('c'),
        tenantId: p.tenantId,
        name: p.name,
        phone: p.phone,
        email: p.email,
        active: true,
        notes: `Entrou pelo canal ${p.channel}.`,
        joinedAt: TODAY.toISOString(),
        hasCar: false,
      });
      render();
      toast(`${firstName(p.name)} entrou na equipe.`);
    },
    reject: (d) => {
      const i = DB.pendingSignups.findIndex((p) => p.id === d.id);
      const p = DB.pendingSignups.splice(i, 1)[0];
      render();
      toast(`Pedido de ${firstName(p.name)} recusado.`);
    },
    'edit-caregiver': (d) => caregiverDrawer(d.id),
    'new-channel': () => channelDrawer(),
    copy: (d, el) => {
      const text = $(`#link-${d.id}`).textContent;
      const done = () => toast('Link copiado.');
      const fallback = () => {
        const r = document.createRange();
        r.selectNodeContents($(`#link-${d.id}`));
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        toast('Link selecionado. Use Ctrl+C para copiar.');
      };
      try {
        navigator.clipboard.writeText(text).then(done, fallback);
      } catch (e) {
        fallback();
      }
    },
    'del-source': (d) => {
      const s = settings();
      const [x] = s.sources.splice(+d.k, 1);
      render();
      toast(`Origem “${x}” removida.`);
    },
  };

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    if (
      el.tagName === 'TR' &&
      ev.target.closest('button, a, select, input') &&
      ev.target.closest('button, a, select, input') !== el
    )
      return;
    const fn = actions[el.dataset.action];
    if (fn) fn(el.dataset, el, ev);
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !$('#drawer-layer').hidden) return closeDrawer();
    if (ev.key === 'Tab' && !$('#drawer-layer').hidden) {
      const f = Array.from(
        $('#drawer').querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((x) => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) {
        ev.preventDefault();
        f[f.length - 1].focus();
      } else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) {
        ev.preventDefault();
        f[0].focus();
      }
    }
    if (
      (ev.key === 'Enter' || ev.key === ' ') &&
      ev.target.matches('tr[data-action], circle[data-action]')
    ) {
      ev.preventDefault();
      ev.target.click
        ? ev.target.click()
        : ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });

  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.dataset.onb) {
      S.onb[t.dataset.onb] = t.type === 'checkbox' ? t.checked : t.value;
      return;
    }
    const b = t.dataset.bind;
    if (b === 'seedQ' || b === 'memberQ') {
      S[b] = t.value;
      render();
    }
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target;
    const b = t.dataset.bind;
    if (t.dataset.onb) {
      S.onb[t.dataset.onb] = t.type === 'checkbox' ? t.checked : t.value;
      return;
    }
    if (b === 'tenant') {
      S.tenantId = t.value;
      Object.assign(S, { outingId: null, meetType: null, memberCare: '', seedChip: '' });
      render();
      return toast(`Agora vendo ${tenant().name}.`);
    }
    if (b === 'as-caregiver') {
      S.asCaregiverId = t.value;
      return render();
    }
    if (b === 'seedSource' || b === 'memberStatus' || b === 'memberCare') {
      S[b] = t.value;
      return render();
    }
    if (b === 'seedInactive') {
      S.seedInactive = t.checked;
      return render();
    }
    if (b === 'target-size') {
      DB.outings.find((o) => o.id === t.dataset.id).targetGroupSize = Math.max(
        2,
        Math.min(6, +t.value || 4),
      );
      return render();
    }
    if (t.dataset.seed) {
      const s = seedById(t.dataset.seed);
      if (t.dataset.field === 'caregiverId') {
        s.caregiverId = t.value || null;
        render();
        toast(
          t.value
            ? `${firstName(s.referenceName)} agora está com ${firstName(caregiverById(t.value).name)}.`
            : 'Cuidador removido.',
        );
      } else {
        s.isUrgent = t.checked;
        render();
        toast(t.checked ? 'Marcado como urgente.' : 'Urgência removida.');
      }
      return;
    }
    if (t.dataset.member) {
      const m = memberById(t.dataset.member);
      m.caregiverId = t.value;
      render();
      return toast(
        `${firstName(m.name)} agora está com ${firstName(caregiverById(t.value).name)}.`,
      );
    }
    const key = t.dataset.set;
    if (!key) return;
    const val =
      t.type === 'checkbox'
        ? t.checked
        : t.type === 'number'
          ? Math.max(+t.min || 0, +t.value || 0)
          : t.value;
    if (key === 'tenant.name' && val.trim()) tenant().name = val.trim();
    if (key === 'tenant.city') tenant().city = val;
    if (key === 'tenant.status') {
      if (!val && DB.tenants.filter((x) => x.status === 'active').length === 1) {
        t.checked = true;
        return toast('Mantenha pelo menos uma igreja ativa na rede.');
      }
      tenant().status = val ? 'active' : 'inactive';
      if (!val) S.tenantId = DB.tenants.find((x) => x.status === 'active').id;
    }
    if (key.startsWith('settings.')) settings()[key.slice(9)] = val;
    if (key === 'channel.active') DB.signupChannels.find((c) => c.id === t.dataset.id).active = val;
    if (key === 'meeting.active') DB.meetingTypes.find((c) => c.id === t.dataset.id).active = val;
    if (key === 'caregiver.hasCar') caregiverById(t.dataset.id).hasCar = val;
    render();
    toast('Ajuste salvo.');
  });

  document.addEventListener('submit', (ev) => {
    const form = ev.target;
    const kind = form.dataset.form;
    if (!kind) return;
    ev.preventDefault();
    if (kind === 'onb') return onbSubmit();
    if (kind === 'landing-cmd') return landingRegister(form);
    if (kind === 'seed' || kind === 'member') return savePerson(kind, form);
    if (kind === 'followup') return saveFollowup(form);
    const f = new FormData(form);
    if (kind === 'caregiver') {
      const name = String(f.get('name') || '').trim();
      if (!name) return ($('#cg-err').textContent = 'Informe o nome do cuidador.');
      const data = {
        name,
        phone: String(f.get('phone') || ''),
        email: String(f.get('email') || ''),
        notes: String(f.get('notes') || ''),
        hasCar: f.get('hasCar') === 'on',
        active: f.get('active') === 'on',
      };
      if (form.dataset.id) Object.assign(caregiverById(form.dataset.id), data);
      else
        DB.caregivers.push({
          id: DB.nextId('c'),
          tenantId: S.tenantId,
          joinedAt: TODAY.toISOString(),
          ...data,
        });
      closeDrawer();
      render();
      return toast(
        form.dataset.id ? 'Cuidador atualizado.' : `${firstName(name)} entrou na equipe.`,
      );
    }
    if (kind === 'channel') {
      const name = String(f.get('name') || '').trim();
      if (!name)
        return ($('#chn-err').textContent = 'Dê um nome ao canal, como “Equipe de recepção”.');
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 18);
      DB.signupChannels.unshift({
        id: DB.nextId('sc'),
        tenantId: S.tenantId,
        name,
        code: `${S.tenantId.replace(/^t-/, '')}-${slug}`,
        maxUses: f.get('max') ? +f.get('max') : null,
        uses: 0,
        requireApproval: f.get('appr') === 'on',
        allowedEmailDomain: String(f.get('dom') || '')
          .replace(/^@/, '')
          .trim(),
        expiresAt: String(f.get('exp') || ''),
        active: true,
      });
      closeDrawer();
      render();
      return toast('Canal criado. Copie o link e mande para a equipe.');
    }
    if (kind === 'outing') {
      const name = String(f.get('name') || '').trim();
      if (!name) return ($('#out-err').textContent = 'Dê um nome para a saída.');
      const cs = f.getAll('c');
      if (!cs.length) return ($('#out-err').textContent = 'Escolha pelo menos um cuidador.');
      const o = {
        id: DB.nextId('o'),
        tenantId: S.tenantId,
        name,
        scheduledFor: new Date(String(f.get('at'))).toISOString(),
        targetGroupSize: Math.max(2, Math.min(6, +f.get('size') || 4)),
        status: 'draft',
        meetingPoint: 'Estacionamento da igreja',
        participants: [],
        groups: [],
      };
      for (const id of cs) {
        const c = caregiverById(id);
        o.participants.push({
          id: DB.nextId('p'),
          kind: 'caregiver',
          refId: id,
          hasCar: c.hasCar,
          carSeats: c.hasCar ? 4 : 0,
        });
      }
      for (const id of f.getAll('m'))
        o.participants.push({
          id: DB.nextId('p'),
          kind: 'member',
          refId: id,
          hasCar: false,
          carSeats: 0,
        });
      DB.outings.push(o);
      S.outingId = o.id;
      closeDrawer();
      render();
      return toast('Saída criada. Quando a lista fechar, use Montar grupos.');
    }
    if (kind === 'source') {
      const v = $('#new-source').value.trim();
      if (!v) return;
      settings().sources.push(v);
      render();
      return toast(`Origem “${v}” adicionada.`);
    }
    if (kind === 'meeting') {
      const name = $('#mt-name').value.trim();
      if (!name) return;
      DB.meetingTypes.push({
        id: DB.nextId('mt'),
        tenantId: S.tenantId,
        name,
        weekday: +$('#mt-day').value,
        hour: Math.max(0, Math.min(23, +$('#mt-hour').value || 19)),
        kind: 'outro',
        active: true,
      });
      render();
      return toast(`${name} adicionada às reuniões.`);
    }
    if (kind === 'chamber') {
      const name = $('#ch-name').value.trim();
      if (!name) return;
      DB.chambers.push({
        id: DB.nextId('ch'),
        tenantId: S.tenantId,
        name,
        room: $('#ch-room').value.trim() || 'Sala a definir',
        capacity: 8,
      });
      render();
      return toast(`${name} cadastrada.`);
    }
  });

  // Arrastar é atalho: o drawer do contato tem o botão Avançar equivalente.
  document.addEventListener('dragstart', (ev) => {
    const c = ev.target.closest && ev.target.closest('[data-drag]');
    if (!c) return;
    ev.dataTransfer.setData('text/plain', c.dataset.drag);
    ev.dataTransfer.effectAllowed = 'move';
    c.classList.add('dragging');
  });
  document.addEventListener('dragend', (ev) => {
    const c = ev.target.closest && ev.target.closest('[data-drag]');
    if (c) c.classList.remove('dragging');
    document.querySelectorAll('.col.drop').forEach((x) => x.classList.remove('drop'));
  });
  document.addEventListener('dragover', (ev) => {
    const col = ev.target.closest && ev.target.closest('[data-drop]');
    if (!col) return;
    ev.preventDefault();
    document.querySelectorAll('.col.drop').forEach((x) => x !== col && x.classList.remove('drop'));
    col.classList.add('drop');
  });
  document.addEventListener('drop', (ev) => {
    const col = ev.target.closest && ev.target.closest('[data-drop]');
    if (!col) return;
    ev.preventDefault();
    moveSeed(ev.dataTransfer.getData('text/plain'), col.dataset.drop);
  });

  matchMedia('(prefers-reduced-motion: reduce)').addEventListener(
    'change',
    () => S.route === 'inicio' && window.AtalaiaLanding.start(),
  );
  window.addEventListener('hashchange', route);
  applyTheme();
  route();

  // Leitura para testes automatizados; não altera estado.
  window.__atalaia = {
    counts: () => ({
      seeds: DB.seeds.length,
      members: DB.members.length,
      followups: DB.followups.length,
      needs: needs().length,
    }),
    route: () => S.route,
  };
})();
