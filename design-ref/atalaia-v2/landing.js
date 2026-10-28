/* Atalaia v2 — landing por seções. Cada seção corresponde a uma seção do brief
 * (hero, rede, cadastro, mapa, fluxo, papeis, fechamento) e a um checkpoint.
 * Recebe do app os dados e as ações; não guarda estado próprio além dos timers. */
(function () {
  'use strict';

  const WORDS = ['Acolhimento', 'Visitas', 'Cuidado', 'Consolidação'];
  let timers = [];
  let observer = null;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function nav(c) {
    return `<header class="l-nav"><div class="l-wrap">
      ${c.brand}
      <nav aria-label="Principal">
        <a href="#cadastro" data-action="scroll" data-to="cadastro">Como funciona</a>
        <a href="#mapa" data-action="scroll" data-to="mapa">Mapa</a>
        <a href="#fluxo" data-action="scroll" data-to="fluxo">Privacidade</a>
        <a href="#papeis" data-action="scroll" data-to="papeis">Para quem</a>
      </nav>
      <div class="right"><a class="l-btn" href="#painel">Abrir demonstração</a><a class="l-btn fill" href="#comecar">Criar central</a></div>
    </div></header>`;
  }

  function cmd(c, id) {
    return `<form class="l-cmd" data-form="landing-cmd" aria-label="Cadastrar uma pessoa nova">
        <label class="sr" for="${id}-src">Como chegou</label>
        <select id="${id}-src" name="source">${c.sources.map((s) => `<option>${c.esc(s)}</option>`).join('')}</select>
        <label class="sr" for="${id}-who">Nome, telefone e bairro</label>
        <input id="${id}-who" name="who" autocomplete="off" placeholder="Nome · (83) 9…  · bairro" value="Francisca Araújo · (83) 99812-4410 · Mangabeira" />
        <button type="submit">Cadastrar${c.icon('arrow')}</button>
      </form>`;
  }

  function frame(c) {
    const s = c.snapshot();
    const max = Math.max(1, ...s.funnel.map((f) => f[1]));
    return `<div id="hero-frame" role="img" aria-label="Painel da coordenação com ${s.needs.length} pessoas esperando alguém">
      <div class="mf-bar" aria-hidden="true"><i></i><i></i><i></i><span>atalaia · ${c.esc(s.tenant)}</span></div>
      <div class="mf" aria-hidden="true">
        <div class="mf-side"><b>${c.esc(s.tenant)}</b><span class="on">Painel <em>${s.needsCount}</em></span><span>Contatos</span><span>Assistidos</span><span>Saídas</span><span>Encontros</span><span>Ajustes</span></div>
        <div class="mf-main">
          <div class="mf-head"><h3>Bom dia, ${c.esc(s.first)}</h3><small>${c.esc(s.date)}</small></div>
          <div class="mf-kpis">${s.kpis.map(([l, v, a]) => `<div><small>${l}</small><b class="${a ? 'alert' : ''}">${v}</b></div>`).join('')}</div>
          <div class="mf-cols">
            <div class="mf-box"><small>Precisa de alguém</small>${s.needs.map((n) => `<div class="mf-row"><i class="${n.sev === 3 ? 'hi' : ''}"></i><span>${c.esc(n.name)} <small>· ${c.esc(n.reason)}</small></span><em>${c.esc(n.action)}</em></div>`).join('')}</div>
            <div class="mf-box"><small>Jornada</small><div class="mf-bars">${s.funnel.map(([l, v]) => `<div><span>${c.esc(l)}</span><u><b style="width:${(v / max) * 100}%"></b></u><span>${v}</span></div>`).join('')}</div></div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function hero(c) {
    return `<section class="l-hero" id="hero" aria-labelledby="hero-h">
      <div class="l-wrap l-hero-copy">
        <h1 id="hero-h"><span class="sr">Acolhimento, visitas, cuidado e consolidação sem ninguém esquecido.</span><span aria-hidden="true"><span class="word" id="hero-word">${WORDS[0]}</span><span id="hero-cursor">_</span><br />sem ninguém esquecido.</span></h1>
        <p class="lead">Do primeiro culto à célula: cada pessoa nova tem um cuidador, uma próxima visita marcada e uma coordenação que vê a igreja inteira.</p>
        <div class="l-hero-row">
          <div class="l-hero-left">
            ${cmd(c, 'hc')}
            <p class="l-cmd-err" id="hc-err" role="alert"></p>
            <div class="l-cmd-note"><span class="dot" aria-hidden="true"></span><span class="l-label">Cadastre na recepção · o cuidador recebe no celular</span></div>
          </div>
          <div class="l-side">
            <div class="l-roles">
              <a href="#painel" data-action="as-role" data-role="coordinator" aria-label="Ver como coordenação">${c.icon('painel')}</a>
              <a href="#painel" data-action="as-role" data-role="caregiver" aria-label="Ver como cuidador">${c.icon('call')}</a>
              <a href="#contatos" data-action="as-role" data-role="coordinator" aria-label="Ver o quadro de contatos">${c.icon('contatos')}</a>
            </div>
            <span class="l-label">Abrir a demonstração</span>
          </div>
        </div>
      </div>
      <div class="l-dawn" aria-hidden="true"><i class="glow"></i><i class="drift"></i><i class="veil"></i><i class="rim"></i></div>
      <div class="l-wrap l-frame-wrap">${frame(c)}</div>
    </section>`;
  }

  // Palavra que troca: apaga e escreve letra a letra; com movimento reduzido fica fixa.
  function typeLoop() {
    const el = document.getElementById('hero-word');
    if (!el || reduced()) return;
    let w = 0;
    const erase = () => {
      const t = el.textContent;
      if (!document.body.contains(el)) return;
      if (t.length) {
        el.textContent = t.slice(0, -1);
        later(erase, 45);
      } else {
        w = (w + 1) % WORDS.length;
        later(type, 220);
      }
    };
    const type = () => {
      const target = WORDS[w];
      if (!document.body.contains(el)) return;
      if (el.textContent.length < target.length) {
        el.textContent = target.slice(0, el.textContent.length + 1);
        later(type, 75);
      } else later(erase, 2600);
    };
    later(erase, 2600);
  }

  function rede(c) {
    const items = c.network
      .map(
        (t) =>
          `<li><b>${c.esc(t.name)}</b><span>${c.esc(t.city)}/PB · ${t.seeds} em jornada · ${t.care} cuidadores</span></li>`,
      )
      .join('');
    // A faixa é duplicada para o loop; a cópia fica escondida de leitores de tela.
    return `<section class="l-rede" id="rede" aria-label="Igrejas da rede de demonstração"><div class="l-marquee"><ul>${items}${items}</ul><ul aria-hidden="true">${items}${items}</ul></div></section>`;
  }

  const ROLE_STEPS = {
    recepcao: [
      ['Passo 1', 'Abrir Novo contato no celular da recepção', '#contatos'],
      [
        'Passo 2',
        'Nome, telefone e bairro; marcar urgente se precisar de ligação hoje',
        '#contatos',
      ],
      ['Passo 3', 'Pronto: a pessoa entra em Novos e a coordenação é avisada', '#painel'],
    ],
    coordenacao: [
      ['Passo 1', 'Abrir Precisa de alguém no painel, todo dia de manhã', '#painel'],
      ['Passo 2', 'Atribuir um cuidador olhando a carga de cada um', '#painel'],
      ['Passo 3', 'Montar a saída de sábado: os grupos por carro saem prontos', '#saidas'],
    ],
    cuidador: [
      ['Passo 1', 'Ver Minhas próximas ações com telefone e endereço', '#painel'],
      ['Passo 2', 'Registrar visita, ligação ou oração depois do encontro', '#assistidos'],
      ['Passo 3', 'Marcar a data do próximo contato antes de salvar', '#assistidos'],
    ],
  };
  const steps = (c, role) =>
    ROLE_STEPS[role]
      .map(
        ([l, t, h]) =>
          `<li><span class="l-label">${l}</span><p>${c.esc(t)}</p><a href="${h}" aria-label="Abrir no app: ${c.esc(t)}">${c.icon('arrow')}</a></li>`,
      )
      .join('');

  const MODULES = [
    [
      'contatos',
      'contatos',
      'Quadro, lista e mapa de quem chegou, do primeiro culto à consolidação.',
    ],
    [
      'assistidos',
      'assistidos',
      'Linha do tempo de cada pessoa: visitas, ligações e pedidos de oração.',
    ],
    ['saidas', 'saidas', 'Saídas de sábado com grupos por carro e pelo menos um cuidador em cada.'],
    ['encontros', 'encontros', 'Frequência de culto, célula e EBD; sessões nas câmaras de TCI.'],
    ['ajustes', 'canais', 'Links de cadastro para a equipe, com limite, domínio e aprovação.'],
    ['painel', 'painel', 'A fila de quem precisa de alguém hoje, antes de qualquer gráfico.'],
  ];

  function cadastro(c) {
    const q = c.questions();
    return `<section class="l-framed" id="cadastro" aria-labelledby="cad-h"><div class="l-col"><div class="l-inner">
      <div class="l-split">
        <div>
          <h2 class="l-h2" id="cad-h">Cadastre na recepção. Cuide pelo celular.</h2>
          <p class="l-p">A recepção usa <span class="l-code">Novo contato</span> e a pessoa já entra no quadro. O cuidador abre <span class="l-code">Registrar acompanhamento</span> depois de cada visita e marca a próxima antes de salvar.</p>
          <div class="l-links">
            <span class="l-label" style="width:100%">Ver como</span>
            <div class="l-roles">
              <a href="#painel" data-action="as-role" data-role="coordinator" aria-label="Ver como coordenação">${c.icon('painel')}</a>
              <a href="#painel" data-action="as-role" data-role="caregiver" aria-label="Ver como cuidador">${c.icon('call')}</a>
              <a href="#contatos" data-action="as-role" data-role="coordinator" aria-label="Ver o quadro de contatos">${c.icon('contatos')}</a>
            </div>
            <a class="l-link" href="#contatos">Ver o quadro${c.icon('arrow')}</a>
          </div>
        </div>
        <div>
          <span class="l-label">Como a equipe começa</span><br />
          <label class="sr" for="l-role">Papel</label>
          <select class="l-steps-pick" id="l-role"><option value="recepcao">Recepção</option><option value="coordenacao">Coordenação</option><option value="cuidador">Cuidador</option></select>
          <ol class="l-steps" id="l-steps" aria-live="polite">${steps(c, 'recepcao')}</ol>
        </div>
      </div>
      <div class="l-grid3" id="modulos">${MODULES.map(([r, n, d]) => `<a class="l-card" href="#${r}"><h3>${c.icon(r === 'ajustes' ? 'copy' : r)}${n}</h3><p>${d}</p></a>`).join('')}</div>
      <div class="l-qs"><span class="l-label">Perguntas que o painel responde</span><ul>${q.map((x) => `<li><a href="#${x.route}" data-action="landing-q" data-q="${x.id}"><span>${c.esc(x.text)}</span><b>${x.count}</b><small><span>Abrir</span>${c.icon('arrow')}</small></a></li>`).join('')}</ul></div>
    </div></div></section>`;
  }

  const DOT = {
    new: '#9aa8ff',
    contacted: '#f2b24c',
    waiting_visit: '#f2b24c',
    in_progress: '#6fb6ff',
    consolidated: '#6fd3a2',
    inactive: '#6b5f52',
    member: '#6fd3a2',
    urgent: '#ff7a5c',
  };

  function mapa(c) {
    const m = c.mapStats();
    const max = Math.max(1, m.seeds + m.members);
    const seg = (n, color) => `<i style="width:${(n / max) * 100}%;background:${color}"></i>`;
    return `<section class="l-framed" id="mapa" aria-labelledby="mapa-h"><div class="l-col"><div class="l-inner">
      <div class="l-intro"><h2 class="l-h2" id="mapa-h">Veja onde estão as casas antes de sair.</h2><p class="l-p">Cada contato tem bairro e coordenadas aproximadas. A coordenação monta a saída de sábado por região e sabe quais casas recebem vizinhos.</p></div>
      <div class="l-box">
        <div class="l-box-text">
          <p>Uma saída rende mais quando os grupos visitam casas próximas. O mapa mostra quem chegou, em que etapa está e onde há casa aberta.</p>
          <strong>Em ${c.esc(m.city)}, ${m.seeds} pessoas estão no quadro de contatos.<br />Com os assistidos, a igreja acompanha ${m.seeds + m.members}.</strong>
          <div class="l-cmp" role="img" aria-label="${m.seeds} contatos no quadro; ${m.seeds + m.members} pessoas com os assistidos">
            <div><span>contatos no quadro</span><u>${seg(m.seeds, DOT.contacted)}</u><b>${m.seeds}</b></div>
            <div><span>+ assistidos</span><u>${seg(m.seeds, DOT.contacted)}${seg(m.inProgress, DOT.in_progress)}${seg(m.consolidated, DOT.consolidated)}${seg(m.members - m.inProgress - m.consolidated, '#8a7c6c')}</u><b>${m.seeds + m.members}</b></div>
          </div>
          <ol class="l-abcd">
            <li><b style="color:${DOT.contacted}">A</b><span>contatos em jornada</span><span>${m.seeds}</span></li>
            <li><b style="color:${DOT.in_progress}">B</b><span>assistidos em acompanhamento</span><span>${m.inProgress}</span></li>
            <li><b style="color:${DOT.consolidated}">C</b><span>assistidos consolidados</span><span>${m.consolidated}</span></li>
            <li><b style="color:var(--l-lume)">D</b><span>casas abertas para visitas</span><span>${m.open}</span></li>
          </ol>
          <a class="l-link" href="#contatos" data-action="landing-map">Abrir o mapa${c.icon('arrow')}</a>
        </div>
        <div class="l-dots">
          <canvas id="l-dots" role="img" aria-label="Mapa pontilhado de ${c.esc(m.city)} com ${m.points.length} casas por situação"></canvas>
          <div class="l-legend"><span class="l-label">Situação</span>
            <span><i style="background:${DOT.new}"></i>Novo</span>
            <span><i style="background:${DOT.contacted}"></i>Contatado ou aguardando visita</span>
            <span><i style="background:${DOT.in_progress}"></i>Em acompanhamento</span>
            <span><i style="background:${DOT.consolidated}"></i>Consolidado</span>
            <span><i class="ring"></i>Casa aberta</span>
            <span><i style="background:${DOT.urgent}"></i>Urgente</span>
          </div>
        </div>
      </div>
    </div></div></section>`;
  }

  // Campo pontilhado: grade fraca e cada casa como uma cruz de pontos acesos; urgentes pulsam.
  let raf = 0;
  function drawDots() {
    const cv = document.getElementById('l-dots');
    if (!cv) return;
    const pts = window.AtalaiaLanding.ctx.mapStats().points;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext('2d');
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const [a0, a1, o0, o1] = [
      Math.min(...lats),
      Math.max(...lats),
      Math.min(...lngs),
      Math.max(...lngs),
    ];
    const padX = W * 0.1;
    const padY = H * 0.12;
    const step = 7;
    const snap = (v) => Math.round(v / step) * step;
    const place = pts.map((p) => ({
      ...p,
      x: snap(padX + ((p.lng - o0) / (o1 - o0 || 1)) * (W * 0.62 - padX)),
      y: snap(padY + ((a1 - p.lat) / (a1 - a0 || 1)) * (H - padY * 2)),
    }));
    const frame = (t) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,240,222,0.07)';
      for (let x = step; x < W; x += step)
        for (let y = step; y < H; y += step) g.fillRect(x - 0.5, y - 0.5, 1.2, 1.2);
      // derived: snapshots[0].animations[6] — 2000ms, opacidade 1→0,5→1
      const pulse = t == null ? 1 : 0.75 + 0.25 * Math.cos((t / 2000) * Math.PI * 2);
      for (const p of place) {
        const col = p.urgent ? DOT.urgent : DOT[p.kind];
        g.globalAlpha = p.urgent ? pulse : 0.95;
        g.fillStyle = col;
        for (const [dx, dy] of [
          [0, 0],
          [step, 0],
          [-step, 0],
          [0, step],
          [0, -step],
        ])
          g.fillRect(p.x + dx - 1.6, p.y + dy - 1.6, 3.2, 3.2);
        g.globalAlpha = 1;
        if (p.open) {
          g.strokeStyle = '#f2b24c';
          g.lineWidth = 1.2;
          g.beginPath();
          g.arc(p.x, p.y, step * 1.9, 0, Math.PI * 2);
          g.stroke();
        }
      }
    };
    cancelAnimationFrame(raf);
    if (reduced()) return frame(null);
    const loop = (t) => {
      if (!document.body.contains(cv)) return;
      frame(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function fluxo(c) {
    const node = (x, y, w, label, icon) =>
      `<g><rect x="${x}" y="${y}" width="${w}" height="48" rx="3" fill="#120a06" stroke="#3a2c20"/><text x="${x + 18}" y="${y + 30}" fill="#fff0de" font-size="15" font-weight="500">${icon ? icon + ' ' : ''}${label}</text></g>`;
    const step = (x, y, n) =>
      `<g><circle cx="${x}" cy="${y}" r="11" fill="#fff0de"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="#0e0704" font-size="10" font-weight="600">0${n}</text></g>`;
    const path = 'M215 134 L 246 134 M 452 134 L 520 134 M 790 134 L 850 134';
    return `<section class="l-framed" id="fluxo" aria-labelledby="fluxo-h"><div class="l-col"><div class="l-inner">
      <div class="l-intro"><h2 class="l-h2" id="fluxo-h">Cada pessoa tem um caminho e um responsável.</h2><p class="l-p">O cuidador vê só quem está com ele. A coordenação vê a igreja inteira. Pedidos de oração ficam na ficha da pessoa, nunca em lista aberta.</p><a class="l-link" href="#fluxo" data-action="scroll" data-to="fluxo-cards" style="margin-top:18px">Como funciona a privacidade${c.icon('arrow')}</a></div>
      <div class="l-flow">
        <div class="l-flow-art">
          <svg viewBox="0 0 1000 400" role="img" aria-labelledby="flow-t"><title id="flow-t">Recepção cadastra a ficha, o cuidador designado registra visitas dentro da igreja e a pessoa chega à célula; a coordenação vê cada passo.</title>
            <rect x="490" y="44" width="330" height="290" rx="4" fill="none" stroke="#5a4838" stroke-dasharray="5 5"/>
            <text x="508" y="66" fill="#a39582" font-size="11" letter-spacing="2">SUA IGREJA</text>
            <path d="${path}" stroke="#8a7c6c" stroke-width="1.2" fill="none"/>
            <path d="M 655 158 L 655 210" stroke="#8a7c6c" stroke-width="1.2" stroke-dasharray="2 3"/>
            <path d="M 655 334 L 655 372 Q 655 382 645 382 L 150 382 Q 140 382 140 372 L 140 160" stroke="#8a7c6c" stroke-width="1.2" fill="none"/>
            <path d="M 134 170 L 140 158 L 146 170" fill="#8a7c6c"/>
            ${node(65, 110, 150, 'Recepção', '◎')}
            ${step(262, 92, 1)}<text x="280" y="96" fill="#cdbfad" font-size="11" letter-spacing="2">FICHA DE CHEGADA</text>
            <rect x="246" y="116" width="206" height="36" rx="3" fill="#17100a" stroke="#3a2c20"/><rect x="258" y="129" width="10" height="10" rx="2" fill="#f2b24c"/><text x="275" y="138.5" fill="#fff0de" font-size="12">Francisca · Mangabeira</text>
            ${step(474, 134, 2)}
            ${node(520, 110, 270, 'Cuidador designado', '◉')}
            <rect x="706" y="98" width="76" height="20" rx="10" fill="#f2b24c"/><text x="744" y="112" text-anchor="middle" fill="#1b1206" font-size="9" font-weight="600" letter-spacing="1">ATRIBUÍDO</text>
            <g><rect x="520" y="210" width="270" height="96" rx="3" fill="#120a06" stroke="#3a2c20"/><text x="538" y="238" fill="#fff0de" font-size="15" font-weight="500">⌁ Linha do tempo</text><line x1="520" y1="252" x2="790" y2="252" stroke="#3a2c20"/><text x="538" y="280" fill="#cdbfad" font-size="12">próxima visita</text><text x="772" y="280" text-anchor="end" fill="#f2b24c" font-size="12">sáb, 31 out</text></g>
            ${node(850, 110, 120, 'Célula', '▲')}
            ${step(140, 382, 3)}<text x="168" y="372" fill="#cdbfad" font-size="11" letter-spacing="2">A COORDENAÇÃO VÊ CADA PASSO</text>
            <circle id="flow-dot" r="5" fill="#f2b24c"><animateMotion dur="6s" repeatCount="indefinite" path="M215 134 L 520 134 L 790 134 L 850 134"/></circle>
          </svg>
          <ol class="l-flow-list" aria-label="Caminho de uma pessoa">
            <li><b>01</b><span>Recepção preenche a ficha de chegada: Francisca · Mangabeira</span></li>
            <li><b>02</b><span>Dentro da igreja, o cuidador designado registra visitas na linha do tempo</span></li>
            <li><b>▲</b><span>A pessoa chega à célula e é consolidada</span></li>
            <li><b>03</b><span>A coordenação vê cada passo no painel</span></li>
          </ol>
        </div>
        <div class="l-num3" id="fluxo-cards">
          <div><small>01</small><h3>Cadastrar e atribuir</h3><p>A recepção cadastra em menos de um minuto. A coordenação escolhe o cuidador olhando a carga de cada um.</p></div>
          <div><small>02</small><h3>Visitar e registrar</h3><p>O cuidador registra visita, ligação ou oração e marca a próxima data. Só ele e a coordenação leem as notas.</p></div>
          <div><small>03</small><h3>Consolidar com frequência</h3><p>Culto, célula e EBD mostram quem firmou e quem esfriou, antes que a pessoa suma.</p></div>
        </div>
      </div>
    </div></div></section>`;
  }

  const ART = {
    painel: '<path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/>',
    cuidador: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18h4"/>',
    saidas:
      '<path d="M4 16V11l2-5h12l2 5v5M4 16h16M4 16v3M20 16v3"/><circle cx="8" cy="13" r="1"/><circle cx="16" cy="13" r="1"/>',
    rede: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5 6.5 16M12 11.5l5.5 4.5"/>',
  };
  const art = (k, color) =>
    `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ART[k]}</svg>`;

  function papeis(c) {
    const cards = [
      [
        'painel',
        '#f2b24c',
        'Painel da coordenação',
        'A fila de quem precisa de alguém, a carga de cada cuidador e a jornada da igreja numa tela.',
        '#painel',
        'coordinator',
        'Abrir o painel',
      ],
      [
        'cuidador',
        '#6fb6ff',
        'Celular do cuidador',
        'Só as pessoas sob seu cuidado, com telefone, endereço e a próxima visita. Registro em três toques.',
        '#painel',
        'caregiver',
        'Ver como cuidador',
      ],
      [
        'saidas',
        '#6fd3a2',
        'Saídas em grupo',
        'Quem vai, quem tem carro e quantos lugares. Os grupos saem montados com um cuidador em cada.',
        '#saidas',
        'coordinator',
        'Abrir saídas',
      ],
      [
        'rede',
        '#d98aff',
        'Rede de igrejas',
        'Cada igreja com seus dados isolados, seus canais de cadastro e seus ajustes de alerta.',
        '#ajustes',
        'coordinator',
        'Abrir ajustes',
      ],
    ];
    return `<section class="l-framed" id="papeis" aria-labelledby="papeis-h"><div class="l-col"><div class="l-inner">
      <h2 class="l-h2" id="papeis-h" style="max-width:15em">Uma central para quem coordena, visita e recebe.</h2>
      <div class="l-grid4">${cards.map(([k, col, t, d, h, role, cta]) => `<article class="l-card l-card-tall">${art(k, col)}<h3 class="l-h3">${t}</h3><p>${d}</p><a class="l-more" href="${h}" data-action="as-role" data-role="${role}">${cta}${c.icon('arrow')}</a></article>`).join('')}</div>
      <a class="l-link" href="#comecar" style="margin-top:36px">Criar a central da minha igreja${c.icon('arrow')}</a>
    </div></div></section>`;
  }

  function fechamento(c) {
    const net = c.network;
    return `<section class="l-pre" id="fechamento" aria-labelledby="pre-h">
      <div class="l-wrap">
        <h2 class="l-h2" id="pre-h" style="text-align:center;margin:0 auto;max-width:22em">Feito para igrejas que não querem perder ninguém de vista.</h2>
        <ul class="l-pre-net">${net.map((t) => `<li>${c.esc(t.name.replace(/^Igreja Central /, ''))}<small>${t.seeds} em jornada</small></li>`).join('')}</ul>
        <div class="l-hero-row" style="margin-top:56px">
          <div class="l-hero-left"><span class="l-label">Cadastre a primeira pessoa</span><div style="height:16px"></div>${cmd(c, 'fc')}<p class="l-cmd-err" id="fc-err" role="alert"></p></div>
          <div class="l-side"><span class="l-label">Comece pela sua igreja</span><div style="height:4px"></div><a class="l-btn fill" href="#comecar" style="height:44px;padding:0 18px">Criar a central</a><a class="l-link" href="#painel">Abrir a demonstração${c.icon('arrow')}</a></div>
        </div>
      </div>
      <div class="l-pre-glow" aria-hidden="true"></div>
    </section>
    <footer class="l-foot"><div class="l-wrap">
      <div class="l-foot-brand">${c.brand}<blockquote>“Eu te dei por atalaia sobre a casa de Israel.” Ezequiel 33:7. O atalaia ficava no alto do muro para ver quem se aproximava.</blockquote></div>
      <nav aria-label="Produto"><b>Produto</b><a href="#painel">Painel</a><a href="#contatos">Contatos</a><a href="#assistidos">Assistidos</a><a href="#saidas">Saídas</a><a href="#encontros">Encontros</a><a href="#ajustes">Ajustes</a></nav>
      <nav aria-label="Comece"><b>Comece</b><a href="#comecar">Criar central</a><a href="#painel">Demonstração</a><a href="#cadastro" data-action="scroll" data-to="cadastro">Como funciona</a></nav>
      <div><b>Dados</b><p>Convicção religiosa e saúde são dados sensíveis na LGPD (art. 11). Esta demonstração usa só dados fictícios e não envia nada.</p></div>
    </div></footer>`;
  }

  const SECTIONS = [hero, rede, cadastro, mapa, fluxo, papeis, fechamento];

  window.AtalaiaLanding = {
    html: (c) =>
      (window.AtalaiaLanding.ctx = c) &&
      `<div class="lp2">${nav(c)}<main id="main">${SECTIONS.slice(0, 6)
        .map((s) => s(c))
        .join('')}</main>${fechamento(c)}</div>`,
    start() {
      this.stop();
      typeLoop();
      const pick = document.getElementById('l-role');
      if (pick)
        pick.onchange = () => {
          document.getElementById('l-steps').innerHTML = steps(
            window.AtalaiaLanding.ctx,
            pick.value,
          );
        };
      drawDots();
      window.addEventListener('resize', drawDots);
      const dot = document.getElementById('flow-dot');
      if (dot && reduced()) dot.remove();
      // Reveal único da grade de módulos: só deslocamento, o conteúdo nunca fica invisível.
      const mod = document.getElementById('modulos');
      if (mod && !reduced() && 'IntersectionObserver' in window) {
        const r = mod.getBoundingClientRect();
        if (r.top > innerHeight) {
          mod.classList.add('reveal-ready');
          observer = new IntersectionObserver(
            (es) => {
              if (es.some((e) => e.isIntersecting)) {
                mod.classList.add('revealed');
                mod.classList.remove('reveal-ready');
                observer.disconnect();
              }
            },
            { threshold: 0.15 },
          );
          observer.observe(mod);
        }
      }
    },
    stop() {
      timers.forEach(clearTimeout);
      timers = [];
      if (observer) observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', drawDots);
      observer = null;
    },
  };
})();
