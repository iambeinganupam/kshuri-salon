# @kshuri/mobile-core

React Native / Expo platform glue. Wires [`@kshuri/api-client`](../api-client/README.md) to the device — secure token storage, cookie shimming, push registration, Sentry init, offline query persistence, and OTA update orchestration.

Used by all six Expo apps under `apps-mobile/`. **Web (Vite SPAs) and Node (backend) do not import this package** — its peer deps are RN-only.

## What's in the box

```
src/
├── auth/           Zustand store + SecureStore-backed token persistence
├── api/            createApi() — wraps @kshuri/api-client with the token store + cookie shim
├── cookies/        @react-native-cookies bridge so refresh cookies survive backgrounding
├── push/           expo-notifications registration + token POST to /devices
├── observability/  @sentry/react-native init + tag wiring
├── updates/        expo-updates check-on-foreground + reload helpers
├── onboarding/     AsyncStorage flag store for the first-run flow
└── utils/          Misc (haptics wrapper, deep-link helpers)
```

## Subpath exports

```ts
import { useAuth, AuthProvider } from '@kshuri/mobile-core/auth';
import { createApi, ApiProvider } from '@kshuri/mobile-core/api';
import { registerForPushAsync } from '@kshuri/mobile-core/push';
import { initObservability } from '@kshuri/mobile-core/observability';
import { checkForOtaUpdate } from '@kshuri/mobile-core/updates';
import { useOnboardingState } from '@kshuri/mobile-core/onboarding';
```

The bare `@kshuri/mobile-core` import re-exports everything.

## Wiring it in an Expo app

The salon app is the canonical reference — see `apps-mobile/salon/app/_layout.tsx` and `apps-mobile/salon/src/lib/api.ts`.

```tsx
// app/_layout.tsx
import { AuthProvider } from '@kshuri/mobile-core/auth';
import { ApiProvider } from '@kshuri/mobile-core/api';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@kshuri/ui-native';
import { initObservability } from '@kshuri/mobile-core/observability';

initObservability({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });

export default function RootLayout() {
  return (
    <ApiProvider baseUrl={process.env.EXPO_PUBLIC_API_URL!}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider tokens={brandTokens}>
            <Slot />
          </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ApiProvider>
  );
}
```

## Peer dependencies (all RN-only)

| Peer | Why |
|:---|:---|
| `expo-secure-store` | Refresh-token storage (encrypted) |
| `expo-notifications` | Push token registration |
| `expo-device`, `expo-constants` | Device id + app version for `/devices/register` |
| `expo-haptics` | Touch feedback hooks |
| `expo-updates` | OTA reload prompts |
| `@react-native-cookies/cookies` | iOS/Android cookie jar shim for `withCredentials` |
| `@sentry/react-native` | Crash reporting |
| `@tanstack/react-query` + persister + `@react-native-async-storage/async-storage` | Offline cache |
| `axios` | Underlying HTTP transport |
| `react-native` ≥ 0.76, `react` 18 | Runtime |

These are all already installed in each `apps-mobile/<app>/package.json`. The package owns only `zustand` directly to keep its surface small.

## Environment variables

Mobile apps read exactly two env vars (see `apps-mobile/<app>/.env.example`):

| Variable | Required | Purpose |
|:---|:---|:---|
| `EXPO_PUBLIC_API_URL` | yes | Base URL of the backend (e.g. `http://localhost:3001`, or LAN IP on a device) |
| `EXPO_PUBLIC_SENTRY_DSN` | no | Sentry DSN — leave blank in dev |

> On a physical device on the same Wi-Fi, replace `localhost` with your machine's LAN IP (e.g. `http://192.168.1.20:3001`). Android emulator uses `10.0.2.2`. iOS simulator can use `localhost`.

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint src/**/*.ts*
```

No build step — consumers transpile the TypeScript source via Metro.

## See also

- [`@kshuri/ui-native`](../ui-native/README.md) — primitive component kit paired with this package.
- [`apps-mobile/salon/README.md`](../../apps-mobile/salon/README.md) — fullest example consumer.
