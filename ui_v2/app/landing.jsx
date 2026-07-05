// app/landing.jsx — Marketing landing page for Acolhe
// Reuses the app design system + actual app screens as live mockups

// ─── Small bits ──────────────────────────────────────────────────
const LandingNav = ({ onLogin, onSignup }) => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', f);
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all .25s',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 24,
      }}>
        <a href="#top" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', color: 'inherit',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><IconHeart size={17} /></div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.025em',
                         color: 'var(--text)' }}>Acolhe</span>
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}
             className="ln-mid">
          {[
            ['Funcionalidades', '#features'],
            ['Como funciona', '#how'],
            ['Preços', '#pricing'],
            ['Perguntas', '#faq'],
          ].map(([l, h]) => (
            <a key={h} href={h} style={{
              fontSize: 14, fontWeight: 600, color: 'var(--text-2)',
              textDecoration: 'none', letterSpacing: '-0.005em',
            }}>{l}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onLogin} style={{
            background: 'transparent', border: 0, padding: '8px 4px',
            fontSize: 14, fontWeight: 600, color: 'var(--text)',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.005em',
          }}>Entrar</button>
          <Button variant="primary" size="sm" onClick={onSignup}>
            Criar localidade
          </Button>
        </div>
      </div>
    </header>
  );
};

// ─── HERO ────────────────────────────────────────────────────────
const HeroSection = ({ onSignup }) => (
  <section id="top" style={{
    position: 'relative', overflow: 'hidden',
    paddingTop: 60, paddingBottom: 80,
    background: 'var(--bg)',
  }}>
    {/* soft accent glow */}
    <div style={{
      position: 'absolute', top: -200, right: -120, width: 600, height: 600,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(45,127,249,0.16) 0%, transparent 70%)',
      pointerEvents: 'none', zIndex: 0,
    }} />
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px',
                  position: 'relative', zIndex: 1 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 60,
        alignItems: 'center',
      }} className="ln-hero-grid">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999,
            background: 'var(--surface)', border: '1px solid var(--border)',
            fontSize: 12.5, fontWeight: 700, color: 'var(--accent)',
            letterSpacing: '-0.005em',
            boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
          }}>
            <IconSparkle size={13} />
            <span style={{ color: 'var(--text-2)' }}>Agente IA pastoral</span>
            <span style={{ color: 'var(--text-3)' }}>·</span>
            <span style={{ color: 'var(--text)' }}>Beta aberta</span>
          </div>

          <h1 style={{
            margin: '24px 0 0', fontSize: 64, fontWeight: 800,
            letterSpacing: '-0.045em', color: 'var(--text)', lineHeight: 1.02,
            textWrap: 'balance',
          }}>
            Cuide do seu rebanho{' '}
            <span style={{
              background: 'linear-gradient(120deg, #2D7FF9 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', display: 'inline-block',
            }}>como nunca antes.</span>
          </h1>

          <p style={{
            margin: '24px 0 0', fontSize: 19, lineHeight: 1.5,
            color: 'var(--text-2)', letterSpacing: '-0.01em', maxWidth: 520,
            textWrap: 'pretty',
          }}>
            A Acolhe é uma central de cuidado pastoral para comunidades de fé.
            Cada localidade tem seu espaço fechado, com agente de IA que ajuda
            cuidadores a acompanhar irmãos com amor e organização.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                        marginTop: 36, flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" iconRight={<IconArrowRight />}
                    onClick={onSignup}>
              Criar minha localidade
            </Button>
            <Button variant="secondary" size="lg" icon={<IconVideo />}>
              Ver demonstração
            </Button>
          </div>

          <div style={{
            marginTop: 28, display: 'flex', alignItems: 'center', gap: 14,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
              {[68, 47, 45, 20, 33].map((id, i) => (
                <div key={i} style={{
                  marginLeft: -8, width: 30, height: 30, borderRadius: '50%',
                  background: '#E2E8F0',
                  border: '2px solid var(--bg)', overflow: 'hidden',
                  position: 'relative', zIndex: 5 - i,
                }}>
                  <img src={`https://i.pravatar.cc/60?img=${id}`} alt=""
                       style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
                    <path d="M12 2l3.1 6.3 7 1-5 4.9 1.2 7-6.3-3.3-6.3 3.3L7 14.2l-5-4.9 7-1z"/>
                  </svg>
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>+240 comunidades</span> já acolhendo
              </span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', height: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}
             className="ln-hero-phones">
          {/* secondary phone behind */}
          <div style={{
            position: 'absolute', left: -10, top: 60,
            transform: 'rotate(-7deg) scale(0.84)',
            transformOrigin: 'center', zIndex: 1, opacity: 0.85,
          }}>
            <PhoneFrame>
              <FullApp initialStage="app" initialRole="cuidador" />
            </PhoneFrame>
          </div>
          {/* primary phone */}
          <div style={{
            position: 'relative', zIndex: 2,
            transform: 'rotate(2deg)',
          }}>
            <PhoneFrame>
              <FullApp initialStage="app" initialRole="cuidador" />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── LOGOS / SOCIAL PROOF ────────────────────────────────────────
const SocialProof = () => (
  <section style={{
    padding: '40px 32px', background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
  }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)',
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    marginBottom: 28 }}>
        Comunidades em todo o Brasil já confiam
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 56, flexWrap: 'wrap', opacity: 0.6 }}>
        {[
          'Adrianópolis · AM', 'Vila Mariana · SP', 'Aldeota · CE',
          'Batel · PR', 'Pituba · BA', 'Boa Viagem · PE',
        ].map(c => (
          <span key={c} style={{
            fontSize: 15, fontWeight: 700, color: 'var(--text-2)',
            letterSpacing: '-0.015em',
          }}>{c}</span>
        ))}
      </div>
    </div>
  </section>
);

// ─── PROBLEM / SOLUTION SPLIT ────────────────────────────────────
const SplitSection = () => (
  <section style={{ padding: '100px 32px', background: 'var(--bg)' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <SectionLabel>Por que existe</SectionLabel>
        <h2 style={{
          margin: '14px 0 0', fontSize: 44, fontWeight: 800,
          letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.1,
          textWrap: 'balance',
        }}>
          Acolher dá trabalho.
          <br />
          <span style={{ color: 'var(--text-3)' }}>Esquecer dói mais.</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}
           className="ln-split">
        <Card padding={36} style={{ borderRadius: 24,
          border: '1px solid rgba(220,38,38,0.16)',
          background: 'linear-gradient(180deg, #FFF1F2 0%, var(--surface) 100%)',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px', borderRadius: 999,
                        background: '#FEE2E2', color: '#B91C1C',
                        fontSize: 11.5, fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        marginBottom: 18 }}>
            <IconX size={12} sw={3} /> Sem a Acolhe
          </div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800,
                       letterSpacing: '-0.025em', color: 'var(--text)' }}>
            Mensagens espalhadas
          </h3>
          <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55,
                      color: 'var(--text-2)', letterSpacing: '-0.005em',
                      textWrap: 'pretty' }}>
            Anotações em caderno, grupos de WhatsApp sobrecarregados,
            cuidadores duplicando trabalho. O irmão que mais precisa some
            no meio do barulho.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10,
                        marginTop: 22 }}>
            {[
              'Quem ligou para o Carlos esta semana?',
              'A Lúcia voltou ao culto depois da visita?',
              'Quem vai cuidar do Pedro até sexta?',
            ].map(q => (
              <div key={q} style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: 13.5, color: 'var(--text-2)',
                letterSpacing: '-0.005em', fontStyle: 'italic',
              }}>{q}</div>
            ))}
          </div>
        </Card>

        <Card padding={36} style={{ borderRadius: 24,
          border: '1px solid rgba(45,127,249,0.20)',
          background: 'linear-gradient(180deg, #EFF6FF 0%, var(--surface) 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px', borderRadius: 999,
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 11.5, fontWeight: 700,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        marginBottom: 18 }}>
            <IconSparkle size={12} /> Com a Acolhe
          </div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800,
                       letterSpacing: '-0.025em', color: 'var(--text)' }}>
            Tudo em um só canal
          </h3>
          <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55,
                      color: 'var(--text-2)', letterSpacing: '-0.005em',
                      textWrap: 'pretty' }}>
            Localidade fechada, agenda compartilhada, histórico de cada
            assistido. O agente de IA responde dúvidas, sugere ações e
            organiza o que importa.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                        marginTop: 22 }}>
            {[
              ['Carlos teve visita ontem às 19h', 'concluido'],
              ['Lúcia voltou ao culto · 2 semanas seguidas', 'acompanhamento'],
              ['Pedro: 3 cuidadores se revezando', 'acompanhamento'],
            ].map(([t, s]) => (
              <div key={t} style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: 13.5, color: 'var(--text)',
                letterSpacing: '-0.005em',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <StatusDot status={s} size={8} />
                {t}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </section>
);

const SectionLabel = ({ children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 12px', borderRadius: 999,
    background: 'var(--accent-bg)', color: 'var(--accent)',
    fontSize: 11.5, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%',
                   background: 'var(--accent)' }} />
    {children}
  </span>
);

// ─── FEATURES GRID ───────────────────────────────────────────────
const FeatureCard = ({ icon, title, body, cor = 'var(--accent)', bg = 'var(--accent-bg)' }) => (
  <Card padding={28} style={{ display: 'flex', flexDirection: 'column', gap: 16,
                              borderRadius: 22, height: '100%' }}>
    <div style={{
      width: 52, height: 52, borderRadius: 14,
      background: bg, color: cor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{React.cloneElement(icon, { size: 26 })}</div>
    <div>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700,
                   letterSpacing: '-0.02em', color: 'var(--text)' }}>{title}</h3>
      <p style={{ margin: '8px 0 0', fontSize: 14.5, lineHeight: 1.5,
                  color: 'var(--text-2)', letterSpacing: '-0.005em',
                  textWrap: 'pretty' }}>{body}</p>
    </div>
  </Card>
);

const FeaturesSection = () => (
  <section id="features" style={{ padding: '100px 32px', background: 'var(--surface)' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 720,
                    margin: '0 auto 56px' }}>
        <SectionLabel>Funcionalidades</SectionLabel>
        <h2 style={{
          margin: '14px 0 0', fontSize: 44, fontWeight: 800,
          letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.1,
          textWrap: 'balance',
        }}>
          Tudo que sua equipe de cuidadores precisa.
        </h2>
        <p style={{
          margin: '16px auto 0', fontSize: 17, lineHeight: 1.55,
          color: 'var(--text-2)', letterSpacing: '-0.005em', maxWidth: 560,
          textWrap: 'pretty',
        }}>
          Construído desde o início para o ritmo real de uma comunidade —
          não é CRM corporativo.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
      }} className="ln-features">
        <FeatureCard icon={<IconUsers />} title="Localidade fechada"
          body="Cada igreja tem seu espaço próprio. Dados não se misturam — só sua liderança e cuidadores enxergam."
          cor="#2D7FF9" bg="#E8F1FE" />
        <FeatureCard icon={<IconSparkle />} title="Agente IA pastoral"
          body="Cadastre irmãos, mude status e busque informações com linguagem natural. A IA conhece sua localidade."
          cor="#7C3AED" bg="rgba(124,58,237,0.12)" />
        <FeatureCard icon={<IconWhatsapp />} title="Conexão por WhatsApp"
          body="Login, convites e notificações vão pelo WhatsApp. Sem cadastros complicados — sua equipe entra em segundos."
          cor="#16A34A" bg="rgba(34,197,94,0.12)" />
        <FeatureCard icon={<IconCalendar />} title="Agenda compartilhada"
          body="Visitas, ligações e reuniões em um só lugar. Toda a equipe sabe quem está cuidando de quem."
          cor="#EA580C" bg="#FFEDD5" />
        <FeatureCard icon={<IconShield />} title="Aprovação por liderança"
          body="Cuidadores se cadastram ou são convidados. A liderança aprova quem entra — proteção real para os assistidos."
          cor="#0F172A" bg="var(--surface-2)" />
        <FeatureCard icon={<IconChart />} title="Histórico que dura"
          body="Linha do tempo de cada irmão. Notas, decisões, marcos. Nada se perde quando alguém deixa a equipe."
          cor="#0891B2" bg="#CFFAFE" />
      </div>
    </div>
  </section>
);

// IconChart is now defined in icons.jsx — no local fallback needed.

// ─── HOW IT WORKS ────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    { n: '01', t: 'Crie sua localidade',
      d: 'Líder responsável faz o cadastro em 5 passos: identidade, OTP, dados da comunidade, personalização e plano.' },
    { n: '02', t: 'Convide a equipe',
      d: 'Cuidadores recebem o convite pelo WhatsApp e entram direto, sem análise. Sua liderança controla quem participa.' },
    { n: '03', t: 'Comece a acolher',
      d: 'Cadastre os assistidos, marque visitas, atualize status. O agente de IA ajuda a manter o ritmo.' },
  ];
  return (
    <section id="how" style={{ padding: '100px 32px', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionLabel>Como funciona</SectionLabel>
          <h2 style={{
            margin: '14px 0 0', fontSize: 44, fontWeight: 800,
            letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.1,
            textWrap: 'balance',
          }}>De zero ao primeiro acolhimento em <span style={{ color: 'var(--accent)' }}>10 minutos</span>.</h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
        }} className="ln-features">
          {steps.map(s => (
            <div key={s.n}>
              <div style={{
                fontSize: 56, fontWeight: 800,
                letterSpacing: '-0.04em',
                background: 'linear-gradient(180deg, var(--accent) 0%, transparent 110%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 8, lineHeight: 1,
              }}>{s.n}</div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700,
                           letterSpacing: '-0.025em', color: 'var(--text)' }}>{s.t}</h3>
              <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55,
                          color: 'var(--text-2)', letterSpacing: '-0.005em',
                          textWrap: 'pretty' }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── AI HIGHLIGHT WITH CHAT MOCKUP ───────────────────────────────
const AISection = () => (
  <section style={{
    padding: '100px 32px',
    background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
    color: '#fff', position: 'relative', overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: -200, left: -100, width: 500, height: 500,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(124,58,237,0.30) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', bottom: -200, right: -100, width: 500, height: 500,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(45,127,249,0.22) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 0.9fr', gap: 56,
        alignItems: 'center',
      }} className="ln-ai-grid">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(124,58,237,0.2)', color: '#C4B5FD',
            fontSize: 11.5, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            <IconSparkle size={13} />
            Agente IA pastoral
          </div>
          <h2 style={{
            margin: '20px 0 0', fontSize: 48, fontWeight: 800,
            letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.05,
            textWrap: 'balance',
          }}>
            Sua liderança conversa,
            <br /><span style={{
              background: 'linear-gradient(90deg, #C4B5FD 0%, #93C5FD 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>a IA executa.</span>
          </h2>
          <p style={{
            margin: '20px 0 0', fontSize: 18, lineHeight: 1.55,
            color: '#94A3B8', letterSpacing: '-0.005em', maxWidth: 520,
            textWrap: 'pretty',
          }}>
            Cadastre, mude status, marque visitas ou peça resumos no
            linguajar mais natural possível. O agente conhece sua localidade
            e responde no tom certo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10,
                        marginTop: 28, maxWidth: 480 }}>
            {[
              'Cadastre o irmão João da Silva, aguardando',
              'Quem visitou a Lúcia esta semana?',
              'Marca uma visita pro Carlos na sexta às 19h',
            ].map(q => (
              <div key={q} style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 14, color: '#E2E8F0',
                letterSpacing: '-0.005em', fontStyle: 'italic',
              }}>"{q}"</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="app-light">
            <PhoneFrame dark={false}>
              <FullApp initialStage="app" initialRole="cuidador" />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── PRICING ─────────────────────────────────────────────────────
const PricingCard = ({ p, onClick }) => (
  <div style={{
    padding: 32, borderRadius: 24,
    background: 'var(--surface)',
    border: p.destaque ? '2px solid var(--accent)' : '1px solid var(--border)',
    boxShadow: p.destaque
      ? '0 24px 60px rgba(45,127,249,0.18), 0 0 0 6px rgba(45,127,249,0.08)'
      : '0 1px 2px rgba(15,23,42,0.04)',
    position: 'relative',
    display: 'flex', flexDirection: 'column', gap: 18,
    transform: p.destaque ? 'scale(1.03)' : 'none',
  }}>
    {p.destaque && (
      <div style={{
        position: 'absolute', top: -12, left: '50%',
        transform: 'translateX(-50%)',
        padding: '5px 14px', borderRadius: 999,
        background: 'var(--accent)', color: '#fff',
        fontSize: 11, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>Mais escolhido</div>
    )}

    <div>
      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)',
                    letterSpacing: '-0.025em' }}>{p.nome}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 4,
                    lineHeight: 1.45, letterSpacing: '-0.005em' }}>{p.descricao}</div>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 48, fontWeight: 800, color: 'var(--text)',
                     letterSpacing: '-0.04em', lineHeight: 1,
                     fontVariantNumeric: 'tabular-nums' }}>
        {formatBRL(p.preco)}
      </span>
      <span style={{ fontSize: 15, color: 'var(--text-2)', fontWeight: 500 }}>
        /mês
      </span>
    </div>

    <Button variant={p.destaque ? 'primary' : 'secondary'} full
            onClick={onClick}>
      {p.destaque ? 'Começar 14 dias grátis' : 'Escolher plano'}
    </Button>

    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {p.features.map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
            background: f.ok ? 'rgba(34,197,94,0.16)' : 'var(--surface-2)',
            color: f.ok ? '#16A34A' : 'var(--text-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {f.ok ? <IconCheck size={11} sw={3} /> : <IconX size={10} sw={2.5} />}
          </div>
          <span style={{ fontSize: 14, lineHeight: 1.45, letterSpacing: '-0.005em',
                         color: f.ok ? 'var(--text)' : 'var(--text-3)' }}>
            {f.txt}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const PricingSection = ({ onSignup }) => (
  <section id="pricing" style={{ padding: '100px 32px', background: 'var(--bg)' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 56, maxWidth: 720,
                    margin: '0 auto 56px' }}>
        <SectionLabel>Preços</SectionLabel>
        <h2 style={{
          margin: '14px 0 0', fontSize: 44, fontWeight: 800,
          letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.1,
          textWrap: 'balance',
        }}>
          Um líder paga.
          <br />
          <span style={{ color: 'var(--text-3)' }}>Toda a equipe usa.</span>
        </h2>
        <p style={{
          margin: '16px auto 0', fontSize: 16, lineHeight: 1.55,
          color: 'var(--text-2)', letterSpacing: '-0.005em', maxWidth: 520,
          textWrap: 'pretty',
        }}>
          Cuidadores convidados não pagam nada. Cancele a qualquer momento,
          sem multa e sem fidelidade.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        maxWidth: 800, margin: '0 auto',
      }} className="ln-pricing">
        {PLANOS.map(p => (
          <PricingCard key={p.id} p={p} onClick={onSignup} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 999,
          background: 'var(--surface)', border: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-2)',
          letterSpacing: '-0.005em',
        }}>
          <IconLock size={14} color="var(--text-3)" />
          Pagamento processado pela Stripe · 14 dias grátis em ambos os planos
        </div>
      </div>
    </div>
  </section>
);

// ─── FAQ ─────────────────────────────────────────────────────────
const FaqItem = ({ q, a, open, onClick }) => (
  <div style={{
    padding: '20px 24px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16, cursor: 'pointer',
  }} onClick={onClick}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16,
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)',
                     letterSpacing: '-0.015em' }}>{q}</span>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: open ? 'var(--accent)' : 'var(--surface-2)',
        color: open ? '#fff' : 'var(--text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all .2s',
      }}>
        {open ? <IconX size={14} /> : <IconPlus size={14} />}
      </div>
    </div>
    {open && (
      <div style={{
        marginTop: 14, fontSize: 14.5, lineHeight: 1.6,
        color: 'var(--text-2)', letterSpacing: '-0.005em',
        textWrap: 'pretty', maxWidth: 760,
      }}>{a}</div>
    )}
  </div>
);

const FaqSection = () => {
  const [open, setOpen] = React.useState(0);
  const items = [
    { q: 'O que é uma "localidade"?',
      a: 'É o espaço fechado da sua igreja ou comunidade dentro da Acolhe. Cada localidade tem sua equipe, seus assistidos, sua agenda — nada se mistura com outras. Você é o líder responsável dela.' },
    { q: 'Os cuidadores precisam pagar?',
      a: 'Não. A assinatura cobre toda a equipe da localidade. Quem paga é apenas o líder responsável. Cuidadores convidados entram pelo WhatsApp em segundos, sem cartão, sem fricção.' },
    { q: 'Como funciona o agente de IA?',
      a: 'Ele conhece sua localidade e responde em português natural. Você pode cadastrar irmãos, mudar status, marcar visitas e pedir resumos só conversando. No plano Essencial são 200 interações/mês; no Pró é ilimitado.' },
    { q: 'Posso cancelar quando quiser?',
      a: 'Sim. Sem fidelidade, sem multa. Você mantém acesso até o fim do período já pago e seus dados ficam disponíveis por mais 90 dias para exportação.' },
    { q: 'Os dados dos assistidos são seguros?',
      a: 'Sim. Localidades são totalmente isoladas, somente sua equipe enxerga os casos. Pagamentos via Stripe (PCI-DSS Level 1). Você decide quem entra e quem sai da equipe.' },
    { q: 'Funciona em vários celulares ao mesmo tempo?',
      a: 'Sim. Todo cuidador acessa pelo próprio aparelho via WhatsApp. Atualizações são sincronizadas em tempo real para toda a equipe.' },
  ];
  return (
    <section id="faq" style={{ padding: '100px 32px', background: 'var(--surface)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <SectionLabel>Perguntas frequentes</SectionLabel>
          <h2 style={{
            margin: '14px 0 0', fontSize: 44, fontWeight: 800,
            letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.1,
          }}>Dúvidas comuns.</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((it, i) => (
            <FaqItem key={i} {...it}
                     open={open === i}
                     onClick={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FINAL CTA ───────────────────────────────────────────────────
const FinalCTA = ({ onSignup }) => (
  <section style={{ padding: '80px 32px', background: 'var(--bg)' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        padding: '64px 48px', borderRadius: 32,
        background: 'linear-gradient(135deg, #2D7FF9 0%, #7C3AED 100%)',
        color: '#fff', position: 'relative', overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', top: -100, left: -50, width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -150, right: -80, width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            margin: 0, fontSize: 44, fontWeight: 800,
            letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.05,
            textWrap: 'balance',
          }}>
            Sua comunidade merece um cuidado <em style={{
              fontStyle: 'italic', fontWeight: 800,
            }}>organizado</em>.
          </h2>
          <p style={{
            margin: '20px auto 0', fontSize: 17, lineHeight: 1.55,
            color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.005em',
            maxWidth: 480, textWrap: 'pretty',
          }}>
            Comece a usar a Acolhe agora — 14 dias grátis, sem cartão de
            crédito necessário.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <button onClick={onSignup} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 54, padding: '0 24px',
              background: '#fff', color: 'var(--accent)',
              border: 0, borderRadius: 14,
              fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer', letterSpacing: '-0.01em',
              boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
            }}>
              Criar minha localidade
              <IconArrowRight size={18} />
            </button>
            <button style={{
              background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)',
              color: '#fff', height: 54, padding: '0 24px',
              borderRadius: 14, fontSize: 15.5, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}>Falar com vendas</button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── FOOTER ──────────────────────────────────────────────────────
const Footer = () => (
  <footer style={{ padding: '60px 32px 40px',
                   background: 'var(--surface)',
                   borderTop: '1px solid var(--border)' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40,
      }} className="ln-footer">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IconHeart size={17} /></div>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.025em' }}>
              Acolhe
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)',
                      lineHeight: 1.55, letterSpacing: '-0.005em',
                      maxWidth: 280, textWrap: 'pretty' }}>
            Central de acolhimento pastoral para comunidades de fé.
            Feita com ❤️ no Brasil.
          </p>
        </div>
        {[
          ['Produto', ['Funcionalidades', 'Preços', 'Agente IA', 'Novidades']],
          ['Empresa', ['Sobre', 'Blog', 'Contato', 'Imprensa']],
          ['Legal', ['Termos de uso', 'Privacidade', 'LGPD', 'Cookies']],
        ].map(([t, links]) => (
          <div key={t}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          marginBottom: 14 }}>{t}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map(l => (
                <a key={l} href="#" style={{
                  fontSize: 13.5, color: 'var(--text-2)',
                  textDecoration: 'none', letterSpacing: '-0.005em',
                }}>{l}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
          © 2026 Acolhe · CNPJ 00.000.000/0001-00
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
          v0.1 · Manaus, AM
        </div>
      </div>
    </div>
  </footer>
);

// ─── ROOT ────────────────────────────────────────────────────────
const LandingPage = ({ onLaunchApp }) => {
  const go = () => onLaunchApp && onLaunchApp();
  return (
    <div className="app-light" style={{
      background: 'var(--bg)', color: 'var(--text)',
      fontFamily: 'var(--font-sans)', minHeight: '100vh',
    }}>
      <LandingNav onLogin={go} onSignup={go} />
      <HeroSection onSignup={go} />
      <SocialProof />
      <SplitSection />
      <FeaturesSection />
      <HowItWorks />
      <AISection />
      <PricingSection onSignup={go} />
      <FaqSection />
      <FinalCTA onSignup={go} />
      <Footer />
    </div>
  );
};

Object.assign(window, { LandingPage });
