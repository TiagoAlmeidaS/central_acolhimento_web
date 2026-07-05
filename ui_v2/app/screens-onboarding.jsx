// app/screens-onboarding.jsx — entry flow: Login → Cadastro → Análise

// ─────────────────────────────────────────────────────────────
// T1 · LOGIN
// ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin, onSignup }) => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg)', padding: '0 28px',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', gap: 22,
                    paddingTop: 40 }}>
        <BrandMark size={86} />
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <h1 style={{
            margin: 0, fontSize: 30, fontWeight: 800,
            letterSpacing: '-0.035em', color: 'var(--text)',
            lineHeight: 1.1,
          }}>Central de Acolhimento</h1>
          <p style={{
            margin: '14px 0 0', fontSize: 15.5, lineHeight: 1.55,
            color: 'var(--text-2)', letterSpacing: '-0.005em',
            textWrap: 'pretty',
          }}>
            Gerencie e cuide dos irmãos assistidos com amor e eficiência.
          </p>
        </div>
      </div>

      <div style={{ paddingBottom: 28, display: 'flex', flexDirection: 'column',
                    gap: 18, alignItems: 'center' }}>
        <Button variant="whatsapp" icon={<IconWhatsappFilled />} full
                onClick={onLogin}>
          Entrar com WhatsApp
        </Button>
        <button onClick={onSignup} style={{
          background: 'transparent', border: 0, padding: 4,
          color: 'var(--accent)', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          letterSpacing: '-0.01em',
        }}>Cadastre-se aqui</button>
        <div style={{ height: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
        <div style={{
          fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center',
          letterSpacing: '-0.005em', lineHeight: 1.5, maxWidth: 320,
        }}>
          Ao entrar, você concorda com nossos{' '}
          <span style={{ textDecoration: 'underline' }}>Termos de Uso</span> e{' '}
          <span style={{ textDecoration: 'underline' }}>Política de Privacidade</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// T2 · CADASTRO DE CUIDADOR
// ─────────────────────────────────────────────────────────────

const CADASTRO_HERO = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=900&q=80';

const CadastroScreen = ({ onBack, onSubmit }) => {
  const [form, setForm] = React.useState({
    nome: '', telefone: '', uf: '', cidade: '', igreja: '', bio: '',
  });
  const update = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.nome && form.telefone && form.uf && form.cidade && form.igreja;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        padding: '8px 18px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        <h1 style={{
          flex: 1, textAlign: 'center', margin: 0, marginRight: 40,
          fontSize: 17, fontWeight: 700, color: 'var(--text)',
          letterSpacing: '-0.015em',
        }}>Cadastro de Cuidador</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px',
                    scrollbarWidth: 'none' }}>
        {/* Hero photo with overlay text */}
        <div style={{
          height: 168, borderRadius: 18, overflow: 'hidden',
          marginBottom: 22, position: 'relative',
          background: `linear-gradient(180deg, rgba(15,23,42,0) 50%, rgba(15,23,42,0.6) 100%), url(${CADASTRO_HERO}) center/cover, var(--surface-2)`,
        }}>
          <div style={{
            position: 'absolute', bottom: 16, left: 18,
            color: '#fff', fontSize: 20, fontWeight: 700,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>Central de Acolhimento</div>
        </div>

        <h2 style={{
          margin: '0 0 8px', fontSize: 26, fontWeight: 800,
          letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1,
        }}>Junte-se à equipe</h2>
        <p style={{
          margin: '0 0 24px', fontSize: 14.5, color: 'var(--text-2)',
          lineHeight: 1.55, letterSpacing: '-0.005em', textWrap: 'pretty',
        }}>
          Preencha os campos abaixo para solicitar seu acesso como cuidador e
          comece a impactar vidas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18,
                      paddingBottom: 24 }}>
          <Input label="Nome Completo" value={form.nome} onChange={update('nome')}
                 placeholder="Ex: Maria Silva" icon={<IconUser />} />
          <Input label="Telefone (WhatsApp)" value={form.telefone}
                 onChange={update('telefone')}
                 placeholder="(00) 00000-0000" icon={<IconPhone />} />
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
            <Select label="Estado" value={form.uf} onChange={update('uf')}
                    placeholder="UF" options={UFS} />
            <Select label="Cidade" value={form.cidade} onChange={update('cidade')}
                    placeholder="Nome da cidade"
                    options={['Manaus','São Paulo','Fortaleza','Curitiba','Recife',
                              'Salvador','Belém','Goiânia','Rio de Janeiro']} />
          </div>
          <Input label="Localidade da Igreja" value={form.igreja}
                 onChange={update('igreja')}
                 placeholder="Ex: Central · Zona Sul" icon={<IconChurch />} />
          <Textarea label="Mini-biografia" value={form.bio} onChange={update('bio')}
                    placeholder="Conte um pouco sobre sua experiência e por que deseja ser um cuidador..." />
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        padding: '16px 22px 28px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <Button variant="primary" full iconRight={<IconArrowRight />}
                disabled={!valid} onClick={() => onSubmit(form)}>
          Solicitar Acesso
        </Button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// T2.5 · CADASTRO EM ANÁLISE
// ─────────────────────────────────────────────────────────────
const AnaliseScreen = ({ onCheck, onLogout }) => {
  const steps = [
    { label: 'Enviado', icon: <IconCheck /> },
    { label: 'Análise', icon: <IconHourglass /> },
    { label: 'Acesso', icon: <IconLock /> },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      {/* Mini brand bar */}
      <div style={{
        padding: '8px 22px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--accent-bg)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><IconUsersFilled size={22} /></div>
        <h1 style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 700,
                     color: 'var(--text)', letterSpacing: '-0.015em' }}>
          Central de Acolhimento
        </h1>
        <IconBtn icon={<IconHelpCircle />} variant="soft" size={36} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 22px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Illustration block — geometric, not hand-drawn */}
        <div style={{
          height: 220, borderRadius: 24, background: '#FED7AA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            width: 130, height: 150, background: '#fff', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
            transform: 'rotate(-4deg)',
            padding: '20px 18px',
            display: 'flex', flexDirection: 'column', gap: 9, justifyContent: 'flex-start',
          }}>
            {[60, 80, 50, 70, 40].map((w, i) => (
              <div key={i} style={{
                height: 5, width: `${w}%`,
                background: '#E2E8F0', borderRadius: 999,
              }} />
            ))}
            <div style={{ marginTop: 'auto', width: 18, height: 22,
                          borderRadius: 2,
                          background: '#FCA5A5',
                          alignSelf: 'flex-end',
                          clipPath: 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)' }} />
          </div>
          {/* Magnifying glass */}
          <div style={{
            position: 'absolute', left: '35%', top: '50%',
            transform: 'translate(-50%, -30%)',
            width: 78, height: 78, borderRadius: '50%',
            border: '7px solid #0F172A',
            background: 'rgba(255,255,255,0.12)',
          }} />
          <div style={{
            position: 'absolute', left: '50%', top: '74%',
            width: 38, height: 7, background: '#0F172A',
            borderRadius: 4, transform: 'rotate(40deg)',
          }} />
        </div>

        <div>
          <h2 style={{
            margin: '0 0 10px', fontSize: 24, fontWeight: 800,
            letterSpacing: '-0.025em', color: 'var(--text)',
            lineHeight: 1.15, textAlign: 'center',
          }}>Cadastro em Análise</h2>
          <p style={{
            margin: 0, fontSize: 14.5, color: 'var(--text-2)',
            lineHeight: 1.55, letterSpacing: '-0.005em',
            textAlign: 'center', textWrap: 'pretty',
          }}>
            Sua solicitação foi recebida. Para garantir a segurança dos
            irmãos assistidos, a liderança está validando seu perfil.
          </p>
        </div>

        <div style={{ padding: '6px 0 4px' }}>
          <StatusStepper steps={steps} current={1} />
        </div>

        <InfoBanner>
          Este processo geralmente leva até{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>24 horas</span>.
          Você receberá uma notificação assim que seu acesso for liberado.
        </InfoBanner>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="primary" full icon={<IconRefresh />} onClick={onCheck}>
            Verificar Status
          </Button>
          <Button variant="secondary" full icon={<IconLogout />} onClick={onLogout}>
            Sair / Logout
          </Button>
        </div>

        <Card padding={18} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.01em', marginBottom: 4 }}>
            Precisa de ajuda urgente?
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12,
                        lineHeight: 1.5, letterSpacing: '-0.005em' }}>
            Fale com a liderança da sua localidade para agilizar o processo.
          </div>
          <Button variant="link" iconRight={<IconArrowRight />} size="md">
            Falar com o Suporte
          </Button>
        </Card>
      </div>
    </div>
  );
};

Object.assign(window, { LoginScreen, CadastroScreen, AnaliseScreen });
