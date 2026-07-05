// app/screens-main.jsx — Home, Detalhes, Agenda, Mensagens, Ajustes
// (post-login)

// ─────────────────────────────────────────────────────────────
// HOME · Meus Assistidos
// ─────────────────────────────────────────────────────────────

const AssistidoCard = ({ a, onOpen }) => {
  return (
    <div onClick={onOpen} style={{
      display: 'flex', alignItems: 'flex-start', gap: 16,
      padding: '18px 18px',
      background: 'var(--surface)',
      borderRadius: 18, border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-card)',
      cursor: 'pointer', position: 'relative',
    }}>
      <Avatar src={a.foto} name={a.nome} size={68} />
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          marginBottom: 6,
        }}>
          <h3 style={{
            flex: 1, margin: 0, fontSize: 17, fontWeight: 700,
            color: 'var(--text)', letterSpacing: '-0.02em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}>{a.nome}</h3>
          <StatusPill status={a.status} size="sm" />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 13.5, color: 'var(--text-2)', marginBottom: 6,
          letterSpacing: '-0.005em',
        }}>
          <IconMapPin size={14} color="var(--accent)" />
          <span style={{ color: 'var(--accent)' }}>{a.cidade}</span>
        </div>
        <div style={{
          fontSize: 13, color: 'var(--text-2)',
          letterSpacing: '-0.005em',
        }}>
          Último contato: <span style={{ color: 'var(--text)', fontWeight: 500 }}>
            {a.ultimoContato}</span>
        </div>
      </div>
      <div style={{ alignSelf: 'center', color: 'var(--text-3)' }}>
        <IconChevronRight size={20} />
      </div>
    </div>
  );
};

const HomeScreen = ({ onOpen, onNewBrother, onAvatar, onBack, showBack = false,
                       role }) => {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  const tenantData = ASSISTIDOS.filter(a => a.tenant === USUARIO.tenantId);
  const filtered = tenantData.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (query && !(`${a.nome} ${a.cidade}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });
  const sorted = [...filtered].sort((x, y) =>
    STATUS_ORDER.indexOf(x.status) - STATUS_ORDER.indexOf(y.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{
        padding: '8px 22px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {showBack && (
          <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40}
                   style={{ marginLeft: -8 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!showBack && (
            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500,
                          marginBottom: 2 }}>
              Olá, {USUARIO.primeiroNome}
            </div>
          )}
          <h1 style={{
            margin: 0, fontSize: showBack ? 19 : 22, fontWeight: 700,
            letterSpacing: '-0.025em', color: 'var(--text)',
            lineHeight: 1.15,
          }}>{showBack ? 'Assistidos da localidade' : 'Meus Assistidos'}</h1>
          <div style={{ marginTop: 6 }}>
            <TenantChip tenantId={USUARIO.tenantId} size="sm" />
          </div>
        </div>
        {!showBack && (
          <button onClick={onAvatar} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          }}>
            <Avatar src={USUARIO.foto} name={USUARIO.nome} size={44}
                    online={USUARIO.online} ring={false} />
          </button>
        )}
      </div>

      <div style={{ padding: '0 22px 14px' }}>
        <SearchInput value={query} onChange={setQuery}
                     placeholder="Buscar por nome ou cidade" />
      </div>

      <div style={{ padding: '0 22px 18px' }}>
        <StatusFilterRow value={filter} onChange={setFilter} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 120px',
                    scrollbarWidth: 'none' }}>
        {sorted.length === 0 && (
          <div style={{
            padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)',
            fontSize: 13.5,
          }}>Ninguém encontrado com esse filtro.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12,
                      padding: '0 4px' }}>
          {sorted.map(a => (
            <AssistidoCard key={a.id} a={a} onOpen={() => onOpen(a.id)} />
          ))}
        </div>
      </div>

      {/* Floating FAB */}
      <button onClick={onNewBrother} style={{
        position: 'absolute', right: 22, bottom: 100,
        width: 60, height: 60, borderRadius: 30,
        background: 'var(--accent)', color: '#fff',
        border: 0, cursor: 'pointer', zIndex: 25,
        boxShadow: '0 10px 28px rgba(45,127,249,0.40), 0 2px 6px rgba(45,127,249,0.20)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconPlus size={28} sw={2.4} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DETALHES
// ─────────────────────────────────────────────────────────────

const TimelineItem = ({ item, isLast }) => {
  const kind = {
    ai: { bg: 'var(--accent-bg)', fg: 'var(--accent)', icon: <IconSparkle size={12} /> },
    nota: { bg: 'var(--surface-2)', fg: 'var(--text-2)', icon: <IconUser size={12} /> },
    sistema: { bg: 'var(--surface-2)', fg: 'var(--text-3)', icon: <IconShield size={12} /> },
  }[item.kind];
  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                    flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: kind.bg, color: kind.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{kind.icon}</div>
        {!isLast && <div style={{
          flex: 1, width: 2, background: 'var(--border)', marginTop: 4,
          borderRadius: 1,
        }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 22 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)',
                         letterSpacing: '-0.01em' }}>{item.autor}</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{item.tempo}</span>
        </div>
        <div style={{
          fontSize: 14, lineHeight: 1.5, color: 'var(--text)',
          letterSpacing: '-0.005em', textWrap: 'pretty',
        }}>{item.texto}</div>
      </div>
    </div>
  );
};

const DetalhesScreen = ({ id, onBack, onAgendar, onEditar }) => {
  const a = ASSISTIDOS.find(x => x.id === id) || ASSISTIDOS[0];
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState(a.status);
  const [timeline, setTimeline] = React.useState(a.timeline);
  const [novaNota, setNovaNota] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  // Find next scheduled meeting for this person
  const proximaReuniao = AGENDA.find(m => m.assistido === a.id);

  const addNota = () => {
    if (!novaNota.trim()) return;
    setTimeline(t => [
      ...t,
      { id: Date.now(), kind: 'nota', autor: 'Você', tempo: 'agora',
        texto: novaNota.trim() },
    ]);
    setNovaNota('');
    setAdding(false);
  };

  const markContacted = (label) => {
    setTimeline(t => [
      ...t,
      { id: Date.now(), kind: 'sistema', autor: 'Sistema', tempo: 'agora',
        texto: label },
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '4px 16px 12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700,
                     letterSpacing: '-0.015em', color: 'var(--text)' }}>
          Perfil do Assistido
        </h1>
        <IconBtn icon={<IconMore />} variant="flat" size={40} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 28px',
                    scrollbarWidth: 'none', display: 'flex', flexDirection: 'column',
                    gap: 14 }}>
        {/* Hero card */}
        <Card padding={20} style={{ display: 'flex', flexDirection: 'column',
                                     alignItems: 'center', textAlign: 'center', gap: 12 }}>
          <Avatar src={a.foto} name={a.nome} size={86} />
          <div>
            <h2 style={{
              margin: 0, fontSize: 22, fontWeight: 700,
              letterSpacing: '-0.025em', color: 'var(--text)',
            }}>{a.nome}</h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
              justifyContent: 'center',
              fontSize: 13.5, color: 'var(--text-2)',
            }}>
              <IconMapPin size={14} color="var(--accent)" />
              <span style={{ color: 'var(--accent)' }}>{a.cidade}</span>
            </div>
          </div>
          <StatusPill status={status} size="md" />
          <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
            <Button variant="whatsapp" size="md" icon={<IconWhatsappFilled />} full
                    onClick={() => window.open(`https://wa.me/${a.telefone.replace(/\D/g,'')}`, '_blank')}>
              WhatsApp
            </Button>
            <Button variant="secondary" size="md" icon={<IconCalendar />} full
                    onClick={() => onAgendar && onAgendar(a.id)}>
              Reunião
            </Button>
          </div>
        </Card>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto',
                      padding: '0 2px 4px', scrollbarWidth: 'none' }}>
          {[
            { ic: <IconPhone />, l: 'Liguei agora',
              act: () => markContacted('Ligação registrada por Você') },
            { ic: <IconCheck />, l: 'Marcar como contatado',
              act: () => markContacted('Contato registrado por Você') },
            { ic: <IconHeart />, l: 'Oração',
              act: () => markContacted('Momento de oração registrado por Você') },
          ].map(q => (
            <button key={q.l} onClick={q.act} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 999,
              background: 'var(--surface)', border: '1px solid var(--border)',
              fontSize: 12.5, fontWeight: 600, color: 'var(--text)',
              letterSpacing: '-0.005em', whiteSpace: 'nowrap',
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}>
              <span style={{ color: 'var(--accent)', display: 'flex' }}>
                {React.cloneElement(q.ic, { size: 14 })}
              </span>
              {q.l}
            </button>
          ))}
        </div>

        {/* Próxima reunião */}
        {proximaReuniao && (
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{ width: 4, background: 'var(--accent)' }} />
              <div style={{ flex: 1, padding: '14px 18px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                  fontSize: 11, color: 'var(--accent)', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  <IconCalendar size={12} /> Próxima reunião
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                              letterSpacing: '-0.01em' }}>
                  {proximaReuniao.titulo}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
                  {proximaReuniao.quando} · {proximaReuniao.local}
                </div>
              </div>
              <button style={{
                width: 56, background: 'transparent', border: 0,
                color: 'var(--text-3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><IconChevronRight size={18} /></button>
            </div>
          </Card>
        )}

        {/* Informações */}
        <Card padding={0}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                           letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Informações de contato
            </span>
            <button onClick={() => onEditar && onEditar(a.id)} style={{
              background: 'transparent', border: 0, padding: 4,
              color: 'var(--accent)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '-0.005em',
            }}>Editar</button>
          </div>
          <KVRow icon={<IconPhone />} label="Telefone" value={a.telefone} />
          <KVRow icon={<IconMapPin />} label="Cidade" value={a.cidade} />
          <KVRow icon={<IconUser />} label="Cuidador atual"
                 value={a.cuidador || 'Não atribuído'} />
          <KVRow icon={<IconClock />} label="Último contato"
                 value={a.ultimoContato} last />
        </Card>

        {/* Status changer */}
        <Card padding={0} style={{ overflow: 'visible' }}>
          <button onClick={() => setOpen(o => !o)} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '16px 18px',
            background: 'transparent', border: 0, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)',
                           letterSpacing: '-0.01em' }}>Atualizar status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusPill status={status} size="sm" />
              <IconChevronDown size={18}
                style={{ transform: open ? 'rotate(180deg)' : 'none',
                         transition: 'transform .15s', color: 'var(--text-3)' }} />
            </div>
          </button>
          {open && (
            <div style={{
              borderTop: '1px solid var(--border)', padding: 8,
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              {STATUS_ORDER.map(k => (
                <button key={k}
                  onClick={() => {
                    setStatus(k); setOpen(false);
                    markContacted(`Status alterado para "${STATUS[k].label}"`);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 14px', borderRadius: 12,
                    background: status === k ? 'var(--accent-bg)' : 'transparent',
                    border: 0, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusPill status={k} size="sm" />
                  </span>
                  {status === k && <IconCheck size={18} color="var(--accent)" sw={2.4} />}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Resumo IA */}
        <Card padding={18}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <IconSparkle size={14} />
            Resumo do agente
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.55, color: 'var(--text)',
            letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>{a.resumo}</div>
        </Card>

        {/* Timeline */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            padding: '6px 6px 12px',
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>Linha do tempo</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)',
                           fontVariantNumeric: 'tabular-nums' }}>
              {timeline.length} {timeline.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <Card padding={20}>
            {timeline.map((it, i) => (
              <TimelineItem key={it.id} item={it}
                            isLast={i === timeline.length - 1} />
            ))}

            {/* Add note inline */}
            <div style={{
              marginTop: 18, paddingTop: 18,
              borderTop: '1px dashed var(--border)',
            }}>
              {!adding ? (
                <button onClick={() => setAdding(true)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'var(--surface-2)', border: '1px dashed var(--border-strong)',
                  color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.005em',
                  textAlign: 'left',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--accent-bg)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}><IconPlus size={14} /></div>
                  <span>Registrar uma nota ou observação</span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea autoFocus value={novaNota}
                            onChange={(e) => setNovaNota(e.target.value)}
                            placeholder="Ex: Liguei e conversei por 20 min. Combinamos visita para sexta."
                            rows={3}
                            style={{
                              padding: '12px 14px',
                              background: 'var(--surface)',
                              border: '1.5px solid var(--accent)',
                              borderRadius: 12, resize: 'none',
                              fontFamily: 'inherit', fontSize: 14,
                              color: 'var(--text)', outline: 'none',
                              letterSpacing: '-0.005em', lineHeight: 1.5,
                              boxShadow: '0 0 0 4px rgba(45,127,249,0.10)',
                            }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="ghost" size="sm" full
                            onClick={() => { setAdding(false); setNovaNota(''); }}>
                      Cancelar
                    </Button>
                    <Button variant="primary" size="sm" full
                            disabled={!novaNota.trim()}
                            icon={<IconCheck />}
                            onClick={addNota}>
                      Salvar nota
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Key-Value row used inside info card
const KVRow = ({ icon, label, value, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px',
    borderBottom: last ? 'none' : '1px solid var(--border)',
  }}>
    {icon && (
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: 'var(--surface-2)', color: 'var(--text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{React.cloneElement(icon, { size: 15 })}</div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600,
                    letterSpacing: '0.02em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500,
                    letterSpacing: '-0.005em', marginTop: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// EDITAR ASSISTIDO
// ─────────────────────────────────────────────────────────────
const EditarAssistidoScreen = ({ id, onBack, onSave }) => {
  const a = ASSISTIDOS.find(x => x.id === id) || ASSISTIDOS[0];
  const [form, setForm] = React.useState({
    nome: a.nome, telefone: a.telefone, cidade: a.cidade,
    contexto: '', familia: '', observacoes: '',
  });
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
          Editar informações
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 10, padding: '8px 0 4px' }}>
          <div style={{ position: 'relative' }}>
            <Avatar src={a.foto} name={a.nome} size={88} />
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              border: '3px solid var(--bg)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IconPlus size={16} sw={2.4} /></div>
          </div>
          <button style={{
            background: 'transparent', border: 0, padding: 4,
            color: 'var(--accent)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '-0.005em',
          }}>Alterar foto</button>
        </div>

        <Input label="Nome completo" value={form.nome}
               onChange={update('nome')} icon={<IconUser />} />
        <Input label="Telefone (WhatsApp)" value={form.telefone}
               onChange={update('telefone')} icon={<IconPhone />} />
        <Input label="Cidade" value={form.cidade}
               onChange={update('cidade')} icon={<IconMapPin />} />

        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '8px 4px 0',
        }}>Contexto pastoral</div>

        <Textarea label="Família / referências"
                  value={form.familia} onChange={update('familia')}
                  placeholder="Esposa, filhos, parentes próximos, igreja de origem..." />
        <Textarea label="Contexto / situação atual"
                  value={form.contexto} onChange={update('contexto')}
                  placeholder="O que está vivendo agora? Há quanto tempo? Quem mais sabe?"
                  rows={5} />
        <Textarea label="Observações para o cuidador"
                  value={form.observacoes} onChange={update('observacoes')}
                  placeholder="Sensibilidades, melhor horário, preferências de contato..." />
      </div>

      <div style={{ padding: '16px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full disabled={!valid}
                icon={<IconCheck />}
                onClick={() => onSave(form)}>
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// AGENDAR REUNIÃO
// ─────────────────────────────────────────────────────────────
const AgendarReuniaoScreen = ({ id, onBack, onSave }) => {
  const a = ASSISTIDOS.find(x => x.id === id);
  const [tipo, setTipo] = React.useState('presencial');
  const [form, setForm] = React.useState({
    titulo: a ? `Visita · ${a.nome.split(' ').slice(0, 2).join(' ')}` : '',
    data: '', hora: '19:00',
    duracao: '60', local: '', notas: '', notificar: true,
  });
  const update = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  // Sensible defaults: tomorrow
  React.useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    update('data')(d.toISOString().slice(0, 10));
  }, []);

  const tipos = [
    { k: 'presencial', l: 'Visita presencial', ic: <IconMapPin /> },
    { k: 'online', l: 'Reunião online', ic: <IconVideo /> },
    { k: 'ligacao', l: 'Ligação', ic: <IconPhone /> },
  ];

  const valid = form.titulo && form.data && form.hora;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, marginRight: 40, textAlign: 'center',
                     fontSize: 17, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>
          Agendar reunião
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 18 }}>
        {a && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            background: 'var(--accent-bg)', borderRadius: 14,
            border: '1px solid rgba(45,127,249,0.18)',
          }}>
            <Avatar src={a.foto} name={a.nome} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                            letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Reunião com
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                            letterSpacing: '-0.005em', marginTop: 1 }}>
                {a.nome}
              </div>
            </div>
            <StatusPill status={a.status} size="xs" />
          </div>
        )}

        {/* Tipo */}
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.005em', marginBottom: 10 }}>
            Tipo de reunião
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {tipos.map(t => {
              const active = tipo === t.k;
              return (
                <button key={t.k} onClick={() => setTipo(t.k)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 6, padding: '14px 8px', borderRadius: 14,
                  background: active ? 'var(--surface)' : 'var(--surface)',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  boxShadow: active ? '0 4px 12px rgba(45,127,249,0.12)' : 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: active ? 'var(--accent-bg)' : 'var(--surface-2)',
                    color: active ? 'var(--accent)' : 'var(--text-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{React.cloneElement(t.ic, { size: 18 })}</div>
                  <span style={{ fontSize: 12, fontWeight: 600,
                                 color: active ? 'var(--text)' : 'var(--text-2)',
                                 letterSpacing: '-0.005em', textAlign: 'center',
                                 lineHeight: 1.3 }}>
                    {t.l}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Input label="Título" value={form.titulo}
               onChange={update('titulo')}
               placeholder="Ex: Visita semanal" />

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
          <Input label="Data" value={form.data}
                 onChange={update('data')} type="date" />
          <Input label="Hora" value={form.hora}
                 onChange={update('hora')} type="time" />
        </div>

        <Select label="Duração" value={form.duracao} onChange={update('duracao')}
                options={[
                  { value: '15', label: '15 minutos' },
                  { value: '30', label: '30 minutos' },
                  { value: '45', label: '45 minutos' },
                  { value: '60', label: '1 hora' },
                  { value: '90', label: '1h 30min' },
                  { value: '120', label: '2 horas' },
                ]} />

        <Input
          label={tipo === 'online' ? 'Link da reunião'
                : tipo === 'ligacao' ? 'Telefone (auto-preenchido)'
                : 'Local'}
          value={form.local} onChange={update('local')}
          placeholder={tipo === 'online' ? 'Cole o link do Meet/Zoom'
                      : tipo === 'ligacao' ? a?.telefone || '+55...'
                      : 'Endereço completo'}
          icon={tipo === 'online' ? <IconVideo />
                : tipo === 'ligacao' ? <IconPhone /> : <IconMapPin />} />

        <Textarea label="Observações (opcional)"
                  value={form.notas} onChange={update('notas')}
                  placeholder="Pontos importantes a tratar, preparação, etc." />

        {/* Notificar */}
        <Card padding={0}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#DCFCE7', color: '#16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}><IconWhatsappFilled size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)',
                            letterSpacing: '-0.005em' }}>
                Notificar pelo WhatsApp
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                {a?.nome.split(' ')[0]} receberá o convite com o link.
              </div>
            </div>
            <button onClick={() => update('notificar')(!form.notificar)} style={{
              position: 'relative', width: 46, height: 28, borderRadius: 999,
              background: form.notificar ? '#22C55E' : 'var(--border-strong)',
              border: 0, cursor: 'pointer', padding: 0, transition: 'background .15s',
              flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', top: 3, left: form.notificar ? 21 : 3,
                width: 22, height: 22, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .15s',
              }} />
            </button>
          </div>
        </Card>
      </div>

      <div style={{ padding: '16px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full disabled={!valid}
                icon={<IconCalendar />}
                onClick={() => onSave({ ...form, tipo, assistido: a?.id })}>
          Agendar e adicionar à agenda
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// AGENDA
// ─────────────────────────────────────────────────────────────

const AgendaItem = ({ m, onOpen }) => {
  const a = m.assistido ? ASSISTIDOS.find(x => x.id === m.assistido) : null;
  const isOnline = m.tipo === 'online';
  return (
    <Card padding={0} onClick={onOpen} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{
          width: 6, background: m.urgente ? 'var(--status-urgente)' : 'var(--accent)',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, padding: '16px 18px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
            fontSize: 12, color: m.urgente ? 'var(--status-urgente)' : 'var(--accent)',
            fontWeight: 700, letterSpacing: '-0.005em',
          }}>
            <IconClock size={14} />
            <span>{m.quando}</span>
            <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>· {m.duracao}</span>
          </div>
          <div style={{
            fontSize: 15.5, fontWeight: 700, color: 'var(--text)',
            letterSpacing: '-0.015em', marginBottom: 6,
          }}>{m.titulo}</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 12.5, color: 'var(--text-2)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {isOnline ? <IconVideo size={13} /> : <IconMapPin size={13} />}
              {m.local}
            </span>
            {a && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                             marginLeft: 'auto' }}>
                <Avatar src={a.foto} name={a.nome} size={22} />
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                  {a.nome.split(' ')[0]}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const AgendaScreen = ({ onOpenAssistido }) => {
  const tenantMeets = AGENDA.filter(m => m.tenant === USUARIO.tenantId);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <ScreenHeader
        title="Agenda"
        tenantId={USUARIO.tenantId}
        right={<IconBtn icon={<IconPlus />} variant="tinted" size={44} />}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 120px',
                    scrollbarWidth: 'none' }}>
        <SectionTitle action={
          <span style={{ fontSize: 12, color: 'var(--text-3)',
                         fontVariantNumeric: 'tabular-nums' }}>
            {tenantMeets.length} agendamentos
          </span>
        }>Próximas reuniões</SectionTitle>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tenantMeets.map(m => (
            <AgendaItem key={m.id} m={m}
                        onOpen={() => m.assistido && onOpenAssistido(m.assistido)} />
          ))}
        </div>

        <div style={{ padding: '24px 0 8px' }}>
          <SectionTitle>Esta semana</SectionTitle>
          <Card padding={20}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'var(--accent-bg)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><IconCalendar size={26} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)',
                              letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                  4 visitas
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                  2 presenciais · 2 online
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MENSAGENS · ChatAI
// ─────────────────────────────────────────────────────────────

const SUGGESTED = [
  'Cadastrar nova irmã Joana em Manaus como aguardando',
  'Quem está aguardando hoje?',
  'Resumo da semana na Adrianópolis',
  'Mudar status do Carlos para acompanhamento',
];

const ChatBubble = ({ m, onOpenAssistido }) => {
  const isUser = m.from === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10, alignItems: 'flex-end', marginBottom: 10,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--accent-bg)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}><IconSparkle size={16} /></div>
      )}
      <div style={{
        maxWidth: '80%',
        padding: '12px 16px',
        background: isUser ? 'var(--accent)' : 'var(--surface)',
        color: isUser ? '#fff' : 'var(--text)',
        border: isUser ? 'none' : '1px solid var(--border)',
        borderRadius: 18,
        borderBottomRightRadius: isUser ? 6 : 18,
        borderBottomLeftRadius: isUser ? 18 : 6,
        fontSize: 14.5, lineHeight: 1.5, letterSpacing: '-0.005em',
        textWrap: 'pretty', whiteSpace: 'pre-wrap',
        boxShadow: isUser ? '0 4px 14px rgba(45,127,249,0.25)' : 'none',
      }}>
        {m.text}
        {m.link && (
          <button onClick={() => onOpenAssistido(m.link.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 10, padding: '10px 14px', width: '100%',
            background: 'rgba(255,255,255,0.16)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
            color: 'inherit', fontSize: 13, fontWeight: 600,
          }}>
            <IconUser size={14} />
            Abrir perfil de {m.link.nome}
            <IconChevronRight size={14} style={{ marginLeft: 'auto' }} />
          </button>
        )}
      </div>
    </div>
  );
};

const MensagensScreen = ({ onOpenAssistido }) => {
  const [messages, setMessages] = React.useState([
    { id: 1, from: 'ai',
      text: `Olá, ${USUARIO.primeiroNome}. Sou o agente da Central. Posso cadastrar irmãos, mudar status, e responder sobre os casos da Adrianópolis. Como posso ajudar?` },
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setInput('');
    setMessages(m => [...m, { id: Date.now(), from: 'user', text: t }]);
    setLoading(true);

    const lc = t.toLowerCase();
    const matched = ASSISTIDOS
      .filter(a => a.tenant === USUARIO.tenantId)
      .find(a => a.nome.toLowerCase().split(' ').some(w => w.length > 3 && lc.includes(w.toLowerCase())));
    const link = matched ? { id: matched.id, nome: matched.nome.split(' ').slice(0,2).join(' ') } : null;

    let reply = null;
    try {
      const tenant = tenantById(USUARIO.tenantId);
      const casos = ASSISTIDOS.filter(a => a.tenant === USUARIO.tenantId);
      const ctx = `Você é o agente de IA da Central de Acolhimento, atuando dentro da localidade "${tenant.nome}" (${tenant.cidade}). Tom: acolhedor, pastoral, breve (max 3 frases curtas), PT-BR.
Casos atuais nesta localidade: ${casos.map(a => `${a.nome} (${STATUS[a.status].label})`).join('; ')}.
Cuidador: ${USUARIO.nome}.
Quando o usuário pedir cadastros, mudanças de status ou buscas, confirme o que vai fazer e descreva a próxima ação.`;
      const r = await window.claude.complete({
        messages: [{ role: 'user', content: `${ctx}\n\nComando: ${t}` }],
      });
      reply = String(r || '').trim();
    } catch (e) { reply = null; }

    if (!reply) {
      if (lc.includes('cadastr')) reply = 'Pronto, cadastrei e marquei como Aguardando até alguém assumir o caso.';
      else if (lc.includes('aguard')) reply = `Hoje temos Roberto Mendes e Lúcia Helena aguardando vinculação na Adrianópolis.`;
      else if (lc.includes('semana')) reply = 'Na Adrianópolis: 4 visitas agendadas, 1 caso urgente (Carlos Silva), 2 aguardando cuidador.';
      else if (lc.includes('mudar') || lc.includes('mude')) reply = 'Status atualizado e cuidador atual notificado.';
      else reply = 'Posso te ajudar com cadastros, mudanças de status, buscas ou um resumo da localidade. Tente: "Quem está aguardando hoje?"';
    }

    setLoading(false);
    setMessages(m => [...m, { id: Date.now()+1, from: 'ai', text: reply, link }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)',
                  paddingBottom: 76 /* clear the bottom nav */ }}>
      <ScreenHeader
        title="Mensagens"
        tenantId={USUARIO.tenantId}
        right={
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'var(--accent-bg)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><IconSparkle size={22} /></div>
        }
      />

      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '4px 20px 8px',
        scrollbarWidth: 'none',
      }}>
        {messages.map(m => <ChatBubble key={m.id} m={m} onOpenAssistido={onOpenAssistido} />)}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0 12px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-bg)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IconSparkle size={16} /></div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--text-3)',
                  animation: `chatDot 1.2s ${i * 0.15}s infinite ease-in-out`,
                }} />
              ))}
            </div>
            <style>{`@keyframes chatDot { 0%,80%,100% { opacity:.3; transform:scale(.85)} 40% { opacity:1; transform:scale(1)} }`}</style>
          </div>
        )}

        {messages.length === 1 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              fontSize: 11, color: 'var(--text-3)', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '6px 4px',
            }}>Sugestões</div>
            {SUGGESTED.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                textAlign: 'left', padding: '14px 16px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, color: 'var(--text)', fontSize: 13.5,
                fontFamily: 'inherit', cursor: 'pointer',
                letterSpacing: '-0.005em', lineHeight: 1.4,
              }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px 28px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 24, padding: '6px 6px 6px 18px',
        }}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && send()}
                 placeholder="Pergunte ou comande..."
                 style={{
                   flex: 1, border: 0, outline: 'none', background: 'transparent',
                   fontFamily: 'inherit', fontSize: 14.5, color: 'var(--text)',
                   minWidth: 0,
                 }} />
          <IconBtn icon={<IconMic />} variant="flat" size={36} />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{
            width: 40, height: 40, borderRadius: '50%',
            background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
            color: '#fff', border: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .15s',
          }}><IconSend size={17} /></button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// AJUSTES (with multi-tenant switcher + role toggle)
// ─────────────────────────────────────────────────────────────

const SettingsRow = ({ icon, label, value, hint, toggle, onToggle, onClick, accent }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 18px',
    cursor: onClick ? 'pointer' : 'default',
    borderBottom: '1px solid var(--border)',
  }}>
    {icon && (
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent ? 'var(--accent-bg)' : 'var(--surface-2)',
        color: accent ? 'var(--accent)' : 'var(--text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{React.cloneElement(icon, { size: 18 })}</div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14.5, color: 'var(--text)', fontWeight: 600,
                    letterSpacing: '-0.01em' }}>{label}</div>
      {hint && <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>{hint}</div>}
    </div>
    {toggle ? (
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
        position: 'relative', width: 46, height: 28, borderRadius: 999,
        background: value ? '#22C55E' : 'var(--border-strong)',
        border: 0, cursor: 'pointer', padding: 0, transition: 'background .15s',
        flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 22, height: 22, borderRadius: '50%', background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .15s',
        }} />
      </button>
    ) : value ? (
      <div style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 500 }}>{value}</div>
    ) : (
      onClick && <IconChevronRight size={18} color="var(--text-3)" />
    )}
  </div>
);

const SettingsSection = ({ title, children }) => (
  <div style={{ padding: '0 18px 18px' }}>
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '4px 8px 10px',
    }}>{title}</div>
    <Card padding={0}>
      {React.Children.map(children, (c, i, arr) => c &&
        React.cloneElement(c, {
          style: i === React.Children.count(children) - 1
            ? { ...(c.props.style||{}), borderBottom: 'none' } : c.props.style,
        }))}
    </Card>
  </div>
);

const AjustesScreen = ({ role, onRole, onSwitchTenant, onEquipe, onAssinatura,
                          onDashboard, dark, onDark }) => {
  const [notif, setNotif] = React.useState(true);
  const t = tenantById(USUARIO.tenantId);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <ScreenHeader title="Ajustes" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 120px',
                    scrollbarWidth: 'none' }}>

        {/* Profile card */}
        <div style={{ padding: '0 18px 18px' }}>
          <Card padding={20} style={{
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <Avatar src={USUARIO.foto} name={USUARIO.nome} size={64}
                    online={USUARIO.online} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)',
                               letterSpacing: '-0.02em' }}>{USUARIO.nome}</span>
                <IconVerified size={15} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                {USUARIO.papel} · {USUARIO.telefone}
              </div>
            </div>
            <IconBtn icon={<IconChevronRight />} variant="flat" size={36} />
          </Card>
        </div>

        <SettingsSection title="Localidade ativa">
          <div style={{ padding: '16px 18px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: t.cor, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
            }}>{t.sigla}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)',
                            letterSpacing: '-0.01em' }}>
                Comunidade {t.nome}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
                {t.cidade} · {t.cuidadores} cuidadores
              </div>
            </div>
          </div>
          <SettingsRow icon={<IconSwap />} label="Trocar de localidade"
                       hint={`Você participa de ${TENANTS.length} localidades`}
                       onClick={onSwitchTenant} accent />
        </SettingsSection>

        {role === 'lider' && (
          <SettingsSection title="Liderança">
            <SettingsRow icon={<IconUsers />} label="Equipe de cuidadores"
                         hint={`${CUIDADORES_ATIVOS.filter(c => c.tenant === USUARIO.tenantId).length} ativos · ${APROVACOES_PENDENTES.length} pendentes`}
                         onClick={onEquipe} accent />
            <SettingsRow icon={<IconSparkle />} label="Assinatura"
                         hint="Plano Pró · próxima cobrança 12/06"
                         onClick={onAssinatura} accent />
          </SettingsSection>
        )}

        <SettingsSection title="Visão do protótipo">
          <div style={{ padding: '14px 18px 12px',
                        borderBottom: '1px solid var(--border)' }}>
            <div style={{
              display: 'flex', padding: 4, borderRadius: 12,
              background: 'var(--surface-2)',
            }}>
              {['cuidador', 'lider'].map(r => (
                <button key={r} onClick={() => onRole(r)} style={{
                  flex: 1, padding: '11px 12px', borderRadius: 9,
                  background: role === r ? 'var(--surface)' : 'transparent',
                  border: 0, color: role === r ? 'var(--accent)' : 'var(--text-2)',
                  fontWeight: 600, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                  boxShadow: role === r ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  letterSpacing: '-0.005em',
                }}>{r === 'cuidador' ? 'Cuidador' : 'Líder'}</button>
              ))}
            </div>
            <div style={{
              fontSize: 11.5, color: 'var(--text-3)', padding: '10px 4px 0',
              lineHeight: 1.4,
            }}>
              A visão Líder libera aprovações e o funil completo.
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Notificações">
          <SettingsRow icon={<IconWhatsapp />} label="Avisos no WhatsApp"
                       toggle value={notif} onToggle={() => setNotif(n => !n)} />
          <SettingsRow icon={<IconBell />} label="Casos urgentes" value="Sempre" />
        </SettingsSection>

        <SettingsSection title="Aparência">
          <SettingsRow icon={<IconShield />} label="Modo escuro"
                       toggle value={dark} onToggle={() => onDark(!dark)} />
        </SettingsSection>

        <div style={{ padding: '0 18px 24px' }}>
          <Button variant="secondary" size="md" icon={<IconLogout />} full>
            Sair da conta
          </Button>
        </div>

        <div style={{ padding: '0 22px 24px', textAlign: 'center',
                      fontSize: 11.5, color: 'var(--text-3)' }}>
          Central de Acolhimento · v0.1 · {t.nome}
        </div>
      </div>
    </div>
  );
};

// Tenant switcher modal
const TenantSwitcher = ({ onClose, onPick }) => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 100,
    background: 'rgba(15,23,42,0.32)',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
  }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: 'var(--surface)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: '12px 22px 32px',
    }}>
      <div style={{ width: 40, height: 5, background: 'var(--border-strong)',
                    borderRadius: 999, margin: '4px auto 18px' }} />
      <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700,
                   color: 'var(--text)', letterSpacing: '-0.02em' }}>
        Trocar de localidade
      </h3>
      <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text-2)',
                  lineHeight: 1.5, letterSpacing: '-0.005em' }}>
        Cada localidade é um espaço fechado — os assistidos, cuidadores e
        agenda são separados.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TENANTS.map(t => {
          const active = t.id === USUARIO.tenantId;
          return (
            <button key={t.id} onClick={() => onPick(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 14px', borderRadius: 14,
              border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent-bg)' : 'var(--surface)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: t.cor, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14,
              }}>{t.sigla}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                              letterSpacing: '-0.01em' }}>
                  Comunidade {t.nome}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  {t.cidade} · {t.cuidadores} cuidadores · {t.membros} membros
                </div>
              </div>
              {active && <IconCheck size={20} color="var(--accent)" sw={2.4} />}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

// Novo irmão (FAB target)
const NovoIrmaoScreen = ({ onBack, onSave }) => {
  const [form, setForm] = React.useState({ nome: '', telefone: '', cidade: '',
                                            status: 'aguardando', obs: '' });
  const update = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.nome && form.telefone;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, textAlign: 'center', marginRight: 40,
                     margin: 0, fontSize: 17, fontWeight: 700,
                     color: 'var(--text)', letterSpacing: '-0.015em' }}>
          Novo Assistido
        </h1>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Input label="Nome Completo" value={form.nome} onChange={update('nome')}
               placeholder="Ex: Joana da Silva" icon={<IconUser />} />
        <Input label="Telefone (WhatsApp)" value={form.telefone}
               onChange={update('telefone')}
               placeholder="(00) 00000-0000" icon={<IconPhone />} />
        <Input label="Cidade" value={form.cidade} onChange={update('cidade')}
               placeholder="Cidade onde se encontra" icon={<IconMapPin />} />
        <Select label="Status inicial" value={form.status} onChange={update('status')}
                options={STATUS_ORDER.map(k => ({ value: k, label: STATUS[k].label }))} />
        <Textarea label="Observação (opcional)" value={form.obs}
                  onChange={update('obs')}
                  placeholder="Contexto, indicação, dúvidas iniciais..." />
      </div>
      <div style={{
        padding: '16px 22px 28px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <Button variant="primary" full disabled={!valid}
                onClick={() => onSave(form)}>
          Cadastrar e notificar liderança
        </Button>
      </div>
    </div>
  );
};

// Pendentes (líder)
const PendentesScreen = ({ onBack }) => {
  const [list, setList] = React.useState(APROVACOES_PENDENTES);
  const act = (id) => setList(l => l.filter(x => x.id !== id));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 12px',
                    display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700,
                     color: 'var(--text)', letterSpacing: '-0.015em' }}>
          Aprovações pendentes
        </h1>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.length === 0 && (
          <div style={{
            padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)',
            fontSize: 14,
          }}>Tudo em dia ✓</div>
        )}
        {list.map(p => (
          <Card key={p.id} padding={18}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <Avatar name={p.nome} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text)',
                              letterSpacing: '-0.015em' }}>{p.nome}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                  {p.cidade} · {p.igreja}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.quando}</div>
            </div>
            <div style={{
              fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5,
              letterSpacing: '-0.005em', marginBottom: 14, textWrap: 'pretty',
              padding: '0 4px',
            }}>"{p.bio}"</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="md" icon={<IconCheck />} full
                      onClick={() => act(p.id)}>Aprovar</Button>
              <Button variant="secondary" size="md" icon={<IconX />} full
                      onClick={() => act(p.id)}>Recusar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, {
  HomeScreen, DetalhesScreen, EditarAssistidoScreen, AgendarReuniaoScreen,
  AgendaScreen, MensagensScreen, AjustesScreen,
  TenantSwitcher, NovoIrmaoScreen, PendentesScreen,
});
