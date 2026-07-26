# @kshuri/ui

Web-side shadcn/Radix component library shared across the six Vite SPAs and the Next.js portal. Also houses the domain components that span more than one app — KYC widgets, messaging thread, address book, notification bell.

The mobile counterpart is [`@kshuri/ui-native`](../ui-native/README.md). Design tokens live in [`@barber/config`](../config/README.md) — both libraries consume the same source of truth.

## What's inside

```
src/
├── components/        Full shadcn surface (Button, Card, Dialog, Sheet, Sidebar, …)
├── lib/               cn(), variants, utility hooks
├── addresses/         Address book widgets (AddressForm, AddressCard, MapPicker)
├── kyc/               KYC submission form + status pill
├── messaging/         Thread list, thread view, composer
├── notifications/     Notification bell, list, preferences sheet
└── index.ts           Barrel export
```

Every Radix primitive used by the apps lives here once. If you find yourself reinstalling `@radix-ui/react-dialog` in an app, add the missing component to this package instead.

## Build

This package is compiled with [`tsup`](https://tsup.egoist.dev). Outputs `dist/` (already gitignored). Consumers can import from `@kshuri/ui` regardless.

```bash
npm run build      # one-shot build
npm run dev        # watch mode (for active dev on the kit itself)
npm run lint       # eslint
```

## Consuming

```tsx
import { Button, Card, CardContent, Dialog } from '@kshuri/ui';
import { AddressForm } from '@kshuri/ui/addresses';   // sub-path also works
```

Tailwind classes are expected to compile in the host app's CSS pipeline — the package does not ship a pre-bundled stylesheet. Make sure the host's `tailwind.config.ts` extends the shared preset:

```ts
// kshuri-customer-dashboard/tailwind.config.ts
import preset from '@barber/config/tailwind-preset';
export default { presets: [preset], content: ['./src/**/*.{ts,tsx}', '../packages/ui/src/**/*.{ts,tsx}'] };
```

The `content` glob must include `packages/ui/src` so Tailwind picks up class names used inside this package.

## Notable dependencies

- Full `@radix-ui/*` primitive set (accordion, dialog, dropdown, popover, tabs, toast, tooltip, …)
- `class-variance-authority`, `clsx`, `tailwind-merge` (variant + class merging)
- `lucide-react` (icons)
- `recharts` (analytics charts)
- `framer-motion` (gesture/transition surface)
- `react-day-picker` (calendar)
- `react-leaflet` + `leaflet` (map pickers — addresses, vendor pin)
- `cmdk` (command palette), `vaul` (drawer), `sonner` (toaster), `input-otp`, `embla-carousel-react`
- `zod` (form schemas re-exported from domain widgets)

## Peer deps

| Peer | Why |
|:---|:---|
| `react` ^18, `react-dom` ^18 | Runtime |
| `@tanstack/react-query` ^5 | The domain widgets fetch their own data |
| `@kshuri/api-client` * | Domain widgets call the API directly |

## When *not* to use this

- React Native screens — use [`@kshuri/ui-native`](../ui-native/README.md).
- Tokens-only consumers (Tailwind preset, CSS variables) — pull from [`@barber/config`](../config/README.md) directly.
