// app/app.jsx — App shell, onboarding state machine, 4-tab main app

const FullApp = ({ initialStage = 'app', initialRole = 'cuidador',
                   initialSubscreen = null, initialSelectedId = null,
                   dark, onDark }) => {
  // Onboarding stages:
  //  'login' → 'escolha-perfil' → 'cadastro' → 'analise' → 'app'  (cuidador signup)
  //                            → 'tenant-identidade' → 'tenant-otp' →
  //                              'tenant-localidade' → 'tenant-personaliza' →
  //                              'tenant-revisao' → 'tenant-planos' →
  //                              'tenant-checkout' → 'tenant-sucesso' →
  //                              'tenant-bemvindo' → 'app'                  (líder + tenant)
  //  'convite-recebido' → 'convite-confirmar' → 'convite-bemvinda' → 'app'  (cuidador invited)
  const [stage, setStage] = React.useState(initialStage);
  const [tab, setTab] = React.useState(initialSubscreen ? 'ajustes' : 'home');
  const [role, setRole] = React.useState(initialRole);
  const [subscreen, setSubscreen] = React.useState(initialSubscreen);
  const [selectedId, setSelectedId] = React.useState(initialSelectedId);
  const [tenantOpen, setTenantOpen] = React.useState(false);
  const [lastInvite, setLastInvite] = React.useState(null);
  const [selectedPlan, setSelectedPlan] = React.useState(
    initialSubscreen === 'checkout' || initialSubscreen === 'sucesso-assinatura'
      ? { id: 'pro', nome: 'Pró', preco: 29.90, cor: '#7C3AED' } : null
  );
  // Tenant-creation collected data (líder, localidade, personaliza)
  const [tenantData, setTenantData] = React.useState({
    lider: { nome: 'Daniel Bemol', telefone: '+55 92 99988 7766' },
    localidade: { nome: 'Adrianópolis', denominacao: '',
                  cidade: 'Manaus', uf: 'AM' },
    personaliza: { sigla: 'AD', cor: '#2D7FF9' },
  });
  const mergeTenant = (patch) => setTenantData(d => ({ ...d, ...patch }));

  const openAssistido = (id) => { setSelectedId(id); setSubscreen('detalhes'); };
  const backToTab = () => setSubscreen(null);

  // ── Onboarding: login + branching ──────────────────────────
  if (stage === 'login') {
    return <LoginScreen onLogin={() => setStage('app')}
                         onSignup={() => setStage('escolha-perfil')} />;
  }
  if (stage === 'escolha-perfil') {
    return <EscolhaPerfilScreen
              onBack={() => setStage('login')}
              onLider={() => setStage('tenant-identidade')}
              onCuidador={() => setStage('cadastro')} />;
  }

  // ── Cuidador self-signup ───────────────────────────────────
  if (stage === 'cadastro') {
    return <CadastroScreen onBack={() => setStage('escolha-perfil')}
                            onSubmit={() => setStage('analise')} />;
  }
  if (stage === 'analise') {
    return <AnaliseScreen onCheck={() => setStage('app')}
                           onLogout={() => setStage('login')} />;
  }

  // ── Líder + Tenant creation flow ───────────────────────────
  if (stage === 'tenant-identidade') {
    return <TenantIdentidadeScreen data={tenantData}
              onBack={() => setStage('escolha-perfil')}
              onContinue={(p) => { mergeTenant(p); setStage('tenant-otp'); }} />;
  }
  if (stage === 'tenant-otp') {
    return <TenantOtpScreen data={tenantData}
              onBack={() => setStage('tenant-identidade')}
              onContinue={() => setStage('tenant-localidade')} />;
  }
  if (stage === 'tenant-localidade') {
    return <TenantLocalidadeScreen data={tenantData}
              onBack={() => setStage('tenant-otp')}
              onContinue={(p) => { mergeTenant(p); setStage('tenant-personaliza'); }} />;
  }
  if (stage === 'tenant-personaliza') {
    return <TenantPersonalizaScreen data={tenantData}
              onBack={() => setStage('tenant-localidade')}
              onContinue={(p) => { mergeTenant(p); setStage('tenant-revisao'); }} />;
  }
  if (stage === 'tenant-revisao') {
    return <TenantRevisaoScreen data={tenantData}
              onBack={() => setStage('tenant-personaliza')}
              onContinue={() => setStage('tenant-planos')} />;
  }
  if (stage === 'tenant-planos') {
    return <PlanosScreen
              onBack={() => setStage('tenant-revisao')}
              onContinue={(plano) => {
                setSelectedPlan(plano);
                setStage('tenant-checkout');
              }} />;
  }
  if (stage === 'tenant-checkout') {
    return <CheckoutScreen plano={selectedPlan}
              onBack={() => setStage('tenant-planos')}
              onPaid={() => setStage('tenant-sucesso')} />;
  }
  if (stage === 'tenant-sucesso') {
    return <SucessoAssinaturaScreen plano={selectedPlan}
              onContinue={() => setStage('tenant-bemvindo')} />;
  }
  if (stage === 'tenant-bemvindo') {
    return <TenantBemVindoScreen data={tenantData}
              onConvidar={() => {
                setStage('app');
                setRole('lider');
                setTab('ajustes');
                setSubscreen('convidar');
              }}
              onIrParaApp={() => {
                setStage('app');
                setRole('lider');
                setTab('home');
              }} />;
  }

  // ── Invited cuidador path ──────────────────────────────────
  if (stage === 'convite-recebido') {
    return <ConviteRecebidoScreen
              onAccept={() => setStage('convite-confirmar')}
              onDecline={() => setStage('login')} />;
  }
  if (stage === 'convite-confirmar') {
    return <ConviteConfirmarScreen
              onBack={() => setStage('convite-recebido')}
              onConfirm={() => setStage('convite-bemvinda')} />;
  }
  if (stage === 'convite-bemvinda') {
    return <BemVindaScreen onStart={() => setStage('app')} />;
  }

  // ── Main app subscreens ─────────────────────────────────────
  let body;
  if (subscreen === 'detalhes' && selectedId) {
    body = <DetalhesScreen id={selectedId} onBack={backToTab}
              onAgendar={(aid) => {
                setSelectedId(aid);
                setSubscreen('agendar-reuniao');
              }}
              onEditar={(aid) => {
                setSelectedId(aid);
                setSubscreen('editar-assistido');
              }} />;
  } else if (subscreen === 'editar-assistido' && selectedId) {
    body = <EditarAssistidoScreen id={selectedId}
              onBack={() => setSubscreen('detalhes')}
              onSave={() => setSubscreen('detalhes')} />;
  } else if (subscreen === 'agendar-reuniao' && selectedId) {
    body = <AgendarReuniaoScreen id={selectedId}
              onBack={() => setSubscreen('detalhes')}
              onSave={() => setSubscreen('detalhes')} />;
  } else if (subscreen === 'novo') {
    body = <NovoIrmaoScreen onBack={backToTab} onSave={backToTab} />;
  } else if (subscreen === 'dashboard') {
    body = <DashboardScreen onBack={backToTab}
                             onOpenAssistido={openAssistido}
                             onEquipe={() => setSubscreen('equipe')} />;
  } else if (subscreen === 'equipe') {
    body = <EquipeScreen onBack={backToTab}
                          onInvite={() => setSubscreen('convidar')} />;
  } else if (subscreen === 'convidar') {
    body = <ConvidarScreen onBack={() => setSubscreen('equipe')}
                            onSent={(form) => {
                              setLastInvite(form);
                              setSubscreen('convite-enviado');
                            }} />;
  } else if (subscreen === 'convite-enviado') {
    body = <ConviteEnviadoScreen form={lastInvite}
                                  onClose={() => setSubscreen('equipe')}
                                  onConviteRecebido={() => {
                                    setStage('convite-recebido');
                                    setSubscreen(null);
                                  }} />;
  } else if (subscreen === 'assinatura') {
    body = <AssinaturaAtivaScreen onBack={backToTab}
                                   onChangePlan={() => setSubscreen('planos')}
                                   onFaturas={() => setSubscreen('faturas')}
                                   onCancel={() => setSubscreen('cancelar')} />;
  } else if (subscreen === 'planos') {
    body = <PlanosScreen onBack={() => setSubscreen('assinatura')}
                          onContinue={(plano) => {
                            setSelectedPlan(plano);
                            setSubscreen('checkout');
                          }} />;
  } else if (subscreen === 'checkout') {
    body = <CheckoutScreen plano={selectedPlan}
                            onBack={() => setSubscreen('planos')}
                            onPaid={() => setSubscreen('sucesso-assinatura')} />;
  } else if (subscreen === 'sucesso-assinatura') {
    body = <SucessoAssinaturaScreen plano={selectedPlan}
                                     onContinue={() => setSubscreen(null)} />;
  } else if (subscreen === 'faturas') {
    body = <FaturasScreen onBack={() => setSubscreen('assinatura')} />;
  } else if (subscreen === 'cancelar') {
    body = <CancelarScreen onBack={() => setSubscreen('assinatura')}
                            onCancel={() => setSubscreen(null)} />;
  } else if (tab === 'home') {
    // Role-aware home tab: Líder vê o Dashboard, Cuidador vê a lista
    if (role === 'lider') {
      body = <DashboardScreen
                onBack={() => {}}    // (root tab — no back)
                hideBack={true}
                onOpenAssistido={openAssistido}
                onOpenAssistidos={() => setSubscreen('assistidos')}
                onEquipe={() => setSubscreen('equipe')} />;
    } else {
      body = <HomeScreen onOpen={openAssistido}
                         onNewBrother={() => setSubscreen('novo')}
                         onAvatar={() => setTab('ajustes')}
                         role={role} />;
    }
  } else if (subscreen === 'assistidos') {
    // Líder pode abrir a lista completa de assistidos via dashboard
    body = <HomeScreen onOpen={openAssistido}
                       onNewBrother={() => setSubscreen('novo')}
                       onAvatar={backToTab}
                       onBack={backToTab}
                       showBack={true}
                       role={role} />;
  } else if (tab === 'agenda') {
    body = <AgendaScreen onOpenAssistido={openAssistido} />;
  } else if (tab === 'mensagens') {
    body = <MensagensScreen onOpenAssistido={openAssistido} />;
  } else if (tab === 'ajustes') {
    body = <AjustesScreen role={role} onRole={setRole}
                           onSwitchTenant={() => setTenantOpen(true)}
                           onEquipe={() => setSubscreen('equipe')}
                           onAssinatura={() => setSubscreen('assinatura')}
                           onDashboard={() => setSubscreen('dashboard')}
                           dark={dark} onDark={onDark} />;
  }

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      overflow: 'hidden', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative',
                    display: 'flex', flexDirection: 'column' }}>
        {body}
      </div>
      {!subscreen && <BottomNav tab={tab} onTab={setTab} role={role} />}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%',
        transform: 'translateX(-50%)', width: 134, height: 5, borderRadius: 99,
        background: 'rgba(15,23,42,0.25)', zIndex: 40, pointerEvents: 'none',
      }} />
      {tenantOpen && (
        <TenantSwitcher onClose={() => setTenantOpen(false)}
                        onPick={() => setTenantOpen(false)} />
      )}
    </div>
  );
};

const PhoneFrame = ({ children, dark }) => (
  <div style={{
    width: 380, height: 800, borderRadius: 46, overflow: 'hidden',
    background: 'var(--bg)', position: 'relative',
    boxShadow: dark
      ? '0 0 0 10px #1a1a1a, 0 0 0 11px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.4)'
      : '0 0 0 10px #E2E5EB, 0 0 0 11px rgba(15,23,42,0.06), 0 24px 60px rgba(15,23,42,0.10)',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
                  pointerEvents: 'none' }}>
      <StatusBar dark={dark} />
    </div>
    <div style={{
      position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
      width: 110, height: 32, borderRadius: 20, background: '#000', zIndex: 60,
    }} />
    <div style={{ position: 'absolute', inset: 0, paddingTop: 50,
                  display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
);

Object.assign(window, { FullApp, PhoneFrame });
