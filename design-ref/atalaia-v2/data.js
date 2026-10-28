/* Atalaia — dados fictícios e determinísticos da demonstração.
 * Mesmo seed, mesmos dados: os testes e as capturas não dependem do acaso.
 * Nomes, telefones e endereços são inventados; coordenadas são aproximações por bairro. */
(function (root) {
  'use strict';

  const TODAY = new Date('2026-10-27T09:00:00-03:00');
  const DAY = 86400000;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const STATUS_SEED = [
    'new',
    'contacted',
    'waiting_visit',
    'in_progress',
    'consolidated',
    'inactive',
  ];
  const STATUS_MEMBER = ['new', 'in_progress', 'consolidated', 'inactive'];
  const FOLLOWUP_TYPES = ['visit', 'call', 'message', 'prayer', 'other'];

  const WOMEN = [
    'Maria',
    'Ana',
    'Francisca',
    'Antônia',
    'Luzia',
    'Conceição',
    'Josefa',
    'Rita',
    'Joana',
    'Damiana',
    'Lúcia',
    'Socorro',
    'Fátima',
    'Raquel',
    'Débora',
    'Priscila',
    'Larissa',
    'Beatriz',
    'Vitória',
    'Edileuza',
    'Marinalva',
    'Cícera',
    'Rosilene',
    'Gabriela',
  ];
  const MEN = [
    'José',
    'João',
    'Pedro',
    'Francisco',
    'Raimundo',
    'Severino',
    'Antônio',
    'Manoel',
    'Cícero',
    'Damião',
    'Expedito',
    'Joaquim',
    'Luiz',
    'Paulo',
    'Rafael',
    'Gustavo',
    'Thiago',
    'Matheus',
    'Edson',
    'Valdir',
    'Jailson',
    'Wellington',
    'Davi',
    'Samuel',
  ];
  const SURNAMES = [
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Lima',
    'Pereira',
    'Ferreira',
    'Alves',
    'Araújo',
    'Barbosa',
    'Cavalcanti',
    'Nóbrega',
    'Medeiros',
    'Dantas',
    'Lucena',
    'Queiroga',
    'Wanderley',
    'Diniz',
    'Bezerra',
    'Galdino',
    'Batista',
    'Brito',
    'Macêdo',
    'Fernandes',
    'Costa',
    'Andrade',
  ];

  const CITIES = {
    'João Pessoa': {
      cep: [58030, 58090],
      ddd: 83,
      hoods: [
        [
          'Mangabeira',
          -7.171,
          -34.838,
          ['Av. Josefa Taveira', 'Rua Hilton Souto Maior', 'Rua Joaquim Moreira'],
        ],
        [
          'Bairro dos Estados',
          -7.105,
          -34.853,
          ['Av. Paraíba', 'Rua Rio Grande do Norte', 'Rua Alagoas'],
        ],
        [
          'Tambiá',
          -7.113,
          -34.884,
          ['Rua Visconde de Pelotas', 'Rua das Trincheiras', 'Rua Odon Bezerra'],
        ],
        [
          'Cristo Redentor',
          -7.146,
          -34.871,
          ['Av. Dois de Fevereiro', 'Rua Projetada A', 'Rua Clóvis Bevilácqua'],
        ],
        ['Água Fria', -7.139, -34.843, ['Rua Severino Nicolau de Melo', 'Rua Josita Almeida']],
        ['Torre', -7.124, -34.86, ['Av. Júlia Freire', 'Rua Odilon Coutinho', 'Rua Silvino Lopes']],
        ['Altiplano', -7.127, -34.825, ['Av. Panorâmica', 'Rua Celestino Cavalcanti']],
        [
          'Bancários',
          -7.147,
          -34.841,
          ['Rua Bancário Sérgio Guerra', 'Rua Walfredo Macedo Brandão'],
        ],
        ['Anatólia', -7.143, -34.833, ['Rua José Firmino Ferreira', 'Rua Antônio Rabelo Júnior']],
      ],
    },
    'Campina Grande': {
      cep: [58400, 58435],
      ddd: 83,
      hoods: [
        ['Centro', -7.219, -35.881, ['Rua Maciel Pinheiro', 'Rua Venâncio Neiva']],
        ['Catolé', -7.24, -35.874, ['Rua Rodrigues Alves', 'Av. Severino Cruz']],
        ['Liberdade', -7.242, -35.897, ['Rua Fernandes Vieira', 'Rua Pedro II']],
        ['Bodocongó', -7.219, -35.918, ['Rua Aprígio Veloso', 'Rua Baraúnas']],
        ['Malvinas', -7.235, -35.922, ['Rua Rio Grande do Sul', 'Rua Ceará']],
        ['Prata', -7.214, -35.89, ['Rua Duque de Caxias', 'Rua Getúlio Vargas']],
      ],
    },
    Patos: {
      cep: [58700, 58708],
      ddd: 83,
      hoods: [
        ['Centro', -7.024, -37.279, ['Rua Pedro Firmino', 'Rua Horácio Nóbrega']],
        ['Jatobá', -7.033, -37.27, ['Rua Bossuet Wanderley', 'Rua Epitácio Pessoa']],
        ['Belo Horizonte', -7.016, -37.285, ['Rua Leôncio Wanderley', 'Rua José Genuíno']],
        ['Santo Antônio', -7.03, -37.288, ['Rua Rui Barbosa', 'Rua Solon de Lucena']],
      ],
    },
  };

  const SOURCES = [
    'Culto dominical',
    'Casa aberta',
    'Indicação de membro',
    'Saída missionária',
    'Redes sociais',
    'Busca espontânea',
  ];

  const SEED_NOTES = [
    'Pessoa receptiva, aberta ao diálogo.',
    'Frequentou o culto pela primeira vez com a vizinha.',
    'Família numerosa, necessidades básicas. Avaliar apoio com cesta.',
    'Pediu para ser chamada só à noite, trabalha no comércio.',
    'Mora com a mãe idosa; prefere visita no sábado de manhã.',
    'Chegou pelo Instagram depois da live de quarta.',
    'Mudou de cidade há pouco e procura uma igreja perto de casa.',
    'Solicitou oração pela saúde da esposa.',
    'Jovem universitário, interesse em célula de jovens.',
    'Recebeu a equipe na saída de sábado e pediu retorno.',
  ];

  const FOLLOWUP_NOTES = {
    visit: [
      'Visita feita com a família reunida. Oramos juntos e ficou o convite para a célula.',
      'Casa aberta para a próxima saída. Ofereceu a sala para reunir os vizinhos.',
      'Encontramos só o filho; deixamos recado e o folheto da igreja.',
      'Família numerosa, necessidades básicas. Encaminhado para a ação social.',
      'Conversa longa sobre o luto do pai. Voltar em uma semana.',
    ],
    call: [
      'Ligação rápida, pessoa receptiva, confirmou presença no domingo.',
      'Não atendeu. Mensagem de voz deixada.',
      'Contou que arrumou emprego; agradeceu as orações.',
      'Pediu para remarcar a visita para depois do dia 5.',
    ],
    message: [
      'Enviado o horário da célula de quarta pelo WhatsApp.',
      'Respondeu a mensagem com áudio, está animado para o culto de jovens.',
      'Mandamos o link da transmissão; ela está acamada esta semana.',
    ],
    prayer: [
      'Solicitou oração pela saúde da esposa.',
      'Oração pela entrevista de emprego na segunda.',
      'Oração pela reconciliação com o irmão.',
    ],
    other: [
      'Levou a filha para a EBD infantil pela primeira vez.',
      'Participou do mutirão na casa da Dona Luzia.',
    ],
  };

  function iso(d) {
    return new Date(d).toISOString();
  }

  function build(seed) {
    const r = rng(seed || 20261027);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const int = (min, max) => min + Math.floor(r() * (max - min + 1));
    const chance = (p) => r() < p;
    const weighted = (pairs) => {
      const total = pairs.reduce((s, p) => s + p[1], 0);
      let x = r() * total;
      for (const [v, w] of pairs) {
        if ((x -= w) <= 0) return v;
      }
      return pairs[pairs.length - 1][0];
    };
    const daysAgo = (n, hour) => {
      const d = new Date(TODAY.getTime() - n * DAY);
      d.setHours(hour == null ? int(8, 20) : hour, int(0, 11) * 5, 0, 0);
      if (d > TODAY) d.setTime(d.getTime() - DAY);
      return d;
    };
    const used = new Set();
    const person = () => {
      for (;;) {
        const woman = chance(0.56);
        const first = pick(woman ? WOMEN : MEN);
        const a = pick(SURNAMES);
        let b = pick(SURNAMES);
        if (b === a) b = pick(SURNAMES);
        const name = `${first} ${a} ${b}`;
        if (!used.has(name)) {
          used.add(name);
          return { name, woman };
        }
      }
    };
    const phone = (ddd) =>
      `(${ddd}) 9${int(8, 9)}${int(100, 999)}-${String(int(0, 9999)).padStart(4, '0')}`;
    const address = (city) => {
      const c = CITIES[city];
      const [hood, lat, lng, streets] = pick(c.hoods);
      return {
        city,
        state: 'PB',
        neighborhood: hood,
        street: pick(streets),
        addressNumber: String(int(12, 1890)),
        postalCode: `${int(c.cep[0], c.cep[1])}-${String(int(0, 999)).padStart(3, '0')}`,
        latitude: +(lat + (r() - 0.5) * 0.006).toFixed(5),
        longitude: +(lng + (r() - 0.5) * 0.006).toFixed(5),
      };
    };

    const tenants = [
      {
        id: 't-jp',
        name: 'Igreja Central João Pessoa',
        short: 'João Pessoa',
        city: 'João Pessoa',
        state: 'PB',
        status: 'active',
        domain: 'centraljp.org.br',
        createdAt: '2025-03-02',
        size: [8, 46, 38],
      },
      {
        id: 't-cg',
        name: 'Igreja Central Campina Grande',
        short: 'Campina Grande',
        city: 'Campina Grande',
        state: 'PB',
        status: 'active',
        domain: 'centralcg.org.br',
        createdAt: '2025-06-15',
        size: [6, 30, 24],
      },
      {
        id: 't-pt',
        name: 'Igreja Central Patos',
        short: 'Patos',
        city: 'Patos',
        state: 'PB',
        status: 'active',
        domain: 'centralpatos.org.br',
        createdAt: '2026-01-20',
        size: [4, 18, 12],
      },
      {
        id: 't-cz',
        name: 'Igreja Central Cajazeiras',
        short: 'Cajazeiras',
        city: 'Cajazeiras',
        state: 'PB',
        status: 'inactive',
        domain: 'centralcajazeiras.org.br',
        createdAt: '2026-08-04',
        size: [0, 0, 0],
      },
    ];

    const users = [];
    const caregivers = [];
    const seeds = [];
    const members = [];
    const followups = [];
    const outings = [];
    const chambers = [];
    const tciSessions = [];
    const meetingTypes = [];
    const occurrences = [];
    const memberships = [];
    const attendance = [];
    const signupChannels = [];
    const pendingSignups = [];
    const settings = {};
    let n = 0;
    const id = (p) => `${p}-${(++n).toString(36)}`;

    for (const t of tenants) {
      settings[t.id] = {
        staleDays: 7,
        newWithoutCaregiverDays: 2,
        capacity: 7,
        urgentFirst: true,
        sources: SOURCES.slice(),
        notifyDaily: true,
        notifyUrgent: true,
      };
      if (t.status !== 'active') continue;
      const city = CITIES[t.city];
      const [nCare, nSeed, nMember] = t.size;

      const coord = person();
      users.push({
        id: id('u'),
        tenantId: t.id,
        name: coord.name,
        role: 'coordinator',
        email: `coordenacao@${t.domain}`,
      });

      const tCare = [];
      for (let i = 0; i < nCare; i++) {
        const p = person();
        const first = p.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const c = {
          id: id('c'),
          tenantId: t.id,
          name: p.name,
          phone: phone(city.ddd),
          email: `${first}.${int(10, 99)}@${chance(0.5) ? 'gmail.com' : t.domain}`,
          active: i < nCare - 1 || nCare < 5,
          notes: pick([
            'Tem carro; disponível aos sábados.',
            'Prefere ligações à noite.',
            'Líder de célula em ' + pick(city.hoods)[0] + '.',
            'Acompanha famílias com crianças pequenas.',
            '',
          ]),
          joinedAt: iso(daysAgo(int(60, 420), 10)),
          hasCar: chance(0.55),
        };
        caregivers.push(c);
        tCare.push(c);
      }
      const activeCare = tCare.filter((c) => c.active);

      for (let i = 0; i < nSeed; i++) {
        const p = person();
        const status = weighted([
          ['new', 20],
          ['contacted', 22],
          ['waiting_visit', 18],
          ['in_progress', 20],
          ['consolidated', 12],
          ['inactive', 8],
        ]);
        const order = STATUS_SEED.indexOf(status);
        const first = status === 'new' ? int(0, 9) : int(4 + order * 6, 18 + order * 12);
        const firstAt = daysAgo(Math.min(first, 88));
        const isUrgent = status !== 'consolidated' && status !== 'inactive' && chance(0.13);
        const assigned = status === 'new' ? chance(isUrgent ? 0.3 : 0.45) : chance(0.96);
        const sinceFirst = Math.max(0, Math.round((TODAY - firstAt) / DAY));
        const lastContact =
          status === 'new'
            ? null
            : daysAgo(Math.max(0, int(0, Math.min(sinceFirst, status === 'inactive' ? 60 : 16))));
        seeds.push({
          id: id('s'),
          tenantId: t.id,
          referenceName: p.name,
          age: int(16, 78),
          phone: phone(city.ddd),
          ...address(t.city),
          openHouse: chance(0.24),
          source: pick(SOURCES),
          status,
          isUrgent,
          firstContactAt: iso(firstAt),
          lastContactAt: lastContact ? iso(lastContact) : null,
          caregiverId: assigned ? pick(activeCare).id : null,
          notes: pick(SEED_NOTES),
          memberId: null,
        });
      }

      const firstNew = seeds.find((s) => s.tenantId === t.id && s.status === 'new');
      if (firstNew) Object.assign(firstNew, { isUrgent: true, caregiverId: null });

      const tMembers = [];
      const convertible = seeds.filter(
        (s) => s.tenantId === t.id && (s.status === 'consolidated' || s.status === 'in_progress'),
      );
      for (let i = 0; i < nMember; i++) {
        const fromSeed = i < convertible.length && chance(0.7) ? convertible[i] : null;
        const p = fromSeed ? { name: fromSeed.referenceName } : person();
        const addr = fromSeed
          ? {
              city: fromSeed.city,
              state: fromSeed.state,
              neighborhood: fromSeed.neighborhood,
              street: fromSeed.street,
              addressNumber: fromSeed.addressNumber,
              postalCode: fromSeed.postalCode,
              latitude: fromSeed.latitude,
              longitude: fromSeed.longitude,
            }
          : address(t.city);
        const age = fromSeed ? fromSeed.age : int(18, 80);
        const birth = new Date(TODAY.getFullYear() - age, int(0, 11), int(1, 28));
        const status = weighted([
          ['new', 14],
          ['in_progress', 46],
          ['consolidated', 32],
          ['inactive', 8],
        ]);
        const temp =
          status === 'consolidated'
            ? weighted([
                ['hot', 6],
                ['warm', 3],
                ['cold', 1],
              ])
            : status === 'inactive'
              ? 'cold'
              : weighted([
                  ['hot', 2],
                  ['warm', 5],
                  ['cold', 3],
                ]);
        const m = {
          id: id('m'),
          tenantId: t.id,
          name: p.name,
          phone: fromSeed ? fromSeed.phone : phone(city.ddd),
          birthDate: birth.toISOString().slice(0, 10),
          ...addr,
          openHouse: fromSeed ? fromSeed.openHouse : chance(0.2),
          spiritualTemperature: temp,
          status,
          caregiverId: (fromSeed && fromSeed.caregiverId) || pick(activeCare).id,
          seedId: fromSeed ? fromSeed.id : null,
          createdAt: iso(daysAgo(int(10, 160), 10)),
          nextActionAt: null,
        };
        if (fromSeed) fromSeed.memberId = m.id;
        members.push(m);
        tMembers.push(m);

        const count = status === 'inactive' ? int(1, 2) : int(2, 7);
        const age0 = Math.round((TODAY - new Date(m.createdAt)) / DAY);
        let at = status === 'inactive' ? int(30, 60) : int(0, 9);
        const fs = [];
        for (let k = 0; k < count && at <= age0; k++) {
          const type = weighted([
            ['visit', 4],
            ['call', 4],
            ['message', 3],
            ['prayer', 2],
            ['other', 1],
          ]);
          fs.unshift({
            id: id('f'),
            tenantId: t.id,
            memberId: m.id,
            caregiverId: chance(0.9) ? m.caregiverId : pick(activeCare).id,
            type,
            occurredAt: iso(daysAgo(at)),
            notes: pick(FOLLOWUP_NOTES[type]),
            nextActionAt: null,
          });
          at += int(3, 16);
        }
        fs.forEach((f, k) => {
          const next = fs[k + 1];
          f.nextActionAt = next
            ? next.occurredAt
            : status === 'inactive'
              ? null
              : iso(new Date(new Date(f.occurredAt).getTime() + int(2, 14) * DAY));
        });
        const last = fs[fs.length - 1];
        m.nextActionAt = last ? last.nextActionAt : null;
        followups.push(...fs);
      }

      // Saídas: uma passada confirmada, uma montada e uma em rascunho.
      const outingDefs = [
        ['Saída de sábado — ' + city.hoods[0][0], 4, 'draft', 4],
        ['Visitas em ' + city.hoods[1][0], 11, 'generated', 3],
        ['Saída missionária de outubro', -10, 'confirmed', 4],
      ];
      for (const [name, inDays, status, size] of outingDefs) {
        const o = {
          id: id('o'),
          tenantId: t.id,
          name,
          scheduledFor: iso(new Date(TODAY.getTime() + inDays * DAY).setHours(8, 0, 0, 0)),
          targetGroupSize: size,
          status,
          meetingPoint: 'Estacionamento da igreja',
          participants: [],
          groups: [],
        };
        const pool = activeCare.slice(0, Math.min(activeCare.length, int(3, 6)));
        for (const c of pool)
          o.participants.push({
            id: id('p'),
            kind: 'caregiver',
            refId: c.id,
            hasCar: c.hasCar,
            carSeats: c.hasCar ? int(3, 4) : 0,
          });
        const extra = tMembers.filter((m) => m.status !== 'inactive').slice(0, int(5, 9));
        for (const m of extra)
          o.participants.push({
            id: id('p'),
            kind: 'member',
            refId: m.id,
            hasCar: chance(0.25),
            carSeats: 3,
          });
        outings.push(o);
      }

      // TCI: câmaras e sessões das próximas duas semanas.
      const chamberNames = ['Câmara Siloé', 'Câmara Betel', 'Câmara Ebenézer'];
      const tChambers = chamberNames.slice(0, t.id === 't-pt' ? 2 : 3).map((name, k) => {
        const ch = {
          id: id('ch'),
          tenantId: t.id,
          name,
          room: `Sala ${k + 2}`,
          capacity: int(6, 12),
        };
        chambers.push(ch);
        return ch;
      });
      for (let d = -6; d <= 13; d++) {
        const day = new Date(TODAY.getTime() + d * DAY);
        if (![2, 4, 6].includes(day.getDay())) continue;
        for (const ch of tChambers) {
          if (chance(0.35)) continue;
          const start = new Date(day);
          start.setHours(day.getDay() === 6 ? 15 : 19, day.getDay() === 6 ? 0 : 30, 0, 0);
          const cg = activeCare
            .slice()
            .sort(() => r() - 0.5)
            .slice(0, 2);
          tciSessions.push({
            id: id('tci'),
            tenantId: t.id,
            chamberId: ch.id,
            startsAt: iso(start),
            durationMin: pick([60, 75, 90]),
            caregiverIds: cg.map((c) => c.id),
            memberId: pick(tMembers).id,
            status: d < 0 ? (chance(0.85) ? 'done' : 'missed') : 'scheduled',
          });
        }
      }

      // Frequência: culto, célula e EBD nas últimas seis semanas.
      const types = [
        { name: 'Culto de domingo', weekday: 0, hour: 18, kind: 'culto' },
        { name: 'Célula de quarta', weekday: 3, hour: 19, kind: 'celula' },
        { name: 'Escola Bíblica (EBD)', weekday: 0, hour: 9, kind: 'ebd' },
      ].map((x) => {
        const mt = { id: id('mt'), tenantId: t.id, ...x, active: true };
        meetingTypes.push(mt);
        return mt;
      });
      const tMemberships = tMembers
        .filter((m) => m.status !== 'new' || chance(0.4))
        .map((m) => {
          const ms = {
            id: id('ms'),
            tenantId: t.id,
            memberId: m.id,
            since: iso(new Date(m.createdAt)),
            official: m.status === 'consolidated',
          };
          memberships.push(ms);
          return ms;
        });
      for (const mt of types) {
        for (let w = 5; w >= 0; w--) {
          const d = new Date(TODAY);
          d.setDate(d.getDate() - ((d.getDay() - mt.weekday + 7) % 7) - w * 7);
          if (d > TODAY) continue;
          d.setHours(mt.hour, 0, 0, 0);
          const occ = { id: id('oc'), tenantId: t.id, meetingTypeId: mt.id, date: iso(d) };
          occurrences.push(occ);
          for (const ms of tMemberships) {
            const m = members.find((x) => x.id === ms.memberId);
            const base = { hot: 0.86, warm: 0.6, cold: 0.28 }[m.spiritualTemperature];
            const p = mt.kind === 'culto' ? base : base * 0.7;
            attendance.push({ occurrenceId: occ.id, memberId: m.id, present: chance(p) });
          }
        }
      }

      signupChannels.push(
        {
          id: id('sc'),
          tenantId: t.id,
          name: 'Equipe de domingo',
          code: `${t.id.slice(2)}-dom-${int(100, 999)}`,
          maxUses: 20,
          uses: int(4, 12),
          requireApproval: true,
          allowedEmailDomain: '',
          expiresAt: '2026-12-31',
          active: true,
        },
        {
          id: id('sc'),
          tenantId: t.id,
          name: 'Líderes de célula',
          code: `${t.id.slice(2)}-cel-${int(100, 999)}`,
          maxUses: null,
          uses: int(2, 6),
          requireApproval: false,
          allowedEmailDomain: t.domain,
          expiresAt: '',
          active: true,
        },
        {
          id: id('sc'),
          tenantId: t.id,
          name: 'Mutirão de setembro',
          code: `${t.id.slice(2)}-set-${int(100, 999)}`,
          maxUses: 15,
          uses: 15,
          requireApproval: true,
          allowedEmailDomain: '',
          expiresAt: '2026-09-30',
          active: false,
        },
      );
      for (let i = 0; i < (t.id === 't-jp' ? 2 : 1); i++) {
        const p = person();
        pendingSignups.push({
          id: id('ps'),
          tenantId: t.id,
          name: p.name,
          email:
            p.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@gmail.com',
          phone: phone(city.ddd),
          channel: 'Equipe de domingo',
          requestedAt: iso(daysAgo(int(0, 3))),
        });
      }
    }

    return {
      today: TODAY,
      tenants,
      users,
      caregivers,
      seeds,
      members,
      followups,
      outings,
      chambers,
      tciSessions,
      meetingTypes,
      occurrences,
      memberships,
      attendance,
      signupChannels,
      pendingSignups,
      settings,
      sources: SOURCES,
      cities: Object.keys(CITIES).concat(['Cajazeiras', 'Sousa', 'Santa Rita', 'Bayeux']),
      nextId: id,
    };
  }

  /** Monta grupos por carro: cada motorista abre um grupo; os demais são distribuídos
   * mantendo pelo menos um cuidador por grupo quando possível. Puro e testável. */
  function makeGroups(participants, targetSize) {
    const drivers = participants.filter((p) => p.hasCar && p.carSeats > 0);
    const rest = participants.filter((p) => !(p.hasCar && p.carSeats > 0));
    const groups = drivers.map((d) => ({ driverId: d.id, seats: d.carSeats + 1, ids: [d.id] }));
    const unplaced = [];
    if (!groups.length) return { groups: [], unplaced: participants.map((p) => p.id) };
    const caregiversFirst = rest
      .slice()
      .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'caregiver' ? -1 : 1));
    for (const p of caregiversFirst) {
      const open = groups
        .filter((g) => g.ids.length < Math.min(g.seats, targetSize))
        .sort((a, b) => a.ids.length - b.ids.length);
      const needsCaregiver = open.find(
        (g) => !g.ids.some((x) => participants.find((q) => q.id === x).kind === 'caregiver'),
      );
      const target = p.kind === 'caregiver' && needsCaregiver ? needsCaregiver : open[0];
      if (target) target.ids.push(p.id);
      else unplaced.push(p.id);
    }
    return { groups, unplaced };
  }

  const api = { TODAY, DAY, build, makeGroups, STATUS_SEED, STATUS_MEMBER, FOLLOWUP_TYPES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AtalaiaData = api;
})(typeof window !== 'undefined' ? window : globalThis);
