// app/screens-billing.jsx — Subscription flow for tenant leaders
// Routes: PlanosScreen → CheckoutScreen → SucessoScreen
//         AssinaturaAtivaScreen (manage) → FaturasScreen / CancelarScreen

// ─── Plan data ───────────────────────────────────────────────────
const PLANOS = [
  {
    id: 'essencial',
    nome: 'Essencial',
    preco: 19.90,
    descricao: 'Para localidades começando o trabalho de acolhimento.',
    cor: '#2D7FF9',
    limites: {
      assistidos: '50 assistidos',
      cuidadores: '8 cuidadores',
    },
    features: [
      { ok: true, txt: 'Cadastro ilimitado por mês' },
      { ok: true, txt: 'Agente IA com 200 interações/mês' },
      { ok: true, txt: 'Agenda compartilhada' },
      { ok: true, txt: 'Convites por WhatsApp' },
      { ok: false, txt: 'Relatórios em PDF' },
      { ok: false, txt: 'Suporte prioritário' },
    ],
  },
  {
    id: 'pro',
    nome: 'Pró',
    preco: 29.90,
    descricao: 'Para comunidades com equipes maiores e mais demanda.',
    cor: '#7C3AED',
    destaque: true,
    limites: {
      assistidos: 'Assistidos ilimitados',
      cuidadores: 'Cuidadores ilimitados',
    },
    features: [
      { ok: true, txt: 'Tudo do Essencial' },
      { ok: true, txt: 'Agente IA ilimitado' },
      { ok: true, txt: 'Relatórios em PDF semanais' },
      { ok: true, txt: 'Múltiplas localidades' },
      { ok: true, txt: 'Suporte prioritário no WhatsApp' },
      { ok: true, txt: 'Histórico completo (sem expiração)' },
    ],
  },
];

// Mock current subscription state
const ASSINATURA_MOCK = {
  status: 'ativa', // 'ativa' | 'trial' | 'vencida' | 'cancelada'
  plano: 'pro',
  proximaCobranca: '12/06/2026',
  cartao: { brand: 'Visa', last4: '4242' },
  faturas: [
    { id: 'f1', data: '12/05/2026', valor: 29.90, status: 'pago' },
    { id: 'f2', data: '12/04/2026', valor: 29.90, status: 'pago' },
    { id: 'f3', data: '12/03/2026', valor: 19.90, status: 'pago' },
    { id: 'f4', data: '12/02/2026', valor: 19.90, status: 'pago' },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────
const formatBRL = (n) => `R$ ${n.toFixed(2).replace('.', ',')}`;

const CheckRow = ({ ok, children }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '3px 0' }}>
    <div style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
      background: ok ? 'rgba(34,197,94,0.14)' : 'var(--surface-2)',
      color: ok ? '#16A34A' : 'var(--text-3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {ok ? <IconCheck size={11} sw={3} /> : <IconX size={10} sw={2.5} />}
    </div>
    <span style={{
      fontSize: 13.5, lineHeight: 1.45, letterSpacing: '-0.005em',
      color: ok ? 'var(--text)' : 'var(--text-3)',
      textDecoration: ok ? 'none' : 'line-through',
    }}>{children}</span>
  </div>
);

const PlanCard = ({ p, selected, onClick }) => {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left',
      padding: 20, borderRadius: 20,
      background: selected ? 'var(--surface)' : 'var(--surface)',
      border: `2px solid ${selected ? p.cor : 'var(--border)'}`,
      cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: selected
        ? `0 8px 28px ${p.cor}28, 0 0 0 4px ${p.cor}15`
        : '0 1px 2px rgba(15,23,42,0.04)',
      transition: 'all .15s',
      position: 'relative', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {p.destaque && (
        <div style={{
          position: 'absolute', top: -10, right: 16,
          padding: '4px 10px', borderRadius: 999,
          background: p.cor, color: '#fff',
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>Mais escolhido</div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 19, fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.025em',
          }}>{p.nome}</div>
          <div style={{
            fontSize: 13, color: 'var(--text-2)', marginTop: 4,
            lineHeight: 1.45, letterSpacing: '-0.005em',
          }}>{p.descricao}</div>
        </div>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: `2px solid ${selected ? p.cor : 'var(--border-strong)'}`,
          background: selected ? p.cor : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 2,
        }}>{selected && <IconCheck size={12} sw={3.5} color="#fff" />}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontSize: 36, fontWeight: 800, color: 'var(--text)',
          letterSpacing: '-0.04em', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>{formatBRL(p.preco)}</span>
        <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>
          /mês
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {Object.values(p.limites).map(l => (
          <span key={l} style={{
            fontSize: 11.5, fontWeight: 600,
            padding: '4px 9px', borderRadius: 8,
            background: 'var(--surface-2)', color: 'var(--text-2)',
            letterSpacing: '-0.005em',
          }}>{l}</span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
                    paddingTop: 4 }}>
        {p.features.map((f, i) => (
          <CheckRow key={i} ok={f.ok}>{f.txt}</CheckRow>
        ))}
      </div>
    </button>
  );
};

// ─── 1. PlanosScreen ─────────────────────────────────────────────
const PlanosScreen = ({ onBack, onContinue }) => {
  const [pick, setPick] = React.useState('pro');
  const planoEscolhido = PLANOS.find(p => p.id === pick);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, marginRight: 40, textAlign: 'center',
                     fontSize: 17, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>
          Escolha um plano
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 16px',
                    scrollbarWidth: 'none' }}>
        <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(34,197,94,0.12)', color: '#15803D',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', marginBottom: 12,
          }}>
            <IconSparkle size={12} />
            14 dias grátis
          </div>
          <h2 style={{
            margin: 0, fontSize: 26, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.15,
          }}>
            Mantenha sua localidade
            <br /><span style={{ color: 'var(--accent)' }}>acolhendo bem.</span>
          </h2>
          <p style={{
            margin: '12px 16px 0', fontSize: 14, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            Você é o líder responsável — paga uma vez por mês e libera o
            sistema para toda a equipe.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14,
                      paddingTop: 8, paddingBottom: 8 }}>
          {PLANOS.map(p => (
            <PlanCard key={p.id} p={p}
                      selected={pick === p.id}
                      onClick={() => setPick(p.id)} />
          ))}
        </div>

        <div style={{
          marginTop: 18, padding: '14px 16px',
          background: 'var(--surface-2)', borderRadius: 14,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <IconShield size={18} color="var(--text-2)"
                      style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: 'var(--text-2)',
                        lineHeight: 1.5, letterSpacing: '-0.005em' }}>
            Pagamento processado pela{' '}
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>Stripe</span>.
            Cancele a qualquer momento. Sem multa, sem fidelidade.
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full iconRight={<IconArrowRight />}
                onClick={() => onContinue(planoEscolhido)}>
          Continuar com {planoEscolhido.nome} · {formatBRL(planoEscolhido.preco)}/mês
        </Button>
      </div>
    </div>
  );
};

// ─── 2. CheckoutScreen — Stripe-style card form + PIX option ─────
const StripeMark = ({ size = 14 }) => (
  <svg width={size * 2.5} height={size} viewBox="0 0 60 25" fill="#635BFF">
    <path d="M59.5 14.7c0-4.3-2.1-7.7-6.1-7.7s-6.4 3.4-6.4 7.7c0 5 2.9 7.6 7 7.6 2 0 3.5-.5 4.7-1.1v-3.4c-1.1.6-2.5 1-4.1 1-1.6 0-3-.6-3.2-2.5h8c0-.2.1-1.1.1-1.6zm-8-1.7c0-1.8 1.1-2.6 2.1-2.6 1 0 2 .8 2 2.6h-4.1zM41.4 7c-1.6 0-2.7.8-3.3 1.4l-.2-1.1H34v22l4.2-.9V22c.6.5 1.6 1.2 3.2 1.2 3.2 0 6.1-2.6 6.1-7.7 0-4.7-2.9-7.5-6.1-7.5zm-1 11.7c-1.1 0-1.7-.4-2.1-.9V12c.5-.5 1.1-.9 2.2-.9 1.7 0 2.8 1.9 2.8 4 0 2.1-1.1 3.6-2.9 3.6zM33.3 6.4l4.2-.9V2L33.3 3v3.4z" />
    <path d="M33.3 7.3h4.2v15h-4.2zM29 8.5l-.3-1.2H25v15h4.2v-10c1-1.3 2.7-1 3.2-.9V7.3c-.5-.2-2.4-.5-3.4 1.2zM20.4 3.6 16.3 4.5v13.4c0 2.5 1.9 4.3 4.4 4.3 1.4 0 2.4-.3 3-.6V18.2c-.5.2-3.3 1.1-3.3-1.6V11h3.3V7.3h-3.3V3.6zM4.2 11.7c0-.7.6-1 1.5-1 1.3 0 3 .4 4.3 1.1V7.9c-1.5-.6-2.9-.8-4.3-.8-3.5 0-5.8 1.8-5.8 4.8 0 4.7 6.5 4 6.5 6 0 .8-.7 1.1-1.7 1.1-1.4 0-3.3-.6-4.7-1.4v4c1.5.7 3.1 1 4.7 1 3.6 0 6-1.7 6-4.8-.1-5-6.5-4.3-6.5-6.1z" />
  </svg>
);

// Format card number as 4-4-4-4 with brand detection
const detectBrand = (num) => {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return null;
};

const BrandDot = ({ brand, size = 28 }) => {
  if (brand === 'visa') return (
    <div style={{
      width: size * 1.3, height: size, borderRadius: 5,
      background: '#1A1F71',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontStyle: 'italic',
      fontSize: size * 0.5, letterSpacing: '-0.02em',
    }}>VISA</div>
  );
  if (brand === 'mastercard') return (
    <div style={{
      width: size * 1.3, height: size, borderRadius: 5,
      background: '#1A1A1A', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: size * 0.55, height: size * 0.55,
                    borderRadius: '50%', background: '#EB001B',
                    position: 'absolute', left: size * 0.18 }} />
      <div style={{ width: size * 0.55, height: size * 0.55,
                    borderRadius: '50%', background: '#F79E1B', opacity: 0.85,
                    position: 'absolute', right: size * 0.18 }} />
    </div>
  );
  return (
    <div style={{
      width: size * 1.3, height: size, borderRadius: 5,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-3)',
    }}><IconLock size={size * 0.5} /></div>
  );
};

const CheckoutScreen = ({ plano, onBack, onPaid }) => {
  const [method, setMethod] = React.useState('card');
  const [card, setCard] = React.useState({ num: '', name: '', exp: '', cvc: '' });
  const [loading, setLoading] = React.useState(false);

  const brand = detectBrand(card.num);
  const numClean = card.num.replace(/\s/g, '');
  const valid = method === 'pix' || (
    numClean.length >= 13 &&
    card.name.trim().length > 2 &&
    /^\d{2}\/\d{2}$/.test(card.exp) &&
    /^\d{3,4}$/.test(card.cvc)
  );

  const updateCard = (k) => (v) => {
    if (k === 'num') {
      v = v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    } else if (k === 'exp') {
      v = v.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    } else if (k === 'cvc') {
      v = v.replace(/\D/g, '').slice(0, 4);
    }
    setCard(c => ({ ...c, [k]: v }));
  };

  const submit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onPaid(); }, 1300);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, marginRight: 40, textAlign: 'center',
                     fontSize: 17, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>
          Pagamento
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Order summary */}
        <div style={{
          padding: '18px 18px',
          background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 18,
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: plano.cor + '20', color: plano.cor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}><IconSparkle size={22} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                            letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Plano selecionado
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)',
                            letterSpacing: '-0.02em', marginTop: 2 }}>
                {plano.nome} · {tenantById(USUARIO.tenantId).nome}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>
                14 dias grátis · depois {formatBRL(plano.preco)}/mês
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        fontSize: 13.5, color: 'var(--text-2)', marginBottom: 6 }}>
            <span>Cobrado hoje</span>
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>R$ 0,00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        fontSize: 13.5, color: 'var(--text-2)' }}>
            <span>A partir de 08/06/2026</span>
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>
              {formatBRL(plano.preco)}/mês
            </span>
          </div>
        </div>

        {/* Method picker */}
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.005em', marginBottom: 10 }}>
            Método de pagamento
          </div>
          <div style={{
            display: 'flex', padding: 4, borderRadius: 12,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
          }}>
            {[
              { k: 'card', l: 'Cartão de crédito' },
              { k: 'pix', l: 'PIX' },
            ].map(o => (
              <button key={o.k} onClick={() => setMethod(o.k)} style={{
                flex: 1, padding: '11px 10px', borderRadius: 9,
                background: method === o.k ? 'var(--surface)' : 'transparent',
                border: 0, color: method === o.k ? 'var(--accent)' : 'var(--text-2)',
                fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
                cursor: 'pointer', letterSpacing: '-0.005em',
                boxShadow: method === o.k ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}>{o.l}</button>
            ))}
          </div>
        </div>

        {method === 'card' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Input label="Número do cartão" value={card.num}
                     onChange={updateCard('num')}
                     placeholder="1234 1234 1234 1234"
                     inputMode="numeric" />
              <div style={{ position: 'absolute', right: 14, bottom: 16 }}>
                <BrandDot brand={brand} size={24} />
              </div>
            </div>
            <Input label="Nome impresso no cartão" value={card.name}
                   onChange={updateCard('name')}
                   placeholder="Como aparece no cartão" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Validade" value={card.exp}
                     onChange={updateCard('exp')}
                     placeholder="MM/AA" inputMode="numeric" />
              <Input label="CVC" value={card.cvc}
                     onChange={updateCard('cvc')}
                     placeholder="123" inputMode="numeric" />
            </div>
          </div>
        ) : (
          <div style={{
            padding: '24px 18px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 18,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            textAlign: 'center',
          }}>
            {/* Stylized QR code */}
            <div style={{
              width: 160, height: 160, padding: 12,
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 14, position: 'relative',
            }}>
              <div style={{
                width: '100%', height: '100%',
                backgroundImage: `
                  repeating-linear-gradient(0deg, #0F172A 0 4px, transparent 4px 8px),
                  repeating-linear-gradient(90deg, #0F172A 0 4px, transparent 4px 8px)
                `,
                backgroundBlendMode: 'multiply',
                opacity: 0.85,
              }} />
              {/* corner markers */}
              {['0 0', 'r 0', '0 b'].map((pos, i) => {
                const [x, y] = pos.split(' ');
                return <div key={i} style={{
                  position: 'absolute', width: 28, height: 28,
                  border: '5px solid #0F172A', borderRadius: 4,
                  background: '#fff',
                  ...(x === '0' ? { left: 8 } : { right: 8 }),
                  ...(y === '0' ? { top: 8 } : { bottom: 8 }),
                }} />;
              })}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text)',
                          fontWeight: 700, letterSpacing: '-0.005em' }}>
              Escaneie com o app do seu banco
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)',
                          lineHeight: 1.5, letterSpacing: '-0.005em' }}>
              A assinatura será ativada automaticamente quando o pagamento
              for confirmado (até 1 min).
            </div>
            <Button variant="secondary" size="md" icon={<IconDoc />}>
              Copiar código PIX
            </Button>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          background: 'var(--surface-2)', borderRadius: 12,
        }}>
          <IconLock size={16} color="var(--text-2)" />
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)',
                         lineHeight: 1.4, letterSpacing: '-0.005em' }}>
            Seus dados são criptografados de ponta-a-ponta e processados pela{' '}
            <span style={{ color: 'var(--text)', fontWeight: 700 }}>Stripe</span>.
            A Acolhe não armazena dados do seu cartão.
          </span>
          <StripeMark size={11} />
        </div>
      </div>

      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)' }}>
        <Button variant="primary" full disabled={!valid || loading}
                onClick={submit}
                iconRight={loading ? null : <IconArrowRight />}>
          {loading ? 'Processando…'
            : method === 'pix' ? 'Já paguei — confirmar'
            : 'Iniciar 14 dias grátis'}
        </Button>
        <div style={{
          textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)',
          marginTop: 10, letterSpacing: '-0.005em', lineHeight: 1.4,
        }}>
          Você só será cobrado depois dos 14 dias. Cancele quando quiser.
        </div>
      </div>
    </div>
  );
};

// ─── 3. SucessoScreen ────────────────────────────────────────────
const SucessoAssinaturaScreen = ({ plano, onContinue }) => {
  const t = tenantById(USUARIO.tenantId);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 22,
                    padding: '0 28px' }}>
        <div style={{
          width: 110, height: 110, borderRadius: 32,
          background: '#DCFCE7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#16A34A',
          boxShadow: '0 16px 32px rgba(34,197,94,0.25)',
          position: 'relative',
        }}>
          <IconCheck size={58} sw={2.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 800,
            letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1,
          }}>
            Assinatura ativada!
          </h1>
          <p style={{
            margin: '14px 0 0', fontSize: 14.5, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
          }}>
            A Comunidade <span style={{ color: 'var(--text)', fontWeight: 700 }}>
            {t.nome}</span> agora está no plano <span style={{
              color: 'var(--text)', fontWeight: 700 }}>{plano?.nome || 'Pró'}</span>.
            Sua primeira cobrança será em <span style={{ color: 'var(--text)',
              fontWeight: 700 }}>08/06/2026</span>.
          </p>
        </div>

        <Card padding={18} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--accent-bg)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IconBell size={20} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
                            letterSpacing: '-0.01em' }}>
                Recibo enviado por WhatsApp
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                e por e-mail para {USUARIO.nome.split(' ')[0].toLowerCase()}@bemol.com.br
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 28px 28px' }}>
        <Button variant="primary" full iconRight={<IconArrowRight />}
                onClick={onContinue}>
          Voltar ao app
        </Button>
      </div>
    </div>
  );
};

// ─── 4. AssinaturaAtivaScreen — manage ───────────────────────────
const AssinaturaAtivaScreen = ({ onBack, onChangePlan, onFaturas, onCancel }) => {
  const plano = PLANOS.find(p => p.id === ASSINATURA_MOCK.plano);
  const t = tenantById(USUARIO.tenantId);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, marginRight: 40, textAlign: 'center',
                     fontSize: 17, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>
          Assinatura
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px',
                    scrollbarWidth: 'none' }}>
        {/* Active plan hero */}
        <div style={{ padding: '0 4px 18px' }}>
          <Card padding={20} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: 140, opacity: 0.08,
              background: `radial-gradient(circle at 100% 0%, ${plano.cor} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                            marginBottom: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 999,
                  background: 'rgba(34,197,94,0.12)', color: '#15803D',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%',
                                 background: '#16A34A' }} />
                  Ativa
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  · {t.nome}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                Plano atual
              </div>
              <div style={{
                fontSize: 32, fontWeight: 800, color: 'var(--text)',
                letterSpacing: '-0.035em', marginTop: 2, lineHeight: 1,
              }}>{plano.nome}</div>
              <div style={{
                fontSize: 14, color: 'var(--text-2)', marginTop: 8,
                display: 'flex', alignItems: 'baseline', gap: 4,
              }}>
                <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 22,
                               letterSpacing: '-0.025em',
                               fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(plano.preco)}
                </span>
                <span>/mês</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Próxima cobrança */}
        <SettingsSection title="Próxima cobrança">
          <div style={{ padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-bg)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IconCalendar size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)',
                            letterSpacing: '-0.005em' }}>
                {ASSINATURA_MOCK.proximaCobranca}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
                {formatBRL(plano.preco)} no Visa ••••{ASSINATURA_MOCK.cartao.last4}
              </div>
            </div>
          </div>
          <SettingsRow icon={<IconDoc />} label="Trocar método de pagamento"
                       onClick={() => {}} />
        </SettingsSection>

        <SettingsSection title="Plano">
          <SettingsRow icon={<IconSparkle />} label="Mudar plano"
                       hint="Atualize para Pró ou volte para Essencial"
                       onClick={onChangePlan} accent />
          <SettingsRow icon={<IconDoc />} label="Histórico de faturas"
                       hint={`${ASSINATURA_MOCK.faturas.length} cobranças anteriores`}
                       onClick={onFaturas} />
        </SettingsSection>

        <div style={{ padding: '6px 18px 8px' }}>
          <Button variant="ghost" size="md" full
                  style={{ color: 'var(--status-urgente)' }}
                  onClick={onCancel}>
            Cancelar assinatura
          </Button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)',
                      padding: '8px 22px 24px', lineHeight: 1.5,
                      letterSpacing: '-0.005em' }}>
          Você manterá acesso até o fim do período já pago.
        </div>
      </div>
    </div>
  );
};

// ─── 5. FaturasScreen ───────────────────────────────────────────
const FaturasScreen = ({ onBack }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, marginRight: 40, textAlign: 'center',
                     fontSize: 17, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>
          Faturas
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px',
                    scrollbarWidth: 'none' }}>
        <Card padding={0}>
          {ASSINATURA_MOCK.faturas.map((f, i, arr) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#DCFCE7', color: '#15803D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}><IconCheck size={18} sw={2.5} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)',
                              letterSpacing: '-0.005em' }}>
                  {formatBRL(f.valor)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  {f.data} · Visa ••••{ASSINATURA_MOCK.cartao.last4}
                </div>
              </div>
              <button style={{
                padding: '8px 12px', borderRadius: 9,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 12, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
                letterSpacing: '-0.005em',
              }}>PDF</button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ─── 6. CancelarScreen — confirmation ───────────────────────────
const CancelarScreen = ({ onBack, onCancel }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: '8px 18px 14px',
                    display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{ flex: 1, margin: 0, marginRight: 40, textAlign: 'center',
                     fontSize: 17, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>
          Cancelar assinatura
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: '#FEE2E2', color: '#DC2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          alignSelf: 'center', marginTop: 12,
        }}><IconHourglass size={36} /></div>
        <div>
          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 800,
            letterSpacing: '-0.025em', color: 'var(--text)',
            lineHeight: 1.15, textAlign: 'center',
          }}>Tem certeza?</h2>
          <p style={{
            margin: '10px 0 0', fontSize: 14, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
            textAlign: 'center',
          }}>
            Você perderá acesso ao sistema em <span style={{
              color: 'var(--text)', fontWeight: 700 }}>{ASSINATURA_MOCK.proximaCobranca}</span>.
            Os 12 assistidos da Comunidade {tenantById(USUARIO.tenantId).nome} ficarão sem acompanhamento.
          </p>
        </div>

        <Card padding={18}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.005em', marginBottom: 10 }}>
            Você vai perder:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <CheckRow ok={false}>Acesso aos casos da localidade</CheckRow>
            <CheckRow ok={false}>Agente IA com contexto</CheckRow>
            <CheckRow ok={false}>Histórico de atendimentos</CheckRow>
            <CheckRow ok={false}>Agenda compartilhada com a equipe</CheckRow>
          </div>
        </Card>

        <Card padding={18} style={{
          background: 'var(--accent-bg)',
          borderColor: 'rgba(45,127,249,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <IconSparkle size={20} color="var(--accent)"
                         style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
                            letterSpacing: '-0.005em' }}>
                Quer experimentar o Essencial?
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4,
                            lineHeight: 1.45 }}>
                Por R$ 19,90/mês você mantém o essencial e cancela quando quiser.
              </div>
              <button style={{
                padding: 0, background: 'transparent', border: 0,
                color: 'var(--accent)', fontSize: 13, fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer',
                letterSpacing: '-0.005em', marginTop: 8,
              }}>Trocar para Essencial →</button>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '14px 22px 28px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button variant="primary" full onClick={onBack}>
          Continuar com o plano Pró
        </Button>
        <button onClick={onCancel} style={{
          padding: '10px 12px', background: 'transparent', border: 0,
          color: 'var(--status-urgente)', fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          letterSpacing: '-0.005em',
        }}>Sim, cancelar mesmo assim</button>
      </div>
    </div>
  );
};

Object.assign(window, {
  PLANOS, ASSINATURA_MOCK, formatBRL,
  PlanosScreen, CheckoutScreen, SucessoAssinaturaScreen,
  AssinaturaAtivaScreen, FaturasScreen, CancelarScreen,
});
