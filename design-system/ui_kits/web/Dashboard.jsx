// Dashboard — a plausible daily view following dashboard-nav.tsx patterns.
const DashboardNav = ({ onLogout }) => {
  const items = [
    { Icon: IconDashboard, label: 'Dashboard', active: true },
    { Icon: IconBarChart,  label: 'Analytics' },
    { Icon: IconBook,      label: 'Journal' },
    { Icon: IconBrain,     label: 'Insights' },
    { Icon: IconTarget,    label: 'Protocols' },
  ];
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 40,
      borderBottom: '1px solid rgba(255,255,255,0.10)',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, border: '2px solid #fff', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#fff' }}/>
              <div style={{ position: 'absolute', left: 4, bottom: 3, width: 8, height: 8, borderRadius: '50%', border: '2px solid #4ade80' }}/>
            </div>
            <span style={{ font: '700 16px Geist, system-ui, sans-serif' }}>optiHealth</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {items.map((it, i) => (
              <button key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: it.active ? 'rgba(255,255,255,0.10)' : 'transparent',
                color: it.active ? '#fff' : 'rgba(255,255,255,0.7)',
                font: '500 13px Geist, system-ui, sans-serif',
                transition: 'all .15s',
              }}
                onMouseEnter={e => { if (!it.active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!it.active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
              >
                <it.Icon size={16}/>
                {it.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="glass" size="sm" icon={<IconPlus size={14}/>}>Log data</Button>
          <Button variant="ghost" size="icon"><IconSettings size={16}/></Button>
          <button onClick={onLogout} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.20)',
            background: 'transparent', color: '#fff', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }} title="Sign out"><IconLogOut size={16}/></button>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #c084fc)', font: '600 13px Geist', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>AK</div>
        </div>
      </div>
    </nav>
  );
};

// Tiny sparkline helper using SVG
const Spark = ({ data, color = '#4ade80', width = 140, height = 36, fill = true }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / (max - min || 1)) * height,
  ]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height}>
      {fill && <path d={area} fill={color} opacity="0.15"/>}
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const MetricTile = ({ label, value, unit, delta, color, data, icon }) => (
  <Glass style={{ padding: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', font: '500 12px Geist, system-ui, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {icon}{label}
      </div>
      <span style={{ font: '500 11px Geist, system-ui, sans-serif', color: delta >= 0 ? '#4ade80' : '#f87171' }}>
        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
      </span>
    </div>
    <div style={{ font: '700 32px/1.1 Geist, system-ui, sans-serif', letterSpacing: '-0.01em', marginTop: 10 }}>
      {value}<span style={{ font: '500 14px Geist Mono, ui-monospace, monospace', color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>{unit}</span>
    </div>
    <div style={{ marginTop: 8 }}><Spark data={data} color={color}/></div>
  </Glass>
);

const Dashboard = () => {
  const supplements = [
    { name: 'Magnesium Glycinate', dose: '400 mg', time: '22:00', taken: true },
    { name: 'Creatine monohydrate', dose: '5 g',    time: '08:30', taken: true },
    { name: 'Vitamin D3',           dose: '4000 IU', time: '08:30', taken: true },
    { name: 'Omega-3 (EPA/DHA)',    dose: '2 g',    time: '13:00', taken: false },
    { name: 'Ashwagandha KSM-66',   dose: '600 mg', time: '21:00', taken: false },
  ];
  const insights = [
    { accent: '#c084fc', Icon: IconBrain, title: 'Sleep correlates with magnesium timing', body: 'When you take magnesium before 22:00, your deep sleep averages 1h 42m (+18% vs late). n=37 nights.' },
    { accent: '#4ade80', Icon: IconTrendingUp, title: 'HRV trending up', body: 'Your 7-day HRV has climbed 8 ms over the last 3 weeks. Matches your reduced caffeine after 14:00.' },
    { accent: '#facc15', Icon: IconShield, title: 'Protocol #3 hit significance', body: 'Ashwagandha + cold plunge vs baseline: resting HR down 4.2 bpm, p=0.03 over 28 days.' },
  ];
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 28 }}>
        <div>
          <div style={{ font: '500 13px Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sunday · April 19</div>
          <h1 style={{ font: '700 36px/1.1 Geist, system-ui, sans-serif', letterSpacing: '-0.01em', marginTop: 4 }}>Good morning, Alex</h1>
          <div style={{ font: '400 15px Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
            Your readiness is <span style={{ color: '#4ade80', fontWeight: 600 }}>high</span> — a good day for harder training.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.10)', borderRadius: 9999 }}>
          {['Today', '7d', '30d', '90d'].map((k, i) => (
            <button key={k} style={{
              padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
              background: i === 1 ? 'rgba(255,255,255,0.80)' : 'transparent',
              color: i === 1 ? '#0a0a0a' : 'rgba(255,255,255,0.8)',
              font: '500 13px Geist, system-ui, sans-serif',
            }}>{k}</button>
          ))}
        </div>
      </div>

      {/* metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <MetricTile label="HRV" value="58" unit="ms" delta={12} color="#4ade80" icon={<IconActivity size={14}/>} data={[42,45,41,47,50,48,53,55,54,58]}/>
        <MetricTile label="Deep sleep" value="1:42" unit="h" delta={8} color="#60a5fa" icon={<IconMoon size={14}/>} data={[70,85,72,88,95,90,102,98,105,102]}/>
        <MetricTile label="Resting HR" value="54" unit="bpm" delta={-4} color="#c084fc" icon={<IconHeart size={14}/>} data={[60,58,59,57,55,56,55,54,54,54]}/>
        <MetricTile label="Readiness" value="87" unit="/100" delta={6} color="#facc15" icon={<IconZap size={14}/>} data={[70,72,75,78,80,82,81,84,85,87]}/>
      </div>

      {/* two column */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Glass style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ font: '600 16px Geist, system-ui, sans-serif', whiteSpace: 'nowrap' }}>AI insights</div>
            <span style={{ font: '500 11px Geist Mono, ui-monospace, monospace', color: 'rgba(255,255,255,0.6)' }}>3 new</span>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <ins.Icon size={18} stroke={ins.accent}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 14px Geist, system-ui, sans-serif' }}>{ins.title}</div>
                  <div style={{ font: '400 13px/1.5 Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{ins.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Glass>

        <Glass style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ font: '600 16px Geist, system-ui, sans-serif', whiteSpace: 'nowrap' }}>Today's stack</div>
            <button style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', font: '500 12px Geist, system-ui, sans-serif' }}>Manage →</button>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {supplements.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                background: s.taken ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.05)',
                border: s.taken ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.10)',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: s.taken ? 'none' : '1.5px solid rgba(255,255,255,0.4)',
                  background: s.taken ? '#4ade80' : 'transparent',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#083d21',
                  font: '700 12px Geist',
                }}>{s.taken ? '✓' : ''}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '500 13px Geist, system-ui, sans-serif', textDecoration: s.taken ? 'line-through' : 'none', color: s.taken ? 'rgba(255,255,255,0.6)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ font: '400 11px Geist Mono, ui-monospace, monospace', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.dose} · {s.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  );
};

Object.assign(window, { DashboardNav, Dashboard, Spark, MetricTile });
