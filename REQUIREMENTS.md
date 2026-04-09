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
- [x] **Supabase data sync** — CloudSyncPanel in Settings with Upload/Download/Sync Now buttons
- [ ] **Mobile testing pass** — Multi-dashboard switcher, resizable sidebar, new Settings sections need mobile QA
- [ ] **Run supabase-migration.sql** — Must be run in Supabase SQL Editor for cloud sync to work

### Medium Priority
- [x] **Sidebar double-click reset** — Already implemented (double-click resize handle)
- [x] **Combined dashboard polish** — Source dashboard names shown in combined banner
- [ ] **Paid upgrade flow** — Stripe or "contact for access" for >3 dashboards
- [x] **Entry page improvements** — Auto-pull previous balances already working, live diff as you type
- [x] **Sample Dashboard banner** — Already renders in Layout for all pages

### UX/UI Improvements
- [ ] **Dashboard switcher width** — Wider popover or dedicated /dashboards management page
- [ ] **Inline page title editing** — Click any page title to edit directly (currently buried in Settings)
- [x] **Richer empty state** — Quick-start checklist with context-aware routing per page
- [ ] **Charts: month comparison** — Side-by-side month comparison view

### Nice-to-Haves
- [ ] Undo/redo for data changes
- [x] **Dark/light mode toggle** — Settings > Appearance with Dark/Light/System modes
- [ ] Notifications/reminders ("You haven't recorded a snapshot in 2 weeks")
- [ ] Progressive web app (PWA) for mobile install

## Technical Notes
- Branch: `v2-enhancements` (merged to `master` for Vercel deploys)
- Vercel: https://money-app-zeta.vercel.app (password: shoryuken)
- GitHub: thanhledesign/money-app-2026
- Supabase: configured for Google OAuth (env vars in Vercel)
- Data: localStorage with user-scoped + dashboard-scoped keys
- Stack: React 19, Vite, Tailwind v4, Recharts, Supabase, CodeMirror
