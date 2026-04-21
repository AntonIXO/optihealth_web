// Glass primitives — the 3 atomic surfaces that define the web product.
const PageWash = ({ children, style }) => (
  <div className="page-wash" style={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #581c87 50%, #312e81 100%)',
    backgroundAttachment: 'fixed',
    color: '#fff',
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
    ...style,
  }}>
    {children}
  </div>
);

const Glass = ({ children, hover, className = '', style, as: Tag = 'div', ...rest }) => (
  <Tag
    className={className}
    style={{
      background: 'rgba(255,255,255,0.10)',
      border: '1px solid rgba(255,255,255,0.20)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 16,
      color: '#fff',
      transition: 'background .15s',
      ...style,
    }}
    {...rest}
  >
    {children}
  </Tag>
);

const GlassSubtle = ({ children, style, ...rest }) => (
  <div style={{
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 12,
    color: '#fff',
    ...style,
  }} {...rest}>{children}</div>
);

const GlassStrong = ({ children, style, ...rest }) => (
  <div style={{
    background: 'rgba(255,255,255,0.20)',
    border: '1px solid rgba(255,255,255,0.20)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 24,
    color: '#fff',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  }} {...rest}>
    {/* top edge highlight */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
    {children}
  </div>
);

Object.assign(window, { PageWash, Glass, GlassSubtle, GlassStrong });
