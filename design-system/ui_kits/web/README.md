# optiHealth — Web UI kit

Liquid-glass Next.js-flavored kit. Recreates the landing + a plausible dashboard of the web app.

**Flow:** Landing → click "Login / Sign up" → auth modal → demo login → Dashboard → sign out returns to Landing.

## Files
- `GlassPrimitives.jsx` — `PageWash`, `Glass`, `GlassSubtle`, `GlassStrong`
- `Icons.jsx` — minimal Lucide-alike icon set
- `Button.jsx` — primary / glass / ghost / destructive / demo × sm/md/lg/icon
- `AuthModal.jsx` — sign in / create account with pill switcher
- `Landing.jsx` — hero with gradient text + 6-up feature grid + CTA card
- `Dashboard.jsx` — `DashboardNav`, `MetricTile`, `Spark`, `Dashboard`
- `index.html` — interactive click-thru, state persisted in localStorage

All surfaces are white/α with backdrop-blur on the indigo gradient wash.
