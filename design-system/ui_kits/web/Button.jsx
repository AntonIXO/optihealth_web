// Button — web variants. Matches shadcn button.tsx mapped to the glass world.
const Button = ({ variant = 'primary', size = 'md', children, icon, onClick, style = {}, ...rest }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
    fontWeight: 600, lineHeight: 1, border: '1px solid transparent',
    transition: 'all .15s', userSelect: 'none', whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12, borderRadius: 10 },
    md: { padding: '10px 16px', fontSize: 14, borderRadius: 12 },
    lg: { padding: '12px 20px', fontSize: 16, borderRadius: 12 },
    icon: { width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: 10, fontSize: 14 },
  };
  const variants = {
    primary: { background: '#fff', color: '#0a0a0a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    glass:   { background: 'rgba(255,255,255,0.10)', color: '#fff', borderColor: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(12px)' },
    ghost:   { background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.20)' },
    destructive: { background: '#e25555', color: '#fff' },
    demo:    { background: 'rgba(254,240,138,0.95)', color: '#713f12', borderColor: 'rgba(254,240,138,0.60)' },
  };
  const [down, setDown] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const hoverStyle = hover ? (variant === 'primary'
    ? { background: 'rgba(255,255,255,0.92)' }
    : variant === 'glass' ? { background: 'rgba(255,255,255,0.15)' }
    : variant === 'ghost' ? { background: 'rgba(255,255,255,0.08)' }
    : {}) : {};
  return (
    <button
      style={{
        ...base, ...sizes[size], ...variants[variant], ...hoverStyle,
        transform: down ? 'scale(0.98)' : 'scale(1)',
        ...style,
      }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => { setDown(false); setHover(false); }}
      onMouseEnter={() => setHover(true)}
      onClick={onClick}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
};

window.Button = Button;
