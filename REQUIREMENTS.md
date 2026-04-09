# Money App 2026 — Requirements & Roadmap

## Completed Features

### MVP (Previous Sessions)
- Full financial dashboard with 8 KPI cards
- 10 data pages: Dashboard, Add Snapshot, Cash Accounts, Investments, Debt, Net Worth, Income, Budget, Goals, Tools
- Per-page themes with accent colors
- Account management (add/remove/toggle active)
- Recharts visualizations (area, line, bar, pie charts)
- Onboarding wizard (6 steps: profile, accounts, income, budget, goals, summary)
- Tools page (debt payoff, emergency fund, paycheck estimator calculators)
- Theme editor with 5 presets, CSS variable editor, custom CSS, export/import
- Mobile responsive layout
- Password gate for beta access
- Admin designer mode

### Session 2 Features
- Sticky dashboard edit panel with individual KPI sub-toggles (8 cards)
- Drag-to-resize sidebar (180–360px, persists to localStorage)
- Live page title editing in Settings
- Grey out past month columns, current month bright (all 4 data pages)
- Supabase Google OAuth integration
- Per-user data scoping (localStorage keyed by userId)
- Sign In button for local mode users
- Export: JSON full backup + CSV (snapshots, budget, accounts)
- Import with preview (shows counts before confirming)
- Per-category data reset (snapshots, accounts, budget, goals, income)
- Nuke all data (type DELETE to confirm)
- Personal data template (importable JSON at /templates/thanh-2026.json)
- Multi-dashboard: 3 free, scenario/view/combined modes
- Dashboard switcher in sidebar with cog wheel action menu (rename/delete/export/import/duplicate)
- Duplicate dashboard feature (copies all data to a new scenario dashboard)
- Preloaded Sample Dashboard with fake bank names
- Empty state with "Start Setup Wizard" prompt on all pages

## Pending Features

### High Priority
- [x] **Share feature** — ShareButton on dashboard generates read-only links via Supabase
- [x] **Supabase data sync** — CloudSyncPanel syncs 8 categories (dashboards, settings, themes, backgrounds, etc.)
- [x] **Supabase migration** — user_data table created, cloud sync working
- [x] **Tier system** — Free/Pro/Premium with UpgradeGate, FeatureBadge, Settings tier switcher

### Medium Priority
- [x] **Sidebar double-click reset** — Already implemented
- [x] **Combined dashboard polish** — Source dashboard names in banner
- [ ] **Stripe integration** — Wire getUserTier to Supabase user metadata
- [x] **Entry page improvements** — Auto-pull balances, live diff
- [x] **Sample Dashboard banner** — In Layout for all pages

### UX/UI Improvements
- [x] **Dashboard switcher width** — Widened to 300px, glass styling
- [x] **Inline page title editing** — Click any page title to rename (already works)
- [x] **Richer empty state** — Context-aware routing per page
- [ ] **Charts: month comparison** — Side-by-side month comparison view

### Nice-to-Haves
- [ ] Undo/redo for data changes
- [x] **Dark/light mode toggle** — Settings > Appearance
- [ ] Notifications/reminders
- [x] **PWA** — manifest.json, apple-mobile-web-app meta tags

### Design & Premium Features
- [x] **Glass design system** — Frosted cards, mouse glow, GlassCard component
- [x] **13 CSS background themes** — Abstract gradients, no external images needed
- [x] **Background image editor** — 12 Unsplash presets, upload, crop, focal point, scrim
- [x] **Pastel chart palette** — COLORS (pastel fills) + VIVID (line strokes)
- [x] **Snapshot FAB** — Accent camera button on all pages
- [x] **Transaction Tracker** — Pro feature with full expense/income logging
- [x] **Pay frequency support** — Weekly/biweekly/semimonthly/monthly in Income

## Technical Notes
- Branch: `v2-enhancements` (merged to `master` for Vercel deploys)
- Vercel: https://money-app-zeta.vercel.app (password: shoryuken)
- GitHub: thanhledesign/money-app-2026
- Supabase: configured for Google OAuth (env vars in Vercel)
- Data: localStorage with user-scoped + dashboard-scoped keys
- Stack: React 19, Vite, Tailwind v4, Recharts, Supabase, CodeMirror
