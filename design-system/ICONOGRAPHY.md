# Iconography

optiHealth uses **two different icon systems**, one per product. There is no unified icon set.

## Web — Lucide

- Package: [`lucide-react`](https://lucide.dev/) `^1.7.0` (declared in `optihealth_web/package.json`)
- Style: stroke-based, 2px weight, open terminals, 24px grid
- Default size in code: `h-4 w-4` in nav, `h-5 w-5 flex-none` on marketing feature tiles
- Color: inherits `currentColor` unless overridden to a Tailwind color (`text-blue-400`, `text-purple-400`, `text-green-400`, `text-red-400`, `text-yellow-400`, `text-orange-400`) on marketing, or pure white on dashboard chrome
- Stroke weight is **never changed** — Lucide defaults used as-is

### Canonical icon-to-concept mapping (from `features-showcase-page.tsx`)

| Lucide icon | Concept | Accent color |
|---|---|---|
| `Activity`   | Comprehensive Tracking | `text-blue-400`  |
| `Brain`      | AI-Powered Insights    | `text-purple-400` |
| `TrendingUp` | Advanced Analytics     | `text-green-400`  |
| `Heart`      | Holistic Health View   | `text-red-400`    |
| `Shield`     | Privacy & Security     | `text-yellow-400` |
| `Zap`        | Real-time Sync         | `text-orange-400` |

### Nav icons (from `dashboard-nav.tsx`)

`LayoutDashboard`, `BarChart3`, `BookOpen`, `Brain`, `Target`, `Settings`, `LogOut`, `Menu`, `X`

### Loading in HTML artifacts

Use the Lucide web package via CDN:

```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="activity"></i>
<script>lucide.createIcons();</script>
```

or inline SVG via `https://lucide.dev/icons/<name>`.

## Android — Material Symbols / Compose Material Icons

- Package: `androidx.compose.material.icons.filled.*` and `.outlined.*`
- Style: filled by default in the existing codebase (`Icons.Filled.Add`, `Icons.Filled.Face`, `Icons.Filled.DateRange`, `Icons.Filled.Refresh`) — per `HomeScreen.kt`, `SupplementDashboardScreen.kt`
- Size: 24dp default, 28dp for card header icons
- Tint: `MaterialTheme.colorScheme.primary` (the brand green) on interactive icons; `onSurfaceVariant` on muted

For web recreations of Android screens, use [Material Symbols](https://fonts.google.com/icons) — variant `Material Symbols Rounded`, fill 1, weight 400, grade 0, optical size 24, which is the closest visual match to `Icons.Filled.*`.

## No custom icon font or SVG set

Neither repo ships a branded icon set. The `/public/*.svg` files in the web repo (`vercel.svg`, `next.svg`, `file.svg`, `globe.svg`, `window.svg`) are **Next.js scaffolding, not brand assets** — ignore them.

## Emoji

Emoji appear in README-style copy only (🏃‍♂️ ❤️ 😴 😊 🌳 🥗 💊 on the Android metric-category list, 🏥 💊 📊 🧠 📝 on the web README). **Not used in product UI.** Don't add them to screens.

## Unicode characters

Not used as iconography. Text arrows / em-dashes / bullets appear naturally but never stand in for icons.

## Logo mark usage

The logo mark (see `assets/mark.svg`) is a rebuild of the user sketch — a square with a vertical divider, circle bottom-left, and a horizontal tick right-of-center. Use it as the app icon and nav brand lockup. It is **not** finalized; treat as a working placeholder.
