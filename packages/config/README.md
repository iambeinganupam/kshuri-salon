# @barber/config

Shared platform configuration: Tailwind presets, TypeScript base config, and the **single-source-of-truth design tokens** powering every Kshuri app (web + mobile).

## Design tokens — production workflow

```
                  ┌────────────────────────────────┐
                  │  packages/config/              │
                  │    design-tokens.ts  ◄── EDIT  │
                  └────────────────┬───────────────┘
                                   │
                  npm run gen:themes  (codegen)
                                   │
                   ┌───────────────┼───────────────┐
                   ▼                                ▼
        themes/{audience}.css         (TS module consumed
        (committed; web @import)       directly by mobile via
                                       NativeWind preset)
```

### To change a token

```sh
# 1. Edit the canonical source
$EDITOR packages/config/design-tokens.ts

# 2. Regenerate the derived CSS files (committed for fast bundler imports)
npm run gen:themes

# 3. Commit both files together
git add packages/config/{design-tokens.ts,themes}
git commit -m "tokens(salon): bump primary hue"
```

The mobile salon app picks the change up automatically on the next build because its NativeWind preset reads `design-tokens.ts` directly. The web salon app picks it up because its `index.css` does `@import "@barber/config/themes/salon.css"`.

### Drift guard (CI)

CI runs:

```sh
npm run check:themes
```

This regenerates each audience CSS in memory and `git diff`s against the committed file. Non-zero exit on mismatch — devs cannot merge a `design-tokens.ts` change without also committing the regenerated CSS. Mirrors the Vercel/Linear/Polaris token pipeline.

### Layout

```
packages/config/
├── design-tokens.ts              ← canonical source (TS)
├── tailwind-preset.ts            ← web Tailwind preset (shadcn)
├── tailwind-preset.native.ts     ← mobile NativeWind preset
├── themes/                       ← generated CSS, committed
│   └── salon.css
├── scripts/
│   └── generate-themes.ts        ← codegen (run via npm scripts)
└── tsconfig.base.json
```

## Why not Style Dictionary?

`design-tokens.ts` is consumed only by TS/JS bundlers (Vite + Metro). Style Dictionary's main value is multi-language output (iOS Swift, Android XML, Flutter). For a TypeScript-only monorepo, a hand-rolled 80-line generator is lighter and gives us full type safety on the tokens themselves.
