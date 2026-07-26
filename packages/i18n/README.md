# `@kshuri/i18n`

i18next + react-i18next initialised with Kshuri's defaults, exposed as a typed
`Provider` + `useTranslation` pair.

## Status

**Scaffold half** of UX-hardening item #16. The infra is here; wrapping every
UI string in `t()` is a long-running adoption pass tracked separately.

## Why now?

> Even if you ship English-only at launch, wrap all user strings in a `t()`
> helper from day one. Retrofitting later is brutal.

— from the platform UX brief.

Retrofitting i18n means walking the entire React tree, finding every string
literal that's user-facing, picking a key, moving it into a JSON file,
double-checking pluralisation rules, and praying the tests caught it. Doing
it incrementally — one feature at a time — costs almost nothing.

## Usage

```ts
// app/i18n.ts
import { createI18n } from '@kshuri/i18n';
import enIN from './locales/en-IN.json';
import hi   from './locales/hi.json';

export const { Provider, useTranslation } = createI18n({
  defaultLocale: 'en-IN',
  resources: {
    'en-IN': { common: enIN },
    'hi':    { common: hi },
  },
});
```

```tsx
// app/App.tsx
import { Provider } from './i18n';

<Provider>...</Provider>
```

```tsx
// any component
import { useTranslation } from './i18n';

const { t } = useTranslation();
return <h1>{t('common:welcome')}</h1>;
```

## Defaults

- **Suspense disabled.** A missing key returns the key string, not a thrown
  promise. Errors at boundaries are reserved for genuine bugs.
- `interpolation.escapeValue: false` — React already escapes.
- `returnEmptyString: false` — missing translations fall back to the key,
  which is conspicuously wrong and easy to spot in dev.
- Default namespace: `common`.

## Adoption pattern

For each feature being touched:

1. Pull every user-facing string into a JSON file under that feature's
   namespace (`en-IN.json:checkout` etc).
2. Replace literals with `t('checkout:total_label')`.
3. Re-render the screen in dev — missing keys show up as the raw key
   (because of `returnEmptyString: false`), nothing crashes.
4. Add `hi.json:checkout` when the translator returns it. Until then, the
   fallback locale fills in.

No flag-day refactor. Strings move when their feature does.
