// AuthModal — glass-strong modal with tab switcher (Sign in / Create account).
const AuthModal = ({ open, onClose, onSuccess }) => {
  const [mode, setMode] = React.useState('signin');
  const [email, setEmail] = React.useState('alex@optihealth.app');
  const [password, setPassword] = React.useState('••••••••');
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn .2s ease',
    }} onClick={onClose}>
      <GlassStrong style={{ width: 420, padding: 32, animation: 'popIn .25s cubic-bezier(.2,.8,.2,1.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ font: '700 24px/1.2 Geist, system-ui, sans-serif', letterSpacing: '-0.01em' }}>Welcome to optiHealth</div>
          <div style={{ font: '400 14px/1.4 Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>Your proofable biohacking platform</div>
        </div>
        {/* pill switcher */}
        <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.10)', borderRadius: 9999, marginBottom: 20, width: '100%' }}>
          {['signin', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '6px 14px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                font: '500 13px Geist, system-ui, sans-serif',
                background: mode === m ? 'rgba(255,255,255,0.80)' : 'transparent',
                color: mode === m ? '#0a0a0a' : 'rgba(255,255,255,0.8)',
                transition: 'all .15s',
              }}>
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <label>
            <div style={{ font: '500 13px Geist, system-ui, sans-serif', marginBottom: 6 }}>Email</div>
            <div style={{ display: 'flex', borderRadius: 12, border: '1px solid rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', padding: '10px 12px' }}>
              <input value={email} onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', font: '400 14px Geist, system-ui, sans-serif' }} />
            </div>
          </label>
          <label>
            <div style={{ font: '500 13px Geist, system-ui, sans-serif', marginBottom: 6 }}>Password</div>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: 12, border: '1px solid rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', padding: '10px 12px' }}>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', font: '400 14px Geist, system-ui, sans-serif' }} />
            </div>
          </label>
          {mode === 'signin' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 13px Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.8)' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" defaultChecked /> Remember me</label>
              <a style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'underline', cursor: 'pointer' }}>Forgot password?</a>
            </div>
          )}
          <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={onSuccess}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
          <Button variant="demo" size="md" style={{ width: '100%', justifyContent: 'center' }} onClick={onSuccess}>
            Demo login
          </Button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 18, font: '400 12px Geist, system-ui, sans-serif', color: 'rgba(255,255,255,0.6)' }}>
          By continuing you agree to our <a style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'underline' }}>Terms</a> and <a style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'underline' }}>Privacy Policy</a>.
        </div>
      </GlassStrong>
    </div>
  );
};

window.AuthModal = AuthModal;
