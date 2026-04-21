// Landing — hero + feature grid. Recreates features-showcase-page.tsx at high fidelity.
const FEATURES = [
  { Icon: IconActivity,   color: '#60a5fa', title: 'Comprehensive Tracking', body: 'Sleep, HRV, nutrition, mood, supplements — from wearables or manual logs.' },
  { Icon: IconBrain,      color: '#c084fc', title: 'AI-Powered Insights',    body: 'Ask plain-language questions. Surface correlations you would never find.' },
  { Icon: IconTrendingUp, color: '#4ade80', title: 'Advanced Analytics',     body: 'Every metric you care about, graphed across arbitrary windows.' },
  { Icon: IconHeart,      color: '#f87171', title: 'Holistic Health View',   body: 'Mental and physical together — one database, one timeline.' },
  { Icon: IconShield,     color: '#facc15', title: 'Privacy & Security',     body: 'Client-side encrypted, zstd-compressed uploads. You own the data.' },
  { Icon: IconZap,        color: '#fb923c', title: 'Real-time Sync',         body: 'Live sync across phone, wearable and web. No manual export.' },
];

const Landing = ({ onAuth }) => (
  <div>
    {/* top nav */}
    <nav style={{
      position: 'sticky', top: 0, zIndex: 40,
      borderBottom: '1px solid rgba(255,255,255,0.10)',
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, border: '2px solid #fff', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#fff' }}/>
            <div style={{ position: 'absolute', left: 5, bottom: 4, width: 8, height: 8, borderRadius: '50%', border: '2px solid #4ade80' }}/>
          </div>
          <span style={{ font: '700 18px Geist, system-ui, sans-serif', letterSpacing: '-0.01em' }}>optiHealth</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="md" onClick={onAuth}>Login / Sign up</Button>
        </div>
      </div>
    </nav>

    {/* hero */}
    <section style={{ maxWidth: 960, margin: '0 auto', padding: '96px 32px', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', padding: '6px 14px', borderRadius: 9999,
        background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)',
        backdropFilter: 'blur(12px)',
        font: '500 12px Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.85)',
        marginBottom: 24, letterSpacing: '0.02em',
      }}>PROOFABLE BIOHACKING PLATFORM · N=1</div>
      <h1 style={{ font: '700 60px/1.05 Geist, system-ui, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
        Transform your health data into<br/>
        <span style={{
          background: 'linear-gradient(90deg, #60a5fa, #c084fc)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>actionable insights</span>
      </h1>
      <p style={{ font: '400 18px/1.5 Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.8)', maxWidth: 640, margin: '24px auto 0', textWrap: 'pretty' }}>
        optiHealth empowers you to collect, visualize, and analyze your personal health data.
        Discover patterns, track progress, and unlock personalized insights with AI-powered analysis.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 36 }}>
        <Button variant="primary" size="lg" onClick={onAuth} icon={<IconArrow size={16}/>}>Start your journey</Button>
        <Button variant="glass" size="lg">See how it works</Button>
      </div>
    </section>

    {/* features */}
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 96px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ font: '500 13px Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Everything you need</div>
        <h2 style={{ font: '700 36px/1.1 Geist, system-ui, sans-serif', letterSpacing: '-0.01em', marginTop: 8 }}>to optimize your health</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {FEATURES.map((f, i) => (
          <Glass key={i} style={{ padding: 24 }}>
            <f.Icon size={22} stroke={f.color} />
            <div style={{ font: '600 17px/1.3 Geist, system-ui, sans-serif', marginTop: 14 }}>{f.title}</div>
            <div style={{ font: '400 14px/1.5 Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>{f.body}</div>
          </Glass>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px 96px', textAlign: 'center' }}>
      <GlassStrong style={{ padding: 48 }}>
        <h3 style={{ font: '700 32px/1.1 Geist, system-ui, sans-serif', letterSpacing: '-0.01em', margin: 0 }}>Ready to optimize your health?</h3>
        <p style={{ font: '400 16px/1.5 Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.8)', marginTop: 12, maxWidth: 520, marginInline: 'auto' }}>
          Join thousands of users who are already transforming their health data into actionable insights.
        </p>
        <div style={{ marginTop: 28 }}>
          <Button variant="primary" size="lg" onClick={onAuth}>Get started — it's free</Button>
        </div>
      </GlassStrong>
    </section>
  </div>
);

window.Landing = Landing;
