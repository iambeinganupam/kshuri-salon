# @kshuri/ui-native

React Native primitive component kit for the six Expo apps under `apps-mobile/`. Mirrors the shadcn API surface from [`@kshuri/ui`](../ui/README.md) so the mental model is identical across web and native.

Brand tokens come from [`@barber/config`](../config/README.md) — `themes.<app>.light/dark`. Change a token there and both this kit and its web sibling recolor.

## What's exported

```ts
import {
  ThemeProvider,
  useTheme,
  cn,

  // primitives
  Button,
  Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription,
  Input, Label, Text,
  Avatar, AvatarImage, AvatarFallback,
  Badge,
  Skeleton, Separator, Spinner,

  // app shell
  BrandedSplash,
  OnboardingCarousel,
} from '@kshuri/ui-native';
```

NativeWind global CSS is shipped as a side-effect file:

```ts
// app/_layout.tsx — once per app
import '@kshuri/ui-native/global.css';
```

## Folder

```
src/
├── components/      Primitives + app shell (BrandedSplash, OnboardingCarousel)
├── lib/             cn() (clsx + tailwind-merge for NativeWind)
├── theme/           ThemeProvider, useTheme — wires tokens from @barber/config
├── global.css       NativeWind base (re-exported)
└── nativewind-env.d.ts
```

## Wiring it into an app

Already done for every `apps-mobile/<app>`. The salon app is the canonical reference:

```tsx
// app/_layout.tsx
import '@kshuri/ui-native/global.css';
import { ThemeProvider } from '@kshuri/ui-native';
import { themes } from '@barber/config/design-tokens';

export default function RootLayout() {
  return (
    <ThemeProvider tokens={themes.salon}>
      <Slot />
    </ThemeProvider>
  );
}
```

Configure NativeWind to scan this package:

```ts
// apps-mobile/<app>/tailwind.config.ts
import preset from '@barber/config/tailwind-preset.native';

export default {
  presets: [preset],
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui-native/src/**/*.{ts,tsx}',
  ],
};
```

## Peer dependencies (RN-only)

| Peer | Min version |
|:---|:---|
| `react` | 18 |
| `react-native` | 0.76 |
| `react-native-reanimated` | 3 |
| `react-native-svg` | 15 |
| `nativewind` | 4 |
| `expo-haptics` | 13 |

Owns `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react-native` directly.

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint src/**/*.ts*
```

No build step — Metro transpiles the TypeScript source.

## When *not* to use this

- Web React components — use [`@kshuri/ui`](../ui/README.md).
- Tokens-only Tailwind consumers — pull the native preset from [`@barber/config`](../config/README.md).
