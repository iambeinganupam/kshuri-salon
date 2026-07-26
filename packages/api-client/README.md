# @kshuri/api-client

Shared, typed REST client + React Query hooks consumed by every Kshuri frontend (6 Vite SPAs, 6 Expo apps, the Next.js portal).

Replaces six near-identical per-app `apiClient.ts` files. Single source of truth for endpoint shapes, request/response types, and auth/refresh handling. Works on Node, Vite (browser), and React Native.

## When to use which import

```ts
// 1) Pre-built React Query hooks (most consumers)
import { useBookings, useBookingMutation } from '@kshuri/api-client/hooks';

// 2) Bare service functions (call inside Server Actions or imperative flows)
import { booking, catalog } from '@kshuri/api-client/services';

// 3) Low-level axios client (custom interceptors, refresh handling)
import { createApiClient } from '@kshuri/api-client/client';

// 4) Shared request/response types
import type { Booking, ServiceCategory } from '@kshuri/api-client/types';

// 5) Firebase OTP helpers (web + mobile)
import { signInWithPhoneOtp } from '@kshuri/api-client/firebase';

// 6) Google OAuth helpers
import { exchangeGoogleCredential } from '@kshuri/api-client/google';
```

## Installing in a workspace

This package is consumed via the npm workspaces protocol — already wired in every app's `package.json`:

```jsonc
{
  "dependencies": {
    "@kshuri/api-client": "*"
  }
}
```

A root `npm install` resolves the symlink. No build step (the package is TypeScript-source-first; consumers transpile via their own bundler).

## Peer dependencies

| Peer | Min version |
|:---|:---|
| `react` | 18 |
| `axios` | 1.6 |
| `@tanstack/react-query` | 5 |
| `firebase` | 10 (only if you import `/firebase`) |

The mobile apps add a few RN-specific peers — see [`@kshuri/mobile-core`](../mobile-core/README.md), which wraps this client with secure storage, cookie shimming, and persistence.

## Folder map

```
src/
├── client/         createApiClient() — axios instance + auth/refresh interceptor
├── services/       Per-module REST functions (booking, catalog, kyc, messaging, …)
├── hooks/          React Query wrappers (useBookings, useStartBookingIntent, …)
├── types/          Shared request/response types (drives both ends)
├── providers/      Top-level providers (ApiProvider, QueryProvider helpers)
├── firebase/       Firebase phone-OTP helpers
├── google/         Google OAuth credential exchange
├── addresses.ts    Address book CRUD (Phase 0)
├── entitlements.ts Plan entitlement queries (Phase 2)
├── geocoding.ts    Forward/reverse geocoding wrapper
├── kyc.ts          KYC submission upload + status
├── messaging.ts    Threads + long-poll helpers (Phase 3)
├── notifications.ts Notification list + preferences (Phase 1)
└── utils/          Pagination, error normaliser
```

## Auth model

`createApiClient()` returns an axios instance pre-configured with:

- `withCredentials: true` — refresh cookie is sent on every call.
- A response interceptor that on `401 TOKEN_EXPIRED` calls `POST /auth/refresh` once, then retries the original request transparently.
- A request interceptor that attaches `Authorization: Bearer <accessToken>` from whichever token store the host app passes in (web: in-memory + sessionStorage; mobile: SecureStore via `@kshuri/mobile-core`).

The token store is **not** owned by this package — host apps wire it in. This keeps the client free of `window`/`AsyncStorage` references.

## Versioning

The package is `private: true` inside the monorepo. Breaking changes go through the regular PR review and update every consumer in the same commit (`turbo run lint`/`typecheck` enforces that).

## See also

- [`@kshuri/mobile-core`](../mobile-core/README.md) — mobile auth/api glue that builds on this client.
- [`backend/README.md`](../../backend/README.md) — the API this client speaks to.
- [`docs/MASTER_API_REQUIREMENTS.md`](../../docs/MASTER_API_REQUIREMENTS.md) — contract.
