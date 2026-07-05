// app/screens-team.jsx — Líder team management + cuidador invite flow

// ─────────────────────────────────────────────────────────────
// EQUIPE — Líder management screen
// ─────────────────────────────────────────────────────────────

const CuidadorRow = ({ c }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px',
    borderBottom: '1px solid var(--border)',
  }}>
    <Avatar src={c.foto} name={c.nome} size={44} online={c.online} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                       letterSpacing: '-0.015em', overflow: 'hidden',
                       textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.nome}
        </span>
        {c.papel === 'Líder' && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--accent)',
            background: 'var(--accent-bg)', padding: '2px 7px',
            borderRadius: 999, letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>Líder</span>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
        {c.casos} {c.casos === 1 ? 'caso ativo' : 'casos ativos'} · desde {c.desde}
      </div>
    </div>
    <IconBtn icon={<IconMore />} variant="flat" size={32} />
  </div>
);

const PendenteRow = ({ p, onApprove, onDecline }) => (
  <div style={{
    padding: '16px 18px',
    borderBottom: '1px solid var(--border)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <Avatar name={p.nome} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                      letterSpacing: '-0.015em' }}>{p.nome}</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {p.cidade} · {p.quando}
        </div>
      </div>
    </div>
    <div style={{
      fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5,
      padding: '0 0 12px', letterSpacing: '-0.005em', textWrap: 'pretty',
    }}>"{p.bio}"</div>
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="primary" size="sm" icon={<IconCheck />} full
              onClick={() => onApprove(p.id)}>Aprovar</Button>
      <Button variant="secondary" size="sm" icon={<IconX />} full
              onClick={() => onDecline(p.id)}>Recusar</Button>
    </div>
  </div>
);

const EquipeScreen = ({ onBack, onInvite }) => {
  const [tab, setTab] = React.useState('ativos');
  const [pendentes, setPendentes] = React.useState(APROVACOES_PENDENTES);
  const ativos = CUIDADORES_ATIVOS.filter(c => c.tenant === USUARIO.tenantId);
  const remove = (id) => setPendentes(l => l.filter(x => x.id !== id));

  const tabs = [
    { key: 'ativos', label: 'Ativos', count: ativos.length },
    { key: 'pendentes', label: 'Pendentes', count: pendentes.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '4px 16px 12px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 700,
                     color: 'var(--text)', letterSpacing: '-0.015em' }}>
          Equipe
        </h1>
        <IconBtn icon={<IconPlus />} onClick={onInvite} variant="tinted" size={40} />
      </div>

      <div style={{ padding: '0 22px 14px' }}>
        <TenantChip tenantId={USUARIO.tenantId} size="sm" />
      </div>

      {/* Segmented tabs */}
      <div style={{ padding: '0 18px 16px' }}>
        <div style={{
          display: 'flex', padding: 4, borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '11px 10px', borderRadius: 9,
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              border: 0, fontFamily: 'inherit', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600,
              color: tab === t.key ? 'var(--accent)' : 'var(--text-2)',
              letterSpacing: '-0.005em',
              boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {t.label}
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: tab === t.key ? 'var(--accent-bg)' : 'transparent',
                color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
                padding: '2px 7px', borderRadius: 999,
                fontVariantNumeric: 'tabular-nums', minWidth: 22,
              }}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px',
                    scrollbarWidth: 'none' }}>
        {tab === 'ativos' && (
          <>
            <Card padding={0}>
              {ativos.map((c, i, arr) => (
                <CuidadorRow key={c.id} c={c} />
              ))}
              <div style={{ height: 4 }} />
            </Card>
            <div style={{ marginTop: 18 }}>
              <Button variant="primary" full icon={<IconPlus />} onClick={onInvite}>
                Convidar novo cuidador
              </Button>
            </div>
          </>
        )}

        {tab === 'pendentes' && (
          <>
            {pendentes.length === 0 ? (
              <div style={{
                padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)',
                fontSize: 14,
              }}>Nenhuma solicitação pendente ✓</div>
            ) : (
              <Card padding={0}>
                {pendentes.map(p => (
                  <PendenteRow key={p.id} p={p}
                               onApprove={remove} onDecline={remove} />
                ))}
                <div style={{ height: 4 }} />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CONVIDAR CUIDADOR — form (Líder action)
// ─────────────────────────────────────────────────────────────

const ConvidarScreen = ({ onBack, onSent }) => {
  const [form, setForm] = React.useState({ nome: '', telefone: '', papel: 'Cuidador' });
  const update = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.nome.trim().length > 2 && form.telefone.replace(/\D/g, '').length >= 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, marginRight: 40, textAlign: 'center',
                     fontSize: 17, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>
          Convidar Cuidador
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: 'var(--accent-bg)', color: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}><IconUsers size={34} /></div>
          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 800,
            letterSpacing: '-0.025em', color: 'var(--text)',
          }}>Convide alguém para a equipe</h2>
          <p style={{
            margin: '8px 0 0', fontSize: 14, color: 'var(--text-2)',
            lineHeight: 1.5, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Enviaremos um link pelo WhatsApp para que ela complete o cadastro.
            Como você convidou, o acesso já vem aprovado.
          </p>
        </div>

        <Input label="Nome Completo" value={form.nome} onChange={update('nome')}
               placeholder="Ex: Cláudia Ferreira" icon={<IconUser />} />
        <Input label="Telefone (WhatsApp)" value={form.telefone}
               onChange={update('telefone')}
               placeholder="(00) 00000-0000" icon={<IconPhone />} />
        <Select label="Papel" value={form.papel} onChange={update('papel')}
                options={['Cuidador', 'Líder']} />

        <InfoBanner icon={<IconShield size={20} />}>
          O convite vincula a pessoa diretamente à{' '}
          <span style={{ fontWeight: 700 }}>
            Comunidade {tenantById(USUARIO.tenantId).nome}
          </span>. Ela não verá outras localidades.
        </InfoBanner>
      </div>

      <div style={{ padding: '16px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="whatsapp" full disabled={!valid}
                icon={<IconWhatsappFilled />}
                onClick={() => onSent(form)}>
          Enviar convite pelo WhatsApp
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CONVITE ENVIADO — confirmation w/ copyable link
// ─────────────────────────────────────────────────────────────

const ConviteEnviadoScreen = ({ form, onClose, onConviteRecebido }) => {
  const [copied, setCopied] = React.useState(false);
  const inviteUrl = `acolhe.app/c/${(form?.nome || 'novo').toLowerCase().split(' ')[0]}-${Math.random().toString(36).slice(2, 7)}`;

  const copy = () => {
    try {
      navigator.clipboard?.writeText('https://' + inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconX />} onClick={onClose} variant="flat" size={40} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <div style={{
            width: 96, height: 96, borderRadius: 30,
            background: '#DCFCE7',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 18, position: 'relative',
            boxShadow: '0 12px 28px rgba(34,197,94,0.2)',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                 stroke="#16A34A" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 6" />
            </svg>
          </div>
          <h2 style={{
            margin: 0, fontSize: 26, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1,
          }}>Convite enviado!</h2>
          <p style={{
            margin: '10px 24px 0', fontSize: 14.5, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Mandamos uma mensagem para <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {form?.nome || 'a pessoa convidada'}</span> via WhatsApp com o link de acesso.
          </p>
        </div>

        <Card padding={18}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 8,
          }}>Link do convite</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', background: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13,
                          color: 'var(--text)', fontFamily: 'inherit',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' }}>
              https://{inviteUrl}
            </div>
            <button onClick={copy} style={{
              padding: '6px 12px', borderRadius: 8,
              background: copied ? '#DCFCE7' : 'var(--accent)',
              color: copied ? '#15803D' : '#fff',
              border: 0, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              fontFamily: 'inherit', letterSpacing: '-0.005em',
              transition: 'background .15s',
            }}>{copied ? 'Copiado ✓' : 'Copiar'}</button>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 10,
                        lineHeight: 1.4 }}>
            Válido por 7 dias. Pessoa convidada deve abrir o link no celular dela.
          </div>
        </Card>

        <Card padding={18}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.01em', marginBottom: 6 }}>
            O que acontece agora?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10,
                        marginTop: 6 }}>
            {[
              ['1', 'Ela recebe a mensagem no WhatsApp com o link'],
              ['2', 'Confirma os dados em uma tela rápida (pré-preenchida)'],
              ['3', 'Já entra direto no app — sem precisar de análise'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>{n}</div>
                <div style={{ fontSize: 13.5, color: 'var(--text)',
                              lineHeight: 1.45, letterSpacing: '-0.005em',
                              paddingTop: 2 }}>{t}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Preview demo button — opens convite recebido flow in the same artboard */}
        {onConviteRecebido && (
          <Button variant="secondary" full icon={<IconArrowRight />}
                  onClick={onConviteRecebido}>
            Ver como a pessoa convidada recebe
          </Button>
        )}
      </div>

      <div style={{ padding: '16px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full onClick={onClose}>Concluído</Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CONVITE RECEBIDO — entry flow for an invited cuidador
// (replaces self-signup + análise — invited users skip the wait)
// ─────────────────────────────────────────────────────────────

const ConviteRecebidoScreen = ({ inviter, tenantId, conviteNome, onAccept, onDecline }) => {
  const t = tenantById(tenantId || USUARIO.tenantId);
  const i = inviter || { nome: USUARIO.nome, foto: USUARIO.foto };
  const nome = conviteNome || 'Cláudia';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      {/* Banner with tenant brand */}
      <div style={{
        margin: '8px 16px 0', padding: '22px 20px',
        borderRadius: 20,
        background: `linear-gradient(135deg, ${t.cor} 0%, ${t.cor}cc 100%)`,
        color: '#fff', textAlign: 'center', position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -30, top: -30, width: 120, height: 120,
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute', left: -20, bottom: -40, width: 90, height: 90,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', opacity: 0.85,
          }}>Convite</div>
          <div style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em',
            marginTop: 6,
          }}>Comunidade {t.nome}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            {t.cidade}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Inviter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 18,
                      boxShadow: 'var(--shadow-card)' }}>
          <Avatar src={i.foto} name={i.nome} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              Convidada por
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)',
                          letterSpacing: '-0.01em', marginTop: 1 }}>
              {i.nome}
            </div>
          </div>
          <div style={{
            fontSize: 10.5, fontWeight: 700, color: 'var(--accent)',
            background: 'var(--accent-bg)', padding: '4px 8px',
            borderRadius: 999, letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>Líder</div>
        </div>

        <div>
          <h2 style={{
            margin: 0, fontSize: 26, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.15,
          }}>
            Olá, {nome}.
            <br />
            <span style={{ color: 'var(--accent)' }}>Bem-vinda à equipe.</span>
          </h2>
          <p style={{
            margin: '14px 0 0', fontSize: 14.5, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Você foi convidada para ser cuidadora da Comunidade {t.nome}.
            Como o convite veio da liderança, seu acesso já está liberado —
            basta confirmar seus dados.
          </p>
        </div>

        <Card padding={0}>
          {[
            { ic: <IconUsers />, label: 'Acesso aos irmãos assistidos',
              hint: 'Acompanhe os casos da sua localidade' },
            { ic: <IconCalendar />, label: 'Sua agenda de cuidado',
              hint: 'Visitas, ligações e reuniões em um só lugar' },
            { ic: <IconSparkle />, label: 'Agente de IA acolhedor',
              hint: 'Cadastre, atualize e busque com linguagem natural' },
          ].map((f, i, arr) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 18px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--accent-bg)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{React.cloneElement(f.ic, { size: 18 })}</div>
              <div style={{ flex: 1, paddingTop: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)',
                              letterSpacing: '-0.005em' }}>{f.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2,
                              lineHeight: 1.4 }}>{f.hint}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="primary" full iconRight={<IconArrowRight />}
                onClick={onAccept}>
          Aceitar convite
        </Button>
        <button onClick={onDecline} style={{
          padding: '8px 12px', background: 'transparent', border: 0,
          color: 'var(--text-2)', fontSize: 13.5, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
          letterSpacing: '-0.005em',
        }}>Recusar convite</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CONVITE — CONFIRMAR DADOS (pre-filled, fast accept)
// ─────────────────────────────────────────────────────────────

const ConviteConfirmarScreen = ({ inviter, tenantId, conviteNome, conviteTel,
                                   onBack, onConfirm }) => {
  const t = tenantById(tenantId || USUARIO.tenantId);
  const [form, setForm] = React.useState({
    nome: conviteNome || 'Cláudia Ferreira',
    telefone: conviteTel || '+55 92 99100 5577',
    bio: '',
  });
  const update = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, marginRight: 40, textAlign: 'center',
                     fontSize: 17, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>
          Confirme seus dados
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: 'var(--accent-bg)',
          border: '1px solid rgba(45,127,249,0.2)', borderRadius: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: t.cor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12,
          }}>{t.sigla}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)',
                          letterSpacing: '-0.005em' }}>
              Comunidade {t.nome}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>
              Convite de {(inviter || USUARIO).nome.split(' ')[0]}
            </div>
          </div>
          <IconVerified size={18} color="var(--accent)" />
        </div>

        <Input label="Nome Completo" value={form.nome} onChange={update('nome')}
               icon={<IconUser />} />
        <Input label="Telefone (WhatsApp)" value={form.telefone}
               onChange={update('telefone')} icon={<IconPhone />} />
        <Textarea label="Mini-biografia (opcional)"
                  value={form.bio} onChange={update('bio')}
                  placeholder="Conte um pouco sobre sua experiência em acolher..." />

        <div style={{ fontSize: 11.5, color: 'var(--text-3)',
                      lineHeight: 1.5, letterSpacing: '-0.005em',
                      textWrap: 'pretty', padding: '4px 4px' }}>
          Ao continuar, você concorda com nossos Termos de Uso e Política de
          Privacidade. Suas conversas com os assistidos são confidenciais.
        </div>
      </div>

      <div style={{ padding: '16px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full iconRight={<IconArrowRight />}
                onClick={onConfirm}>
          Confirmar e entrar
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BEM-VINDA — splash after invite accepted
// ─────────────────────────────────────────────────────────────

const BemVindaScreen = ({ inviter, tenantId, conviteNome, onStart }) => {
  const t = tenantById(tenantId || USUARIO.tenantId);
  const primeiroNome = (conviteNome || 'Cláudia').split(' ')[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 22,
                    padding: '0 28px' }}>
        <div style={{
          width: 110, height: 110, borderRadius: 32,
          background: `linear-gradient(135deg, ${t.cor} 0%, ${t.cor}d0 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', boxShadow: `0 16px 32px ${t.cor}40`,
          position: 'relative',
        }}>
          <IconHeart size={56} sw={2} />
          <div style={{
            position: 'absolute', right: -6, top: -6,
            width: 36, height: 36, borderRadius: '50%',
            background: '#22C55E', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(34,197,94,0.4)',
            border: '3px solid var(--bg)',
          }}>
            <IconCheck size={18} sw={3} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0, fontSize: 30, fontWeight: 800,
            letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.05,
          }}>
            Bem-vinda,
            <br />
            {primeiroNome}!
          </h1>
          <p style={{
            margin: '14px 0 0', fontSize: 15, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Você agora faz parte da equipe de cuidadores da{' '}
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
              Comunidade {t.nome}
            </span>.
          </p>
        </div>
      </div>

      <div style={{ padding: '16px 28px 32px' }}>
        <Button variant="primary" full iconRight={<IconArrowRight />}
                onClick={onStart}>
          Começar a acolher
        </Button>
      </div>
    </div>
  );
};

Object.assign(window, {
  EquipeScreen, ConvidarScreen, ConviteEnviadoScreen,
  ConviteRecebidoScreen, ConviteConfirmarScreen, BemVindaScreen,
});
