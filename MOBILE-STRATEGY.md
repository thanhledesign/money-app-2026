# Money App 2026 — Mobile (iOS / Android) Strategy

> **Status:** Planning only — no code changes yet
> **Created:** April 9, 2026
> **Author:** Claude + Thanh
> **Prerequisite:** Beta v0.1 polish complete

---

## Executive Summary

The app is already 80% mobile-ready. The PWA manifest exists, Tailwind is mobile-first, safe-area insets are handled, and Supabase sync works. The fastest path to native iOS/Android is **Capacitor** — it wraps the existing Vite/React app in a native shell with zero UI rewrite. A full React Native port is not justified for this project's scope.

---

## Recommended Approach: Capacitor (by Ionic)

### Why Capacitor over alternatives

| Option | Effort | Code Reuse | Native Feel | Store Publishable |
|--------|--------|------------|-------------|-------------------|
| **Capacitor** | 2-3 weeks | ~95% | Good (native shell + plugins) | Yes |
| Enhanced PWA | 1 week | 100% | Limited (no store, no biometrics) | No (web only) |
| React Native / Expo | 8-12 weeks | ~30% (logic only) | Excellent | Yes |
| Tauri Mobile | 4-6 weeks | ~90% | Good but immature | Yes (beta) |

**Capacitor wins** because:
- Your entire React + Vite + Tailwind codebase runs as-is inside a native WebView
- Native plugins for biometrics, push notifications, secure storage, camera
- Supabase JS SDK works identically — no auth flow changes
- Recharts renders in WebView with no changes
- One codebase deploys to web, iOS, and Android simultaneously
- Ionic is backed by a real company, mature ecosystem, active community

---

## What Changes (Code-Level)

### Must Fix (Blockers)

| Issue | Current Code | Mobile Fix | Files |
|-------|-------------|-----------|-------|
| `localStorage` (86 refs) | Direct `localStorage.*` calls | Wrap with Capacitor Preferences plugin (async, encrypted on device) | `src/lib/store.ts` |
| `window.location.reload()` | Hard refresh after import/reset | Replace with React state reset + navigation | `App.tsx`, `SettingsPage.tsx` |
| `window.location.origin` | OAuth redirect URL | Use `Capacitor.getUrl()` for deep link | `src/hooks/useAuth.ts` |
| `window.prompt()` | Dashboard name input | Replace with modal dialog (should do anyway) | `DashboardPage.tsx` |
| `window.confirm()` | Delete confirmations | Replace with custom confirm modal | `EntryPage.tsx` |
| Google OAuth redirect | Browser redirect flow | Use Capacitor Browser plugin for OAuth | `useAuth.ts` |

### Should Fix (Quality)

| Issue | Fix | Files |
|-------|-----|-------|
| Sidebar drag-resize | Disable on mobile, use hamburger/overlay | `Sidebar.tsx` |
| File export (`URL.createObjectURL`) | Use Capacitor Filesystem + Share plugin | `SettingsPage.tsx` |
| File import (`FileReader`) | Use Capacitor FilePicker plugin | `SettingsPage.tsx` |
| CodeMirror (CSS theme editor) | Test in WebView — may need mobile keyboard handling | `ThemeEditor.tsx` |
| `document.addEventListener` click-outside | Already works in WebView, but test | Multiple |

### No Changes Needed

- Supabase client & sync — works identically
- Recharts — renders in WebView
- Tailwind CSS — already mobile-first
- All business logic (`calculations.ts`, `tiers.ts`, etc.)
- Type definitions, data models
- Theme system (CSS variables work in WebView)
- Safe-area insets (already handled in `index.css`)

---

## New Native Features to Add

### Phase 1 — Ship to Store
1. **Biometric auth** (Face ID / fingerprint) — replace or augment password gate
2. **Secure storage** — Capacitor Secure Storage for Supabase tokens
3. **Splash screen** — native splash matching current theme
4. **App icon** — generate from existing SVG icons
5. **Status bar** — dark style matching glass theme
6. **Deep links** — `moneyapp://` scheme for share links

### Phase 2 — Post-Launch
7. **Push notifications** — "days since last snapshot" (backlog item #3)
8. **Camera** — receipt photo capture for Transaction Tracker
9. **Haptic feedback** — on undo/redo, delete, save actions
10. **Widget** — iOS/Android home screen widget showing net worth
11. **Apple/Google Sign-In** — native SDK (supplement Google OAuth)

---

## Implementation Rollout Plan

### Step 0: Pre-work (before touching mobile) — 1 day
- [ ] Abstract `localStorage` behind an async storage interface in `store.ts`
- [ ] Replace all `window.prompt()` / `window.confirm()` with React modal components
- [ ] Replace `window.location.reload()` with state resets
- [ ] These changes benefit the web app too — do them during beta polish

### Step 1: Capacitor Init — 0.5 day
```
npm install @capacitor/core @capacitor/cli
npx cap init "Money App" com.thanhle.moneyapp --web-dir dist
npx cap add ios
npx cap add android
```
- Configure `capacitor.config.ts` (server URL, plugins, splash, status bar)
- Add `npx cap sync` to build script

### Step 2: Storage Migration — 1-2 days
- [ ] Install `@capacitor/preferences` (replaces localStorage on native)
- [ ] Create `src/lib/storage.ts` — unified async API that uses:
  - `@capacitor/preferences` on iOS/Android
  - `localStorage` on web (fallback)
- [ ] Update `store.ts` to use the new async interface
- [ ] Test data migration: existing localStorage data → Capacitor Preferences
- [ ] Install `@capacitor-community/secure-storage` for auth tokens

### Step 3: Auth Flow — 1-2 days
- [ ] Install `@capacitor/browser` for OAuth popup
- [ ] Configure Supabase deep link callback: `com.thanhle.moneyapp://auth-callback`
- [ ] Add URL scheme to iOS `Info.plist` and Android `AndroidManifest.xml`
- [ ] Update `useAuth.ts` to detect platform and use correct redirect
- [ ] Test Google Sign-In on both platforms

### Step 4: Native Polish — 2-3 days
- [ ] Splash screen (`@capacitor/splash-screen`) — dark glass theme
- [ ] Status bar (`@capacitor/status-bar`) — transparent, light text
- [ ] App icons — generate all sizes from SVG (1024x1024 source)
- [ ] Safe area — verify existing CSS handles notch/dynamic island
- [ ] Keyboard handling — test all input fields, NumberInput portal
- [ ] Back button (Android) — wire to React Router history
- [ ] Gesture navigation — verify no conflicts with swipe-back

### Step 5: File Operations — 1 day
- [ ] Export: use `@capacitor/filesystem` + `@capacitor/share` instead of blob URLs
- [ ] Import: use `@capacitor/filesystem` file picker
- [ ] Share links: use `@capacitor/share` native sheet

### Step 6: Biometric Auth — 1 day
- [ ] Install `@capacitor-community/biometric-auth`
- [ ] Add biometric unlock option in Settings (replace/supplement password gate)
- [ ] Store biometric preference in secure storage

### Step 7: Testing & Store Submission — 3-5 days
- [ ] Test on physical iOS device (not just simulator)
- [ ] Test on physical Android device
- [ ] iOS: Xcode → Archive → App Store Connect → TestFlight
- [ ] Android: Android Studio → Signed APK → Google Play Console → Internal Testing
- [ ] App Store screenshots (6.7", 6.5", 5.5" iPhone + iPad)
- [ ] Play Store screenshots (phone + tablet)
- [ ] Privacy policy URL (required by both stores)
- [ ] App review descriptions, keywords, categories (Finance)

---

## What I Need From You (Thanh)

### Before Starting Mobile
1. **Apple Developer Account** ($99/year) — required for iOS App Store
2. **Google Play Developer Account** ($25 one-time) — required for Play Store
3. **Mac with Xcode** — iOS builds require macOS (can't build iOS on Windows)
   - Alternative: use a CI service like GitHub Actions with macOS runners
   - Alternative: use Ionic Appflow ($$$) for cloud builds
4. **Bundle ID decision** — e.g., `com.thanhle.moneyapp` or `com.moneyapp2026.app`
5. **App name for stores** — "Money App" or something else? (check for conflicts)
6. **Privacy policy** — required by both stores, especially for financial data
7. **Google Cloud Console** — add iOS/Android OAuth client IDs for Supabase auth

### Nice to Have
8. **Physical test devices** — iOS and Android (simulators miss real-world issues)
9. **TestFlight testers** — email list for beta distribution
10. **App icon design** — or I can generate from the existing SVG

---

## Level of Effort

| Phase | Days | Blocked By |
|-------|------|------------|
| Pre-work (store abstraction, modal replacements) | 1 | Nothing — do during beta polish |
| Capacitor init + config | 0.5 | Nothing |
| Storage migration | 1-2 | Pre-work |
| Auth flow | 1-2 | Google Cloud Console setup |
| Native polish | 2-3 | iOS: Mac + Xcode |
| File operations | 1 | Nothing |
| Biometric auth | 1 | Nothing |
| Testing + store submission | 3-5 | Developer accounts, Mac, test devices |
| **Total** | **~10-15 days** | |

**Realistic timeline:** 2-3 weeks of focused work, assuming you have the Mac/accounts ready.

---

## When to Tackle Mobile vs. Polishing Beta

### Recommendation: Finish beta polish first, then mobile

**Why:**
1. Every bug you fix in the web app is automatically fixed in the mobile app (shared codebase)
2. The `window.prompt/confirm/reload` replacements you'd do for mobile also improve the web UX
3. Stripe integration (backlog) should be designed once for both platforms
4. User feedback from the web beta will surface UX issues cheaper to fix before wrapping in native
5. App Store review is strict — a polished app gets approved faster

**Suggested sequence:**
```
Now        → Beta polish + user feedback revisions (web)
           → Do Step 0 pre-work during this phase (benefits both)
+2 weeks   → Charts month comparison, notifications (remaining backlog)
+3 weeks   → Stripe integration (design for web + mobile simultaneously)
+4 weeks   → Capacitor mobile build (Steps 1-7)
+6 weeks   → TestFlight / Play Store internal testing
+7 weeks   → Public release
```

**Exception:** If you want the app on your own phone ASAP for personal use, you can do Steps 0-4 in ~3 days and run a debug build via Xcode/Android Studio without going through the stores. This is a valid "dogfooding" approach.

---

## Security Considerations for Mobile

### Data at Rest
- Capacitor Preferences is **not encrypted** by default on Android (use Secure Storage for sensitive data)
- iOS Keychain via `@capacitor-community/secure-storage` for auth tokens
- Consider encrypting the full data blob before writing to Preferences

### Network Security
- Supabase already uses HTTPS + RLS — no changes needed
- Add certificate pinning for extra security (optional, Capacitor plugin available)
- Disable WebView debugging in production builds

### Auth Security
- Biometric auth should be a convenience unlock, not a replacement for Supabase auth
- Use PKCE flow for OAuth on mobile (Supabase supports this)
- Store refresh tokens in Secure Storage, never in Preferences

### App Store Compliance
- **Apple:** Financial apps need clear privacy disclosures; no actual financial advice
- **Google:** Similar requirements; declare all data types collected
- Both require privacy policy URL in store listing
- Transaction data stays on-device + user's own Supabase project — strong privacy story

---

## File Structure After Capacitor Setup

```
money-app/
├── src/                    # Unchanged React app
├── public/                 # Unchanged static assets
├── ios/                    # NEW — Xcode project (auto-generated)
│   └── App/
│       ├── Info.plist
│       └── AppDelegate.swift
├── android/                # NEW — Android Studio project (auto-generated)
│   └── app/
│       ├── AndroidManifest.xml
│       └── MainActivity.java
├── capacitor.config.ts     # NEW — Capacitor configuration
├── dist/                   # Vite build output (loaded by native shell)
├── package.json            # + @capacitor/* dependencies
└── vite.config.ts          # Unchanged
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| No Mac for iOS builds | Can't build iOS at all | Use GitHub Actions macOS runner or borrow/rent a Mac |
| Recharts performance in WebView | Slow charts on older phones | Benchmark on low-end devices; consider `react-native-svg-charts` fallback |
| CodeMirror in mobile WebView | Keyboard/scroll issues | Test early; may need to disable or simplify on mobile |
| OAuth redirect issues on mobile | Users can't sign in | Test deep links thoroughly on both platforms |
| App Store rejection | Delayed launch | Follow guidelines strictly; submit early for pre-review |
| localStorage → async migration | Data loss during upgrade | Write migration with fallback to localStorage if Preferences fails |
