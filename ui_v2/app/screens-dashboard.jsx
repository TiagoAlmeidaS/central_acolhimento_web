// app/screens-dashboard.jsx — Líder operational dashboard
// Numbers: cadastrados, sendo cuidados, sem cuidador, visitas previstas/realizadas,
// equipe ativa, atrasos. Plus mini-charts and a 7-day activity sparkline.

// ─── Mock metrics (derived from current tenant data) ─────────────
function deriveMetrics(tenantId) {
  const ass = ASSISTIDOS.filter(a => a.tenant === tenantId);
  const cui = (typeof CUIDADORES_ATIVOS !== 'undefined'
    ? CUIDADORES_ATIVOS : []).filter(c => c.tenant === tenantId);
  const meets = AGENDA.filter(m => m.tenant === tenantId);

  const total = ass.length;
  const semCuidador = ass.filter(a => !a.cuidador).length;
  const ativos = ass.filter(a => a.status === 'urgente' ||
                                 a.status === 'acompanhamento' ||
                                 a.status === 'aguardando').length;
  const concluidos = ass.filter(a => a.status === 'concluido').length;
  const urgentes = ass.filter(a => a.status === 'urgente').length;

  // Counts per status
  const byStatus = STATUS_ORDER.map(s => ({
    key: s, label: STATUS[s].label,
    count: ass.filter(a => a.status === s).length,
  }));

  // 7-day visit history (mock with realistic shape — fewer on Sundays)
  const visitas = [
    { dia: 'Seg', n: 5 }, { dia: 'Ter', n: 7 }, { dia: 'Qua', n: 6 },
    { dia: 'Qui', n: 9 }, { dia: 'Sex', n: 8 }, { dia: 'Sáb', n: 12 },
    { dia: 'Dom', n: 3 },
  ];

  // Caregiver workload
  const equipePerformance = cui.map(c => ({
    ...c,
    capacidade: c.casos >= 4 ? 'alta' : c.casos >= 2 ? 'normal' : 'baixa',
  }));

  return {
    total, ativos, concluidos, semCuidador, urgentes,
    visitasPrev: 16, visitasReal: 13, visitasAtraso: 3,
    cuidadoresAtivos: equipePerformance.filter(c => c.online).length,
    cuidadoresTotal: equipePerformance.length,
    byStatus, visitas, equipePerformance,
    tempoMedioResposta: '2h 48min',
    novosNaSemana: 4,
    crescimentoSemana: 18, // %
  };
}

// ─── KPI Card (compact, tappable) ────────────────────────────────
const KpiCard = ({ icon, label, value, sub, trend, accent = 'var(--accent)',
                   bg = 'var(--accent-bg)', onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 10, padding: '16px 16px', borderRadius: 16,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    cursor: onClick ? 'pointer' : 'default',
    fontFamily: 'inherit', textAlign: 'left',
    minHeight: 110,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: bg, color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{React.cloneElement(icon, { size: 17 })}</div>
      {trend != null && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 11, fontWeight: 700,
          color: trend > 0 ? '#15803D' : trend < 0 ? '#B91C1C' : 'var(--text-3)',
          letterSpacing: '-0.005em',
        }}>
          {trend > 0 ? '▲' : trend < 0 ? '▼' : '·'} {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)',
                    letterSpacing: '-0.03em', lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6,
                    fontWeight: 500, letterSpacing: '-0.005em' }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  </button>
);

// ─── Visit chart — vertical bars 7 days ──────────────────────────
const VisitChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.n)) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end',
                  gap: 8, height: 120, padding: '8px 0 0' }}>
      {data.map((d, i) => {
        const h = (d.n / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={d.dia} style={{ flex: 1, display: 'flex',
                                    flexDirection: 'column', alignItems: 'center',
                                    gap: 6 }}>
            <div style={{ flex: 1, width: '100%', position: 'relative',
                          display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%',
                height: `${h}%`, borderRadius: 6,
                background: isLast
                  ? 'linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%)'
                  : 'linear-gradient(180deg, #BFDBFE 0%, #93C5FD 100%)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: -22, left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 11, fontWeight: 700,
                  color: 'var(--text)', fontVariantNumeric: 'tabular-nums',
                }}>{d.n}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600,
                          color: isLast ? 'var(--accent)' : 'var(--text-3)',
                          letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {d.dia}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Donut chart for status ────────────────────────────────────
const StatusDonut = ({ data, size = 140 }) => {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r}
                fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        {data.map(d => {
          const len = (d.count / total) * c;
          const seg = (
            <circle key={d.key} cx={size/2} cy={size/2} r={r}
                    fill="none" stroke={STATUS[d.key].dot} strokeWidth={stroke}
                    strokeDasharray={`${len} ${c}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt" />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)',
                      letterSpacing: '-0.03em', lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums' }}>{total}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4,
                      fontWeight: 600, letterSpacing: '0.04em',
                      textTransform: 'uppercase' }}>assistidos</div>
      </div>
    </div>
  );
};

// ─── Caregiver capacity row ─────────────────────────────────────
const CapacityRow = ({ c }) => {
  const totalCap = 5;
  const filled = Math.min(c.casos, totalCap);
  const colorByCap = {
    alta: '#DC2626', normal: '#2563EB', baixa: '#16A34A',
  }[c.capacidade];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px', borderBottom: '1px solid var(--border)',
    }}>
      <Avatar src={c.foto} name={c.nome} size={36} online={c.online} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
                      letterSpacing: '-0.005em',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' }}>{c.nome}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          {Array.from({ length: totalCap }).map((_, i) => (
            <div key={i} style={{
              width: 18, height: 5, borderRadius: 2,
              background: i < filled ? colorByCap : 'var(--surface-2)',
            }} />
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colorByCap,
                      fontVariantNumeric: 'tabular-nums' }}>
          {c.casos}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1,
                      letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {c.capacidade}
        </div>
      </div>
    </div>
  );
};

// ─── DashboardScreen ────────────────────────────────────────────
const DashboardScreen = ({ onBack, onOpenAssistido, onEquipe,
                            onOpenAssistidos, hideBack = false }) => {
  const k = deriveMetrics(USUARIO.tenantId);
  const t = tenantById(USUARIO.tenantId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                  background: 'var(--bg)' }}>
      <div style={{ padding: hideBack ? '8px 22px 14px' : '4px 16px 12px',
                    display: 'flex', alignItems: 'center', gap: 12 }}>
        {!hideBack && (
          <IconBtn icon={<IconArrowLeft />} onClick={onBack} variant="flat" size={40} />
        )}
        <div style={{ flex: 1 }}>
          {hideBack && (
            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500,
                          marginBottom: 2 }}>
              Olá, {USUARIO.primeiroNome}
            </div>
          )}
          <h1 style={{ margin: 0,
                       fontSize: hideBack ? 22 : 17,
                       fontWeight: 700,
                       letterSpacing: hideBack ? '-0.025em' : '-0.015em',
                       color: 'var(--text)' }}>
            {hideBack ? 'Painel da liderança' : 'Dashboard'}
          </h1>
          <div style={{ marginTop: 6 }}>
            <TenantChip tenantId={USUARIO.tenantId} size="sm" />
          </div>
        </div>
        {hideBack ? (
          <Avatar src={USUARIO.foto} name={USUARIO.nome} size={44}
                  online={USUARIO.online} />
        ) : (
          <IconBtn icon={<IconDoc />} variant="soft" size={40} />
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto',
                    padding: hideBack ? '4px 18px 120px' : '4px 18px 28px',
                    scrollbarWidth: 'none',
                    display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Date range picker (decorative) */}
        <div style={{
          display: 'flex', padding: 4, borderRadius: 10,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          marginBottom: 2,
        }}>
          {['7d', '30d', '90d', 'Tudo'].map((p, i) => {
            const active = i === 1;
            return (
              <button key={p} style={{
                flex: 1, padding: '9px 6px', borderRadius: 7,
                background: active ? 'var(--surface)' : 'transparent',
                border: 0, color: active ? 'var(--text)' : 'var(--text-2)',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                cursor: 'pointer', letterSpacing: '-0.005em',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}>{p}</button>
            );
          })}
        </div>

        {/* Alert if there are issues */}
        {k.urgentes > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '14px 16px', borderRadius: 14,
            background: '#FEF2F2', border: '1px solid #FECACA',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#FEE2E2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}><IconBell size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#991B1B',
                            letterSpacing: '-0.005em' }}>
                {k.urgentes} caso{k.urgentes > 1 ? 's' : ''} urgente{k.urgentes > 1 ? 's' : ''} sem resolução
              </div>
              <div style={{ fontSize: 12.5, color: '#7F1D1D', marginTop: 2,
                            lineHeight: 1.4 }}>
                {k.semCuidador > 0 &&
                  `${k.semCuidador} sem cuidador atribuído · `}
                Atribua alguém agora.
              </div>
            </div>
            <button onClick={() => onEquipe && onEquipe()} style={{
              padding: '8px 14px', borderRadius: 10,
              background: '#DC2626', color: '#fff', border: 0,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.005em',
              flexShrink: 0,
            }}>Ver</button>
          </div>
        )}

        {/* KPI grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          <KpiCard icon={<IconUsers />} label="Cadastrados"
                   value={k.total} sub={`+${k.novosNaSemana} esta semana`}
                   trend={k.crescimentoSemana}
                   accent="#2D7FF9" bg="#E8F1FE" />
          <KpiCard icon={<IconHeart />} label="Sendo cuidados"
                   value={k.ativos}
                   sub={`${Math.round(k.ativos/k.total*100)}% do total`}
                   accent="#16A34A" bg="#DCFCE7" />
          <KpiCard icon={<IconHourglass />} label="Sem cuidador"
                   value={k.semCuidador}
                   sub="Aguardando atribuição"
                   accent="#EA580C" bg="#FFEDD5" />
          <KpiCard icon={<IconCheck />} label="Concluídos"
                   value={k.concluidos} sub="Ciclos finalizados"
                   accent="#7C3AED" bg="rgba(124,58,237,0.12)" />
        </div>

        {/* Visit chart */}
        <Card padding={20}>
          <div style={{ display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)',
                            letterSpacing: '-0.015em' }}>
                Visitas nos últimos 7 dias
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6,
                            marginTop: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)',
                               letterSpacing: '-0.025em', lineHeight: 1,
                               fontVariantNumeric: 'tabular-nums' }}>
                  {k.visitas.reduce((s, v) => s + v.n, 0)}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>visitas realizadas</span>
              </div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 999,
              background: 'rgba(34,197,94,0.12)', color: '#15803D',
              fontSize: 11, fontWeight: 700, letterSpacing: '-0.005em',
            }}>▲ 12%</div>
          </div>
          <VisitChart data={k.visitas} />
        </Card>

        {/* Visit performance row */}
        <Card padding={20}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.015em', marginBottom: 14 }}>
            Visitas previstas vs. realizadas
          </div>
          <div style={{
            height: 14, borderRadius: 999, background: 'var(--surface-2)',
            overflow: 'hidden', display: 'flex', position: 'relative',
            marginBottom: 16,
          }}>
            <div style={{
              width: `${(k.visitasReal / k.visitasPrev) * 100}%`,
              background: 'linear-gradient(90deg, #2D7FF9 0%, #16A34A 100%)',
            }} />
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${((k.visitasReal + k.visitasAtraso) / (k.visitasPrev + k.visitasAtraso)) * 100}%`,
              width: 2, background: 'var(--text-3)',
            }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 12 }}>
            <PerfTile color="#16A34A" v={k.visitasReal} l="Realizadas" />
            <PerfTile color="#DC2626" v={k.visitasAtraso} l="Em atraso" />
            <PerfTile color="var(--text-3)" v={k.visitasPrev - k.visitasReal - k.visitasAtraso}
                     l="Pendentes" />
          </div>
        </Card>

        {/* Status donut */}
        <Card padding={20}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)',
                        letterSpacing: '-0.015em', marginBottom: 14 }}>
            Distribuição por status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <StatusDonut data={k.byStatus} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {k.byStatus.map(d => {
                const pct = Math.round((d.count / (k.total || 1)) * 100);
                return (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center',
                                            gap: 10 }}>
                    <StatusDot status={d.key} size={9} />
                    <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text)',
                                  fontWeight: 500, letterSpacing: '-0.005em',
                                  overflow: 'hidden', textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap' }}>{d.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)',
                                  fontVariantNumeric: 'tabular-nums',
                                  minWidth: 22, textAlign: 'right' }}>
                      {d.count}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)',
                                  fontVariantNumeric: 'tabular-nums',
                                  minWidth: 36, textAlign: 'right' }}>
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Team performance */}
        <Card padding={0}>
          <div style={{
            padding: '16px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)',
                            letterSpacing: '-0.015em' }}>
                Equipe em ação
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                {k.cuidadoresAtivos} online · {k.cuidadoresTotal} total
              </div>
            </div>
            <button onClick={onEquipe} style={{
              padding: 4, background: 'transparent', border: 0,
              color: 'var(--accent)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '-0.005em',
            }}>Ver todos</button>
          </div>
          {k.equipePerformance.map(c => <CapacityRow key={c.id} c={c} />)}
          <div style={{ height: 2 }} />
        </Card>

        {/* Quick stats footer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <KpiCard icon={<IconClock />} label="Tempo médio de resposta"
                   value={k.tempoMedioResposta} sub="Última semana"
                   accent="#0891B2" bg="#CFFAFE" />
          <KpiCard icon={<IconUsers />} label="Cuidadores ativos"
                   value={k.cuidadoresAtivos} sub={`de ${k.cuidadoresTotal} cadastrados`}
                   accent="#7C3AED" bg="rgba(124,58,237,0.12)" />
        </div>

        {/* Export */}
        <div style={{ padding: '4px 0 8px',
                      display: 'flex', flexDirection: 'column', gap: 10 }}>
          {onOpenAssistidos && (
            <Button variant="primary" size="md" icon={<IconUsers />} full
                    onClick={onOpenAssistidos}>
              Ver lista de assistidos
            </Button>
          )}
          <Button variant="secondary" size="md" icon={<IconDoc />} full>
            Exportar relatório (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
};

const PerfTile = ({ color, v, l }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600,
                     letterSpacing: '0.04em', textTransform: 'uppercase' }}>{l}</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)',
                  letterSpacing: '-0.025em', lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums' }}>{v}</div>
  </div>
);

Object.assign(window, { DashboardScreen, deriveMetrics });
