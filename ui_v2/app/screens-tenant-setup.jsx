// app/screens-tenant-setup.jsx — Founding leader creates a new tenant
// Flow:
//   escolha-perfil → tenant-identidade → tenant-otp →
//   tenant-localidade → tenant-personaliza → tenant-revisao →
//   (planos → checkout → sucesso) → tenant-bemvindo

// ─── Progress bar shown on each step ─────────────────────────────
const StepBar = ({ current, total, onBack, onSkip, skipLabel }) => (
  <div style={{ padding: '8px 18px 18px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
      <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={36} />
      <div style={{ flex: 1, display: 'flex', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999,
            background: i < current ? 'var(--accent)' :
                        i === current ? 'var(--accent)' : 'var(--border)',
            opacity: i === current ? 1 : i < current ? 1 : 1,
          }} />
        ))}
      </div>
      {onSkip ? (
        <button onClick={onSkip} style={{
          padding: '6px 10px', background: 'transparent', border: 0,
          color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
          letterSpacing: '-0.005em',
        }}>{skipLabel || 'Pular'}</button>
      ) : (
        <div style={{ width: 36 }} />
      )}
    </div>
    <div style={{
      fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)',
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>Passo {current + 1} de {total}</div>
  </div>
);

// ─── 0 · Escolha perfil — branch líder / cuidador ───────────────
const EscolhaPerfilScreen = ({ onLider, onCuidador, onBack }) => {
  const opcoes = [
    {
      key: 'lider',
      icon: <IconChurch />,
      label: 'Sou líder de uma localidade',
      hint: 'Vou criar uma nova localidade e convidar a equipe de cuidadores.',
      onClick: onLider,
      featured: true,
    },
    {
      key: 'cuidador',
      icon: <IconUsers />,
      label: 'Sou cuidador',
      hint: 'Vou ajudar a acolher irmãos. Aguardo aprovação ou um convite.',
      onClick: onCuidador,
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 30, fontWeight: 800,
            letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.05,
          }}>
            Como você vai
            <br /><span style={{ color: 'var(--accent)' }}>usar a Acolhe?</span>
          </h1>
          <p style={{
            margin: '14px 0 0', fontSize: 14.5, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Cada localidade é um espaço fechado — escolha como quer entrar.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {opcoes.map(o => (
            <button key={o.key} onClick={o.onClick} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: 20, borderRadius: 18, textAlign: 'left',
              background: 'var(--surface)',
              border: `2px solid ${o.featured ? 'var(--accent)' : 'var(--border)'}`,
              boxShadow: o.featured
                ? '0 8px 28px rgba(45,127,249,0.15), 0 0 0 4px rgba(45,127,249,0.08)'
                : '0 1px 2px rgba(15,23,42,0.04)',
              cursor: 'pointer', fontFamily: 'inherit',
              position: 'relative',
            }}>
              {o.featured && (
                <div style={{
                  position: 'absolute', top: -10, right: 16,
                  padding: '4px 10px', borderRadius: 999,
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>Recomendado</div>
              )}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: o.featured ? 'var(--accent-bg)' : 'var(--surface-2)',
                color: o.featured ? 'var(--accent)' : 'var(--text-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{React.cloneElement(o.icon, { size: 24 })}</div>
              <div style={{ flex: 1, paddingTop: 3 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)',
                              letterSpacing: '-0.015em' }}>{o.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4,
                              lineHeight: 1.45, letterSpacing: '-0.005em' }}>{o.hint}</div>
              </div>
              <IconChevronRight size={18} color="var(--text-3)"
                                style={{ alignSelf: 'center', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── 1 · Identificação do líder ─────────────────────────────────
const TenantIdentidadeScreen = ({ data, onBack, onContinue }) => {
  const [form, setForm] = React.useState({
    nome: data?.lider?.nome || '',
    telefone: data?.lider?.telefone || '',
  });
  const update = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.nome.trim().length > 2 &&
                form.telefone.replace(/\D/g, '').length >= 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <StepBar current={0} total={5} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1,
          }}>Vamos começar por você.</h1>
          <p style={{
            margin: '10px 0 0', fontSize: 14, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Como líder responsável, seus dados ficam vinculados à localidade
            que você vai criar.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Seu nome completo" value={form.nome}
                 onChange={update('nome')}
                 placeholder="Ex: Daniel Bemol" icon={<IconUser />} />
          <Input label="Telefone (WhatsApp)" value={form.telefone}
                 onChange={update('telefone')}
                 placeholder="(00) 00000-0000" icon={<IconPhone />}
                 hint="Enviaremos um código por WhatsApp para verificar." />
        </div>

        <InfoBanner>
          Você será o <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
          administrador</span> desta localidade — quem aprova cuidadores e
          gerencia a assinatura.
        </InfoBanner>
      </div>
      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full disabled={!valid}
                iconRight={<IconArrowRight />}
                onClick={() => onContinue({ lider: form })}>
          Continuar
        </Button>
      </div>
    </div>
  );
};

// ─── 2 · Verificação WhatsApp (OTP) ─────────────────────────────
const TenantOtpScreen = ({ data, onBack, onContinue, onResend }) => {
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const [active, setActive] = React.useState(0);
  const [seconds, setSeconds] = React.useState(45);
  const refs = React.useRef([]);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  React.useEffect(() => { refs.current[0]?.focus(); }, []);

  const setDigit = (i, v) => {
    v = v.replace(/\D/g, '').slice(-1);
    setCode(c => { const n = [...c]; n[i] = v; return n; });
    if (v && i < 5) { setActive(i + 1); refs.current[i + 1]?.focus(); }
  };
  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      setActive(i - 1); refs.current[i - 1]?.focus();
    }
  };

  const filled = code.every(d => d.length === 1);
  const tel = data?.lider?.telefone || '+55 92 99988 7766';
  const ofuscado = tel.replace(/(\d{2})\)?\s?\d{4,5}/, '$1) ••••');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <StepBar current={1} total={5} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22, alignSelf: 'center',
          background: '#DCFCE7', color: '#15803D',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 8,
        }}><IconWhatsappFilled size={36} /></div>

        <div>
          <h1 style={{
            margin: 0, fontSize: 24, fontWeight: 800,
            letterSpacing: '-0.025em', color: 'var(--text)',
            lineHeight: 1.15, textAlign: 'center',
          }}>Verificação por WhatsApp</h1>
          <p style={{
            margin: '10px 0 0', fontSize: 14, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em',
            textAlign: 'center', textWrap: 'pretty',
          }}>
            Enviamos um código de 6 dígitos para{' '}
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>{ofuscado}</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => refs.current[i] = el}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              onFocus={() => setActive(i)}
              inputMode="numeric" maxLength={1}
              style={{
                width: 46, height: 58, textAlign: 'center',
                fontSize: 26, fontWeight: 700, color: 'var(--text)',
                letterSpacing: '-0.02em',
                border: `1.5px solid ${active === i ? 'var(--accent)' : 'var(--border)'}`,
                background: 'var(--surface)', borderRadius: 12,
                outline: 'none', fontFamily: 'inherit',
                boxShadow: active === i ? '0 0 0 4px rgba(45,127,249,0.12)' : 'none',
                transition: 'all .15s',
                fontVariantNumeric: 'tabular-nums',
              }} />
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)',
                      letterSpacing: '-0.005em' }}>
          Não recebeu?{' '}
          {seconds > 0 ? (
            <span>Reenvie em <span style={{ color: 'var(--text)', fontWeight: 600,
                                             fontVariantNumeric: 'tabular-nums' }}>
              {seconds}s</span></span>
          ) : (
            <button onClick={() => { setSeconds(45); onResend && onResend(); }}
                    style={{ padding: 0, background: 'transparent', border: 0,
                             color: 'var(--accent)', fontSize: 13, fontWeight: 700,
                             fontFamily: 'inherit', cursor: 'pointer',
                             letterSpacing: '-0.005em' }}>
              Reenviar código
            </button>
          )}
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full disabled={!filled}
                iconRight={<IconArrowRight />}
                onClick={() => onContinue({ otp: code.join('') })}>
          Verificar e continuar
        </Button>
      </div>
    </div>
  );
};

// ─── 3 · Dados da localidade ────────────────────────────────────
const TenantLocalidadeScreen = ({ data, onBack, onContinue }) => {
  const [form, setForm] = React.useState({
    nome: data?.localidade?.nome || '',
    denominacao: data?.localidade?.denominacao || '',
    cidade: data?.localidade?.cidade || '',
    uf: data?.localidade?.uf || '',
  });
  const update = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.nome.trim().length > 2 && form.cidade && form.uf;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <StepBar current={2} total={5} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1,
          }}>Sobre a sua localidade.</h1>
          <p style={{
            margin: '10px 0 0', fontSize: 14, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Esses dados ajudam sua equipe a se reconhecer no app.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nome da localidade" value={form.nome}
                 onChange={update('nome')}
                 placeholder="Ex: Adrianópolis"
                 icon={<IconChurch />}
                 hint="Como sua comunidade é chamada no dia-a-dia." />
          <Select label="Denominação (opcional)" value={form.denominacao}
                  onChange={update('denominacao')}
                  placeholder="Selecione (opcional)"
                  options={['Batista', 'Católica', 'Presbiteriana',
                            'Metodista', 'Assembleia', 'Adventista',
                            'Pentecostal', 'Outra', 'Prefiro não dizer']} />
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
            <Select label="Estado" value={form.uf} onChange={update('uf')}
                    placeholder="UF" options={UFS} />
            <Input label="Cidade" value={form.cidade} onChange={update('cidade')}
                   placeholder="Cidade sede" icon={<IconMapPin />} />
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full disabled={!valid}
                iconRight={<IconArrowRight />}
                onClick={() => onContinue({ localidade: form })}>
          Continuar
        </Button>
      </div>
    </div>
  );
};

// ─── 4 · Personalização (sigla + cor) ───────────────────────────
const TENANT_COLORS = [
  '#2D7FF9', '#7C3AED', '#10B981', '#F59E0B',
  '#EC4899', '#06B6D4', '#EF4444', '#0F172A',
];

const sigleFrom = (nome) => {
  if (!nome) return '?';
  const words = nome.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const TenantPersonalizaScreen = ({ data, onBack, onContinue }) => {
  const defaultSigla = sigleFrom(data?.localidade?.nome);
  const [sigla, setSigla] = React.useState(data?.personaliza?.sigla || defaultSigla);
  const [cor, setCor] = React.useState(data?.personaliza?.cor || TENANT_COLORS[0]);

  const valid = sigla.trim().length >= 1 && sigla.trim().length <= 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <StepBar current={3} total={5} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1,
          }}>Identidade visual.</h1>
          <p style={{
            margin: '10px 0 0', fontSize: 14, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Sua localidade aparece com essas cores em todos os cantos do app.
          </p>
        </div>

        {/* Preview */}
        <Card padding={20} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: cor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em',
            boxShadow: `0 8px 20px ${cor}50`,
          }}>{sigla.toUpperCase().slice(0, 3)}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                          letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Prévia
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)',
                          letterSpacing: '-0.015em', marginTop: 2 }}>
              Comunidade {data?.localidade?.nome || 'Adrianópolis'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 1 }}>
              {data?.localidade?.cidade || 'Manaus'}, {data?.localidade?.uf || 'AM'}
            </div>
          </div>
        </Card>

        <Input label="Sigla (até 3 letras)" value={sigla}
               onChange={(v) => setSigla(v.toUpperCase().slice(0, 3))}
               placeholder="AD"
               hint="Geramos uma automaticamente, mas você pode mudar." />

        <div>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
            letterSpacing: '-0.005em', marginBottom: 10,
          }}>Cor da localidade</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10,
          }}>
            {TENANT_COLORS.map(c => (
              <button key={c} onClick={() => setCor(c)} style={{
                aspectRatio: '1 / 1', borderRadius: '50%',
                background: c, cursor: 'pointer', fontFamily: 'inherit',
                border: cor === c ? '3px solid var(--surface)' : '3px solid transparent',
                boxShadow: cor === c
                  ? `0 0 0 2px ${c}, 0 4px 10px ${c}40`
                  : '0 1px 3px rgba(15,23,42,0.1)',
                transition: 'transform .12s',
              }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full disabled={!valid}
                iconRight={<IconArrowRight />}
                onClick={() => onContinue({ personaliza: { sigla, cor } })}>
          Continuar
        </Button>
      </div>
    </div>
  );
};

// ─── 5 · Revisão antes de pagar ─────────────────────────────────
const TenantRevisaoScreen = ({ data, onBack, onContinue }) => {
  const lider = data.lider || {};
  const loc = data.localidade || {};
  const p = data.personaliza || { sigla: 'AD', cor: '#2D7FF9' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <StepBar current={4} total={5} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1,
          }}>Confirme antes de criar.</h1>
          <p style={{
            margin: '10px 0 0', fontSize: 14, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Falta só escolher o plano. Você tem 14 dias grátis antes da
            primeira cobrança.
          </p>
        </div>

        {/* Hero card */}
        <div style={{
          padding: 22, borderRadius: 22,
          background: `linear-gradient(135deg, ${p.cor} 0%, ${p.cor}d0 100%)`,
          color: '#fff', position: 'relative', overflow: 'hidden',
          boxShadow: `0 12px 32px ${p.cor}40`,
        }}>
          <div style={{
            position: 'absolute', right: -30, top: -30, width: 120, height: 120,
            borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em',
              marginBottom: 14,
            }}>{p.sigla}</div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85,
                          letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Nova localidade
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em',
                          marginTop: 4 }}>
              Comunidade {loc.nome}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
              {loc.cidade}, {loc.uf}
              {loc.denominacao && <> · {loc.denominacao}</>}
            </div>
          </div>
        </div>

        <Card padding={0}>
          <div style={{ padding: '14px 18px',
                        borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                          letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Líder responsável
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={lider.nome} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                              letterSpacing: '-0.01em' }}>
                  {lider.nome}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
                  {lider.telefone}
                </div>
              </div>
              <div style={{
                fontSize: 10.5, fontWeight: 700, color: 'var(--accent)',
                background: 'var(--accent-bg)', padding: '4px 8px',
                borderRadius: 999, letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>Admin</div>
            </div>
          </div>

          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          marginBottom: 8 }}>
              O que acontece depois
            </div>
            {[
              ['1', 'Escolha um plano e inicie 14 dias grátis'],
              ['2', 'Convide sua equipe pelo WhatsApp'],
              ['3', 'Comece a cadastrar os primeiros assistidos'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
                                    padding: '6px 0' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
                }}>{n}</div>
                <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text)',
                              lineHeight: 1.45, letterSpacing: '-0.005em',
                              paddingTop: 2 }}>{t}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full iconRight={<IconArrowRight />}
                onClick={onContinue}>
          Escolher o plano
        </Button>
      </div>
    </div>
  );
};

// ─── 6 · Bem-vindo, líder (post-payment) ────────────────────────
const TenantBemVindoScreen = ({ data, onConvidar, onIrParaApp }) => {
  const loc = data?.localidade || { nome: 'Adrianópolis', cidade: 'Manaus', uf: 'AM' };
  const p = data?.personaliza || { sigla: 'AD', cor: '#2D7FF9' };
  const lider = data?.lider || { nome: 'Daniel Bemol' };
  const primeiroNome = lider.nome.split(' ')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 28px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 24,
                    alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: 110, height: 110, borderRadius: 30,
          background: `linear-gradient(135deg, ${p.cor} 0%, ${p.cor}cc 100%)`,
          color: '#fff', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 18px 36px ${p.cor}50`,
          fontWeight: 800, fontSize: 38, letterSpacing: '-0.03em',
        }}>
          {p.sigla}
          <div style={{
            position: 'absolute', right: -8, top: -8,
            width: 38, height: 38, borderRadius: '50%',
            background: '#22C55E', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid var(--bg)',
            boxShadow: '0 4px 8px rgba(34,197,94,0.4)',
          }}>
            <IconCheck size={20} sw={3} />
          </div>
        </div>

        <div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 800,
            letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.1,
          }}>
            Pronto, {primeiroNome}!
            <br />
            <span style={{ color: p.cor }}>
              Comunidade {loc.nome} criada.
            </span>
          </h1>
          <p style={{
            margin: '14px 0 0', fontSize: 14.5, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Sua localidade está ativa em <span style={{ color: 'var(--text)',
              fontWeight: 700 }}>{loc.cidade}, {loc.uf}</span>. Agora vamos
            preparar a equipe?
          </p>
        </div>

        <Card padding={18} style={{ width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.005em', marginBottom: 12 }}>
            Primeiros passos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { ic: <IconUsers />, l: 'Convide os cuidadores',
                h: 'O WhatsApp é o canal de convite — eles entram em segundos.' },
              { ic: <IconPlus />, l: 'Cadastre os primeiros assistidos',
                h: 'Adicione manualmente ou peça ao agente IA via Mensagens.' },
              { ic: <IconCalendar />, l: 'Marque a primeira visita',
                h: 'A agenda da localidade fica visível para toda a equipe.' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{React.cloneElement(s.ic, { size: 16 })}</div>
                <div style={{ flex: 1, paddingTop: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
                                letterSpacing: '-0.005em' }}>{s.l}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2,
                                lineHeight: 1.45 }}>{s.h}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="primary" full icon={<IconUsers />} onClick={onConvidar}>
          Convidar a primeira pessoa
        </Button>
        <button onClick={onIrParaApp} style={{
          padding: '10px 12px', background: 'transparent', border: 0,
          color: 'var(--text-2)', fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          letterSpacing: '-0.005em',
        }}>Vou convidar mais tarde</button>
      </div>
    </div>
  );
};

Object.assign(window, {
  EscolhaPerfilScreen,
  TenantIdentidadeScreen, TenantOtpScreen,
  TenantLocalidadeScreen, TenantPersonalizaScreen,
  TenantRevisaoScreen, TenantBemVindoScreen,
});
