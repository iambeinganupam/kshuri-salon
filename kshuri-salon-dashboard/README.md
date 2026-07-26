# Kshuri Salon Dashboard

> Enterprise B2B desktop portal for the **`business_admin`** persona. Multi-location staff rosters, shift scheduling, payroll, service catalog, and KYC onboarding. Dev port: **`:8081`**.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick start](#2-quick-start)
3. [Available scripts](#3-available-scripts)
4. [Environment variables](#4-environment-variables)
5. [Pages & routes](#5-pages--routes)
6. [Architecture](#6-architecture)
7. [Testing](#7-testing)
8. [Build & preview production](#8-build--preview-production)
9. [Troubleshooting](#9-troubleshooting)
10. [Cross-references](#10-cross-references)

---

## 1. Prerequisites

| Tool | Version |
|:---|:---|
| Node.js | ≥ 20 |
| npm | 10.x |
| Backend running | `http://localhost:3001` — see [`backend/README.md`](../backend/README.md) |

A `business_admin` account is required. Register a fresh one at `/signup` or use the seeded e2e account if your dev DB has seed data: `e2e-salon@kshuri.test` / `E2eTest@2026!`.

---

## 2. Quick start

```bash
# From the repo root (one time)
npm install

cd kshuri-salon-dashboard
cp .env.example .env
npm run dev            # http://localhost:8081
```

---

## 3. Available scripts

| Script | What it does |
|:---|:---|
| `npm run dev` | Vite dev server on `:8081` with HMR |
| `npm run build` / `build:dev` | Production / development build to `dist/` |
| `npm run preview` | Serve the `dist/` build locally |
| `npm run lint` | ESLint over `src/` |
| `npm test` | `vitest run` — unit + component tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with `@vitest/coverage-v8` |

---

## 4. Environment variables

| Variable | Required | Description |
|:---|:---|:---|
| `VITE_API_URL` | yes | Backend base URL |
| `VITE_SENTRY_DSN`, `VITE_RELEASE` | no | Sentry release tracking |
| `VITE_GOOGLE_CLIENT_ID` | no | Google OAuth |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET` | only for FCM | Web push via Firebase Cloud Messaging |

---

## 5. Pages & routes

[`src/pages/`](src/pages/). Wrapped by `src/components/PortalLayout.tsx`.

| Domain | Page(s) | Responsibility |
|:---|:---|:---|
| Auth | `LoginPage`, `SignupPage` | Email/password + Google sign-in |
| Onboarding | `Onboarding/` | KYC submission, business profile setup (Phase 2) |
| Overview | `Dashboard`, `AnalyticsPage` | Daily KPIs, time-series revenue |
| Scheduling | `CalendarPage` | `time_blocks` grid (leaves/exceptions) |
| Operations | `bookings/` | Accept/reject appointment queue |
| Identity | `SalonProfilePage`, `PortfolioPage` | Public salon details + media |
| Catalog | `Services` | Per-location service pricing |
| Team | `StaffPage`, `StaffDetailPage`, `FreelancerPage`, `FreelancerDetailPage` | Roster, payroll, performance |
| Finance | `BillingPage`, `TransactionsPage`, `ReportsPage`, `billing/` | Settlements, ledger, exports |
| Engagement | `MessagesPage` | Vendor ↔ customer threads (Phase 3) |
| Settings | `SettingsPage`, `settings/` | Hours, preferences |

---

## 6. Architecture

```
src/
├── components/
│   ├── PortalLayout.tsx     Collapsible sidebar + top bar shell
│   ├── NavLink.tsx          Active-state nav helper
│   └── ui/                  shadcn primitives
├── data/                    Mock fixtures for dev
├── hooks/                   use-toast etc.
├── lib/                     api client, formatters
└── pages/                   ~22 route entry points
```

**Stack** — React 18, Vite 5, react-router-dom v6, TanStack Query v5, react-hook-form + Zod, Tailwind v3, shadcn/Radix, framer-motion, recharts, sonner. MSW used as a test-time mock server. Firebase wired for FCM push.

**Manual chunking** is the most aggressive of the SPAs — `vendor`, `ui`, `query`, `supabase`, `charts`, `motion`, full radix split. See [`vite.config.ts`](vite.config.ts).

---

## 7. Testing

```bash
npm test
npm run test:watch
npm run test:coverage   # HTML report under coverage/
```

Strongest coverage in the monorepo — 9 `.test.tsx` files, MSW for network mocking, coverage thresholds enforced via `vitest.config.ts`.

---

## 8. Build & preview production

```bash
npm run build
npm run preview
```

In production, set `VITE_API_URL`, `VITE_SENTRY_DSN`, `VITE_RELEASE`, and the Firebase set at build time. The CD pipeline uploads `dist/`.

---

## 9. Troubleshooting

| Symptom | Fix |
|:---|:---|
| `Port 8081 in use` | `lsof -ti:8081 \| xargs kill` |
| Login succeeds but redirects to `/` | KYC may be required for vendor flows. Check `kyc_status` on the user; complete Onboarding. |
| Charts blank | Materialised analytics view not refreshed yet — backend job runs every 5 min. |
| Firebase missing config | Push won't initialise; leave Firebase env vars blank to skip silently. |

---

## 10. Cross-references

- [`backend/README.md`](../backend/README.md), [`docs/MASTER_API_REQUIREMENTS.md`](../docs/MASTER_API_REQUIREMENTS.md), [`docs/MASTER_SCHEMA.md`](../docs/MASTER_SCHEMA.md)
- [`apps-mobile/salon/README.md`](../apps-mobile/salon/README.md) — Expo twin (canonical mobile reference)
- [`packages/ui/README.md`](../packages/ui/README.md), [`packages/api-client/README.md`](../packages/api-client/README.md)
