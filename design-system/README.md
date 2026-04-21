# optiHealth Design System

> **optiHealth** is an N-of-1 biohacking platform that unifies mental-health logs, wearable biometrics, supplement tracking, location and app-usage context into a single personal database, then uses AI/ML to surface correlations and protocol results. Users run experiments on themselves; optiHealth makes the results **proofable**.

## Products covered by this design system

| Product | Stack | Visual language |
|---|---|---|
| **Web app** (`optihealth_web`) | Next.js 16 · React 19 · Tailwind v4 · shadcn/radix · Supabase | **Liquid glass** — white/10 surfaces with backdrop-blur floating on a fixed `indigo-900 → purple-900 → blue-900` gradient. Geist Sans + Geist Mono. Lucide icons. |
| **Android app** (`optihealth_android`) | Kotlin · Jetpack Compose · Material 3 · Hilt · Health Connect | **MD3** — green-forward tonal palette (`#006C51` primary, `#8FF8D3` container) on `#FBFDF9` surface. Dynamic color on Android 12+. Material Icons Extended. |
| **Analysis service** (`optihealth_analysis`) | Python · ML | No UI — backend only. |

The two client products **intentionally do not share a visual language**. Web is a marketing + dashboard shell with heavy glass morphism; Android is a disciplined MD3 utility app. They share a brand spine (name, mark, voice, data model) but not chrome.

## Sources used to build this system

- **Web repo** — `github.com/AntonIXO/optihealth_web@master`
  - `src/app/globals.css` — shadcn/radix tokens in oklch
  - `src/app/layout.tsx` — Geist font loading
  - `src/components/landing/features-showcase-page.tsx` — the hero + feature grid, defines the web vibe
  - `src/components/ui/*` — button, card, badge, input, auth-model
  - `src/components/dashboard/dashboard-nav.tsx` — dashboard chrome
- **Android repo** — `github.com/AntonIXO/optihealth_android@master`
  - `app/src/main/java/org/devpins/pihs/ui/theme/{Color,Theme,Type}.kt` — MD3 tokens
  - `app/src/main/java/org/devpins/pihs/ui/screens/*` — Home, SupplementDashboard, Cabinet
- **User-provided sketches** — `assets/logo-wordmark-sketch.jpg`, `assets/logo-mark-sketch.jpg` (hand-drawn, grid paper)

---

## CONTENT FUNDAMENTALS

**Product name** is always written `optiHealth` — lowercase `o`, camel-capped `H`. Never "OptiHealth" or "Optihealth" in product chrome (the README docs slip into "OptiHealth" but the live app metadata uses `optiHealth`).

**Tagline** from `layout.tsx`: "proofable biohacking platform". Note the non-word *proofable* (instead of *provable*) — deliberate, evokes "proof-of-work" / quantified self. Keep it.

**Voice** — empowering, second person, outcome-focused. Not clinical, not bro-sciencey. Reads like a thoughtful product manager who takes your sleep seriously.

Examples pulled from the codebase:
- Hero: "Transform Your Health Data Into **Actionable Insights**"
- Sub-hero: "optiHealth empowers you to collect, visualize, and analyze your personal health data. Discover patterns, track progress, and unlock personalized insights with AI-powered analysis."
- Feature kicker: "Everything you need to optimize your health"
- CTA: "Ready to optimize your health?" / "Start Your Journey" / "Join thousands of users who are already transforming their health data into actionable insights."

**Casing rules**
- Product name: `optiHealth` (mixed case).
- Nav labels: Title Case — "Dashboard", "Supplements", "Cabinet", "Insights".
- Buttons: Sentence case — "Sign in", "Create account", "Log Data", "Connect Headband". Never ALL CAPS.
- Section headers on marketing: Title Case sometimes, sentence case other times — the codebase is inconsistent; **prefer sentence case** for product chrome, Title Case for marketing headlines.

**Pronouns** — "you / your" throughout. "We" is used only in legal footer ("our Terms", "our Privacy Policy"). Never "I / my" in product.

**Emoji** — used sparingly in Markdown docs only (🏥 💊 📊 🧠 📝 on the README feature grid). **Not used in product UI.** Don't add them to screens.

**Technical vocabulary is allowed and welcomed** — the audience is biohackers. Use terms like HRV, pgvector, zstd compression, substance/compound ontology, elemental dosage. Don't dumb it down, but don't show off either.

**Tone examples**
- Empty state / beta label: "Connect to your Neiry BCI headband and print heart rate to logs." (descriptive, flat, no emoji)
- Dev tools copy: "Test Data Upload (zstd)" / "Upload Sample Health Data" / "Upload Empty Data (Test)" — parenthetical qualifiers are fine.
- Permissions nudge: "Usage access permission required. Redirecting to settings…" (toast) — matter-of-fact.

---

## VISUAL FOUNDATIONS

### Colors

See **`colors_and_type.css`** for the full token set. Summary:

**Web** is a pure translucent system on a fixed 3-stop gradient.
- Page wash: `linear-gradient(135deg, #1e3a8a → #581c87 → #312e81)` — blue-900 / purple-900 / indigo-900. This is **always** the backdrop; every web surface floats on top.
- Surfaces: `rgba(255,255,255,0.05 / 0.10 / 0.15 / 0.20)` — four steps from subtle (nav bar) → standard card → hover → CTA.
- Borders: `rgba(255,255,255,0.20)` standard, `rgba(255,255,255,0.10)` muted. Always 1px, always white w/ alpha.
- Foreground: pure white with opacity steps — `1.0 / 0.80 / 0.70 / 0.50`. Never use a grey hex against the glass.
- Lucide accent colors (feature tiles): `blue-400 #60a5fa · purple-400 #c084fc · green-400 #4ade80 · red-400 #f87171 · yellow-400 #facc15 · orange-400 #fb923c`.
- Chart palette (from oklch chart-1..5): warm-to-cool mixed — orange, teal, navy, amber, gold.
- Destructive: oklch(0.577 0.245 27.325) ≈ `#e25555`.

**Android** is a Material 3 tonal palette — green-forward.
- Primary: `#006C51` (forest green) · on-primary: `#FFFFFF` · primary-container: `#8FF8D3` · on-primary-container: `#002116`
- Secondary: `#4C6358` (muted sage) · Tertiary: `#3D6374` (muted teal-blue)
- Surface / background: `#FBFDF9` (off-white, green-tinted) · on-surface: `#191C1A`
- Error: `#BA1A1A` · Outline: `#707973`
- **Dynamic color** is enabled on Android 12+ (`dynamicColor = true` in `Theme.kt`) — the user's wallpaper overrides these tokens. Design with the static values as the fallback.

### Type

**Web** — Geist Sans / Geist Mono (loaded via `next/font/google` in `layout.tsx`). Tailwind default scale. Hero is `text-4xl sm:text-6xl` bold; body is `text-lg` on marketing, `text-sm`/`text-base` in the dashboard. Dashboard label hierarchy is tight — the shadcn scale, not custom.

**Android** — full MD3 scale declared in `Type.kt` (display 57/45/36, headline 32/28/24, title 22/16/14, body 16/14/12, label 14/12/11). Uses `FontFamily.Default` which resolves to Roboto/Roboto Flex on device.

**Caveat / substitution** — No custom webfont files are shipped in either repo. Geist and Roboto are both on Google Fonts and load automatically; no local TTF files to copy in.

### Backgrounds & imagery

- **Web**: the indigo/purple gradient is the backdrop. No hand-drawn illustrations, no photos, no repeating patterns. A commented `@keyframes blob` animation exists in `globals.css` but nothing uses it — it's leftover scaffolding for future animated gradient blobs.
- **Android**: flat `#FBFDF9` surface. No imagery. MD3 cards are the only "container" motif.
- **Icons-in-circles** are used as feature markers on the web landing (Lucide icon + colored stroke, `h-5 w-5 flex-none text-<color>-400`).

### Animation & motion

- **Web**: Framer Motion is installed and used only in the auth modal — a spring-based pop (`stiffness: 260, damping: 24`, initial `{opacity:0, y:20, scale:0.98}`). Nav links use `transition-colors`. Buttons use `active:scale-[0.98]` press. That's it — otherwise static.
- **Android**: `animateContentSize` with `spring(dampingRatio = MediumBouncy, stiffness = Low)` on most cards. Screens use standard Compose transitions, no custom choreography.
- **No page-scroll effects, no parallax, no marquees.**

### Hover / press / focus states

- **Web hover**: lighten glass by 5% (`bg-white/10` → `bg-white/15`) OR lift foreground opacity (`text-white/70` → `text-white`). Outlined/ghost buttons: `hover:bg-accent`.
- **Web press**: `active:scale-[0.98]` — subtle shrink. No color change on press.
- **Web focus**: ring via shadcn — `focus-visible:ring-ring/50 focus-visible:ring-[3px]` or `focus-visible:outline outline-2 outline-ring/70`.
- **Android hover (desktop/tab)**: standard MD3 state layer — `primary @ 8% alpha` over surface.
- **Android pressed**: MD3 state layer `primary @ 12%` + ripple.

### Borders & strokes

- **Web** borders are always `1px solid rgba(255,255,255,0.10 | 0.20)`. A 1-px top-edge highlight is applied to the auth modal: `from-transparent via-white/40 to-transparent`. No hairlines, no 2px borders.
- **Android** uses `outline: #707973` for dividers; cards have no border by default, elevation only.

### Shadows & elevation

- **Web**: `shadow-sm shadow-black/5` on small surfaces, `shadow-xl` / `shadow-2xl` on the auth modal. Shadows are subtle — the glass blur does most of the work.
- **Android**: MD3 elevation 1–3 on cards (`shape = RoundedCornerShape(8.dp)`). No custom shadow tokens.

### Protection gradients vs capsules

- The web uses **capsule pills** for mode switches (`rounded-full bg-white/10 p-1` with inner `rounded-full` buttons at `bg-white/80` when active — see auth modal).
- No protection gradients (text-over-image scrims). There's no imagery to protect.

### Layout rules

- **Web landing**: max-width containers — `max-w-4xl` on hero, `max-w-7xl` on feature grid, `max-w-2xl` on text blocks. Vertical rhythm in 24 / 32 / 48 px steps (`py-24 sm:py-32`).
- **Web dashboard**: sticky top nav (`<nav class="border-b border-white/10 bg-white/5 backdrop-blur-md">`), `max-w-7xl px-4 sm:px-6 lg:px-8` container, nav height `h-16`.
- **Android**: 16dp padding gutters, 16dp vertical spacers between cards, `Scaffold` with `TopAppBar`.

### Transparency & blur usage

Transparency on web is the entire design. Rules:
- `bg-white/5` — nav bars, lowest-emphasis panels
- `bg-white/10` — standard cards, inputs, secondary buttons
- `bg-white/15` — hover state for white/10
- `bg-white/20` — CTAs / emphasized actions
- `bg-white/80` or `bg-white/90` — primary solid buttons when contrast-critical (e.g. "Sign in" submit)

Blur pairs with transparency:
- `backdrop-blur-sm` — input fields
- `backdrop-blur-md` — nav bar, buttons, field containers
- `backdrop-blur-xl` — modals, feature cards

### Imagery color vibe

No stock imagery in either repo. When adding photography or illustration later, aim for **cool / dusk** tones that read on the indigo gradient — think twilight skies, biometric visualizations, data-heavy renders. Avoid warm clinical photography (white coats, stethoscopes).

### Corner radii

- **Web**: `rounded-lg` (8px) inputs · `rounded-xl` (12px) buttons · `rounded-2xl` (16px) feature cards · `rounded-full` pill switches.
- **Android**: `RoundedCornerShape(8.dp)` is the default card shape across every screen. 4dp inputs, 28dp bottom sheets.

### What cards look like

- **Web card** = `rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-sm`. No accent borders, no colored left rules, no gradient headers. Rare exceptions: the auth modal adds a 1px top highlight.
- **Android card** = MD3 `Card` with `RoundedCornerShape(8.dp)`, MD3 elevation, padded 16dp, icon + `titleMedium` title row, `bodySmall` body.

---

## ICONOGRAPHY

See **`ICONOGRAPHY.md`** for details; summary:

- **Web** uses [`lucide-react`](https://lucide.dev) at version `^1.7.0`. Stroke-based, 2px weight, 24px default. In marketing, icons render at `h-5 w-5 flex-none` with a brand-accent color class (`text-blue-400` / `text-purple-400` / etc.). In nav, icons are `h-4 w-4` and match text color.
- **Android** uses Material Symbols / `androidx.compose.material.icons.filled.*` and `androidx.compose.material.icons.outlined.*`. Filled is the default (see HomeScreen.kt). Icon size is 24dp in cards, 28dp for header icons, tinted `MaterialTheme.colorScheme.primary`.
- **No custom icon font / sprite** exists in either repo. No SVGs beyond the Next.js defaults in `/public` (`vercel.svg`, `next.svg`, `file.svg`, `globe.svg`, `window.svg`) — these are unused scaffolding and are **not** the optiHealth icon set.
- **Emoji** appear in documentation-style copy (the Android README uses 🏃‍♂️ ❤️ 😴 😊 🌳 🥗 💊 for metric-category labels). They're acceptable in marketing copy but not used in either app's UI.
- **Logo mark** — user sketch only (`assets/logo-mark-sketch.jpg`). A square frame, vertical divider with circle-bottom-left and horizontal tick-right — reads as a minimal "oH" monogram. **No production logo has been finalized** — see caveats.

---

## Index — files in this design system

```
README.md                    ← you are here
SKILL.md                     ← agent-invocable skill manifest
ICONOGRAPHY.md               ← icon strategy per product
colors_and_type.css          ← all color & type tokens (web + android)

assets/                      ← brand assets
  logo-wordmark-sketch.jpg   ← user sketch, hand-drawn "optiHealth"
  logo-mark-sketch.jpg       ← user sketch, hand-drawn mark
  wordmark.svg               ← vector rebuild of the wordmark (approximation)
  mark.svg                   ← vector rebuild of the mark (approximation)

fonts/                       ← (none shipped — Geist + Roboto via Google Fonts)

preview/                     ← Design System tab cards
  brand-logo.html            ← wordmark + mark
  palette-web.html           ← liquid-glass palette
  palette-md3.html           ← Material 3 tonal palette
  type-web.html              ← Geist scale
  type-md3.html              ← MD3 type scale
  spacing-radii.html         ← corner radii & spacing
  elevation-glass.html       ← blur + shadow specimens
  buttons-web.html           ← web button variants
  buttons-md3.html           ← MD3 buttons
  inputs-web.html            ← web inputs + fields
  cards-web.html             ← glass card specimen
  cards-md3.html             ← MD3 card specimen
  badges-web.html            ← badges/chips
  iconography.html           ← icon sets per product

ui_kits/
  web/                       ← Next-flavored React kit, liquid glass
    README.md
    index.html               ← interactive click-thru of landing → login → dashboard
    GlassPrimitives.jsx      ← Glass, GlassStrong, GlassSubtle, PageWash
    Button.jsx               ← Web button variants
    AuthModal.jsx            ← Glass auth modal
    Landing.jsx              ← Hero + feature grid
    DashboardNav.jsx         ← Sticky glass nav
    Dashboard.jsx            ← Daily timeline / supplement widgets
  android/                   ← MD3 Compose-alike kit
    README.md
    index.html               ← interactive phone frame w/ click-thru
    MD3Primitives.jsx        ← Surface, Card, Button, FilledTonalButton
    TopAppBar.jsx            ← MD3 top bar
    HomeScreen.jsx           ← recreation of HomeScreen.kt
    SupplementDashboard.jsx  ← recreation of SupplementDashboardScreen.kt
    CabinetScreen.jsx        ← recreation of CabinetScreen.kt
```

---

## Caveats & known gaps

- **No finalized logo.** Only hand-drawn sketches were provided. The SVG rebuilds in `assets/` are approximations based on the sketches — they should be treated as placeholders until a real logo lands.
- **No custom fonts shipped.** Both products use platform/Google fonts (Geist via next/font, Roboto via Android default). If brand wants a custom display face, it needs to be introduced.
- **No photography / illustration style guide** — neither product ships imagery. If one is added, establish a style guide.
- **Web dashboard has no unified design language** — it is a bag of shadcn components on glass. The UI kit recreates the landing + a plausible dashboard but the real dashboard chrome is under-specified.
- **Android and web intentionally diverge.** Unifying them is a product question, not a design-system question.

---

## Big ask — help iterate

**To make this system truly production-ready, I need from you:**

1. 🎨 **Finalized logo files** (SVG / PNG / any icon variants). My sketches are placeholders.
2. 📸 **Photography / illustration direction** — is there brand imagery, or stay text-only?
3. 🧭 **Which direction wins?** The web-glass and the android-green feel like two different products. Do we harmonize (bring green into web? bring glass to android?) or formalize the split?
4. 🔤 **Any custom display font** the brand wants to own, or stay with Geist / Roboto?
5. 📱 **Key screens to flesh out** — the web dashboard and Android cabinet are implemented but not designed with intent. Which screens are you willing to invest in first?

**Tell me the direction and I will iterate.**
