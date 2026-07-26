# @kshuri/observability

Tiny wrapper around `@sentry/react` that gives every web frontend the same Sentry init contract, the same `<ErrorBoundary>`, and the same user-tagging helper. The mobile equivalent ships in [`@kshuri/mobile-core/observability`](../mobile-core/README.md).

## API surface

```ts
import {
  initSentry,
  setSentryUser,
  ErrorBoundary,
  Sentry,            // re-export of @sentry/react for direct calls
  type SentryInitOptions,
} from '@kshuri/observability';
```

## Wiring it into an app

Every Vite SPA mounts it in `src/main.tsx` before rendering:

```tsx
import { initSentry, ErrorBoundary } from '@kshuri/observability';

initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_RELEASE,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});

createRoot(rootEl).render(
  <ErrorBoundary fallback={<CrashScreen />}>
    <App />
  </ErrorBoundary>,
);
```

Tag the user after login:

```ts
import { setSentryUser } from '@kshuri/observability';

setSentryUser({ id: user.id, role: user.role, tenantId: user.tenantId });
```

`initSentry` is a **no-op when `VITE_SENTRY_DSN` is empty**, so dev environments incur no overhead.

## Folder

```
src/
├── index.ts          public surface
├── init-sentry.ts    initSentry(options) — installs BrowserTracing + replay
├── error-boundary.tsx <ErrorBoundary> wrapping Sentry.ErrorBoundary
└── set-user.ts       setSentryUser(user) — adds tags + scope
```

## Peer dependency

| Peer | Min version |
|:---|:---|
| `react` | 18 |

Owns `@sentry/react ^7.116.0` directly. No build step — TypeScript source consumed by each app's bundler.

## When *not* to use this

- **Backend** uses `@sentry/node` directly, wired in `backend/src/server.ts`.
- **Mobile** uses `@sentry/react-native` via `@kshuri/mobile-core/observability`.

This package exists only for the React/Web layer.
