# Wegood4u — Vendors (Partner Portal) — Status

_Last updated: 2026-07-13 · Investigation snapshot, no code changed._

## TL;DR

The vendor web app is a **near-complete frontend running almost entirely on mock
data**, with the **real Supabase auth + backend plumbing already built and wired
in** but currently switched **off** via an env flag. Exactly **one** live backend
metric is integrated so far (store favorite count). Everything else on every
dashboard page is hardcoded mock data.

- **Auth:** `NEXT_PUBLIC_AUTH_MODE=mock` → login accepts any input; a
  `localStorage` flag gates the dashboard. Flip to `supabase` to activate real auth.
- **Data:** ~95% mock (`src/lib/mock/*`, ~986 LOC). 1 real integration:
  `get_store_favorite_count` RPC on the Dashboard "Favorites" KPI.
- **Backend readiness:** Supabase client, `partner_accounts` lookup, server-side
  middleware route guard, and the favorites RPC are all coded and ready to go.

## Stack

| | |
|---|---|
| Framework | Next.js 16.1.6 (App Router, webpack dev, `--port 3030`) |
| React | 19.2.3 |
| UI | Tailwind v4, shadcn-style `components/ui/*`, lucide-react, framer-motion |
| Data/charts | Recharts, TanStack Query + Table |
| Backend SDK | `@supabase/ssr` + `@supabase/supabase-js` (browser + server clients) |
| PWA | `@ducanh2912/next-pwa` (enabled in `next.config.ts`) |

## Auth — real code, currently mocked off

Auth is a **two-mode switch** on `NEXT_PUBLIC_AUTH_MODE` (see `src/lib/auth.ts`):

- **`mock` (current setting):**
  - `login/page.tsx` accepts any email/password → `mockSignIn()` sets a
    `wv-mock-session` localStorage flag.
  - `(dashboard)/layout.tsx` → `MockAuthGate` renders the shell on that flag.
    Store context is seeded with `storeIds=[]` and a hardcoded
    `partner@thaigeng.com` email.
  - `middleware.ts` short-circuits (no server-side protection).
- **`supabase` (built, inactive):**
  - `login/page.tsx` → real `signInWithPassword`, then `fetchPartnerAccounts()`
    rejects any user with no row in `partner_accounts`.
  - `(dashboard)/layout.tsx` → `SupabaseAuthGate` resolves the session, loads
    partner accounts via TanStack Query, and derives real `storeIds`.
  - `middleware.ts` → server-side `getUser()` guard redirects unauthenticated
    users to `/login` and authenticated users away from it.
    - ⚠️ **Caveat:** the app deploys via `output: "export"` (static → Firebase
      Hosting), and **middleware cannot run in a static export** — Next.js errors
      `Middleware cannot be used with "output: export"` and drops it. So in
      production, route protection rests **entirely on the client-side gates**
      (`MockAuthGate`/`SupabaseAuthGate`) + Supabase RLS. Decide: drop
      `middleware.ts` (rely on client gates + RLS) or move to a Node/SSR deploy
      target to make it real.
  - Sign-out (`sidebar.tsx`, `settings/page.tsx`) calls `supabase.auth.signOut()`.

**To go live on auth:** set `NEXT_PUBLIC_AUTH_MODE=supabase` (or remove the line)
and ensure `partner_accounts` rows exist for real partner users. No code changes
needed.

## Backend integration status — page by page

| Route | Data source | Backend? |
|---|---|---|
| `(auth)/login` | Supabase auth (mock-gated) | **Real (inactive in mock mode)** |
| `(dashboard)/` Dashboard | Mock KPIs/visits/calendar/demographics | Mock — **except Favorites KPI** |
| `(dashboard)/visits` | `MOCK_*` | Mock |
| `(dashboard)/demographics` | `MOCK_*` | Mock |
| `(dashboard)/peak-hours` | `MOCK_*` | Mock |
| `(dashboard)/content` | `MOCK_*` (IG/TikTok shown "coming soon") | Mock |
| `(dashboard)/billing` | `MOCK_*` | Mock |
| `(dashboard)/settings` | `MOCK_*` (Supabase used only for sign-out) | Mock |

### The one real metric

`src/app/(dashboard)/page.tsx` → **Favorites KPI** calls
`fetchStoreFavoriteCount(storeId)` → Supabase RPC `get_store_favorite_count`
(authorizes the caller as the store's partner/admin server-side). It only fires
when a real `storeId` exists (i.e. under Supabase auth); in mock mode it falls
back to the active store's `dataset.kpis.favorites` so the card matches the rest
of the dashboard.

## Mock data — multi-store (updated 2026-07-13)

- **Three real Thai Geng partner stores** (mirrored from the Supabase
  `partner_stores` rows), switchable from the header store pill:
  | Store | id | Verified / full month | Fee | Plan | Enrolled |
  |---|---|---|---|---|---|
  | Thai Geng Mookata Bukit Jalil | `tg-bukit-jalil` | 30 | RM 3.00 | Growth | 2026-02-14 |
  | Thai Geng Signature SS2 | `tg-signature-ss2` | 20 | RM 4.00 | Starter | 2026-03-05 |
  | Thai Geng Mookata Bukit Raja Klang | `tg-bukit-raja-klang` | 50 | RM 3.00 | Premium | 2026-01-20 |
- **Engine** (`src/lib/mock/`): `stores.ts` (the 3 profiles + config),
  `generator.ts` (`buildStoreDataset` — deterministically derives visits, KPIs,
  trend, demographics, 12-month calendar, billing statements, content from each
  store's monthly verified targets), `datasets.ts` (registry keyed by store id),
  `constants.ts` (date anchors + seeded RNG/aggregation helpers). One owner
  (`MOCK_USER`) across all three.
- **Switcher**: `src/lib/active-store.tsx` (`ActiveStoreProvider` +
  `useActiveStore()`) holds the selected store + its dataset, persisted to
  `localStorage` (`wv-active-store`). The header dropdown swaps it; every page
  reads `useActiveStore().dataset` and re-renders reactively.
- All randomness is seeded (per store id) → stable across renders, no hydration
  mismatch.
- **Fully live to the real current date.** The whole dataset is a function of
  `today` — `getStoreDataset(storeId, today)` (memoised per store+day). The real
  date is resolved client-side via `useLiveToday()` (starts at the `MOCK_TODAY`
  fallback for a deterministic first render, then extends forward on mount) and
  carried through the `ActiveStoreProvider` as `today`. So visit records run from
  enrollment right up to today, "this month" is the real current month, and the
  calendar rolls to today with no synthetic-fill hack (real visits reach today).
- **Historical vs ongoing volume:** each store's explicit `monthlyTargets` cover
  the ramp through May 2026 (ending at its 30/20/50 headline); every month after
  that runs at `normalMonthly` (30/20/50), with the **current month pro-rated to
  the day**. So May & June are full months at the normal rate; the current month
  fills in as it progresses (e.g. mid-July shows ~14/9/23). Month pickers on the
  Dashboard/Demographics track the real last-3-months.
- Range filters on the Visits page compare by absolute timestamp (fixed an
  earlier string-comparison bug across `+08:00`/`Z` offsets).
- Prior-month totals ramp proportionally so trends/deltas populate. Numbers are
  self-consistent per store (e.g. amount owed = verified × per-visit fee).
- Domain shapes typed in `src/types/domain.ts` — generated Supabase types can
  feed these hand-rolled shapes via adapters when real queries land (Pass 2).

## What's built vs. what's pending

**Done**
- Full dashboard UI: 7 routes, KPI cards, charts (visit trend, donut, calendar,
  demographics, peak hours), data tables, billing statements, settings.
- Complete real-auth path (client + server), partner-account gating, sign-out.
- Supabase clients + first real RPC integration + PWA setup.

**Pending (mock → live)**
- Switch `NEXT_PUBLIC_AUTH_MODE` to `supabase` and provision `partner_accounts`.
- Replace `from "@/lib/mock"` imports with real Supabase queries/hooks per page
  (visits, KPIs, demographics, peak hours, billing) — the mock barrel comment
  flags this as "Phase C onward".
- Content/reach: YouTube key present in `.env`; TikTok + Instagram gated behind
  "awaiting approval" — not yet wired.
- `custom` date-range preset is a UI-only no-op until a date-picker modal lands.

## Dev environment & known gotchas

- **Run dev with:** `bun run dev` (script is `next dev --webpack --port 3030`).
  Dev is on **webpack, not Turbopack** — Turbopack in Next 16 panics
  (`Next.js package not found`) on the `output: "export"` + `middleware.ts`
  combo. `build` also uses `--webpack`.
- **Stale service-worker reload loop (`GET /` ↔ `GET /login` storm):** caused by
  a leftover workbox SW (`public/sw.js` + `workbox-*.js`) from a past local prod
  run / build, still registered in the browser with `skipWaiting`+`clientsClaim`.
  Guardrails now in place:
  - `predev` script auto-deletes SW artifacts before every dev start.
  - `DevSwKiller` (root layout) unregisters the SW, clears its caches, and does
    one guarded reload to evict a controlling SW.
  - SW files are gitignored, so they never get committed.
  - **Avoid re-triggering:** don't serve the production build (`start` /
    `firebase serve`) on the same `localhost:3030` origin you dev on — that's what
    registers the SW on that origin in the first place. If you must test the PWA
    build, use a different port and unregister it (DevTools → Application →
    Service Workers) when done.

## Env (`.env`)

```
NEXT_PUBLIC_SUPABASE_URL              # set
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # set
NEXT_PUBLIC_AUTH_MODE=mock            # ← flip to "supabase" to go live
YOUTUBE_API_KEY                       # set (content not yet wired)
TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET  # set (pending platform approval)
```
