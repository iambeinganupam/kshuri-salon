# `@kshuri/contracts`

Single source of truth for **Zod schemas + inferred TypeScript types** shared
between the backend (request validation) and the frontend api-client
(compile-time response checking).

## Why

The backend's `<module>.schemas.ts` files own request validation today.
Frontend api-client hooks ship their own copies of those types, by hand.
They drift. A `?` slipped into a backend column rename takes a week to
surface as a runtime error in a dashboard.

This package fixes that: schemas live here, **both sides import them**.

## Layout

```
packages/contracts/
├── src/
│   ├── index.ts            # barrel re-export (use `@kshuri/contracts`)
│   ├── addresses.ts        # one file per backend module
│   └── …                   # add new modules here as they migrate
└── package.json
```

Each module file exports:
- The Zod schemas (`createXSchema`, `updateXSchema`, query/param schemas).
- The inferred input types (`type CreateXInput = z.infer<typeof createXSchema>`).
- The inferred output types where applicable.

## Migration pattern (per backend module)

1. Move the contents of `backend/src/modules/<name>/<name>.schemas.ts` into
   `packages/contracts/src/<name>.ts`.
2. Replace the backend file with a re-export shim:
   ```ts
   // backend/src/modules/<name>/<name>.schemas.ts
   export * from '@kshuri/contracts/<name>';
   ```
   (Existing imports in `<name>.controller.ts` / `<name>.service.ts`
   continue to work.)
3. Add `"@kshuri/contracts": "*"` to `backend/package.json` deps.
4. Run `backend` tests; confirm zero behavior change.
5. Update `packages/api-client/src/<name>.ts` to import inferred types
   from `@kshuri/contracts/<name>`.

## Migrated modules

- `addresses` — 2026-05-30
- `cms` — 2026-05-30
- `devices` — 2026-05-30
- `engagement` — 2026-05-30
- `entitlements` — 2026-05-30
- `events` — 2026-05-30
- `kyc` — 2026-05-30
- `locations` — 2026-05-30
- `media` — 2026-05-30
- `messaging` — 2026-05-30
- `notifications` — 2026-05-30
- `payments` — 2026-05-30
- `plans` — 2026-05-30

(See `MASTER_API_REQUIREMENTS.md` for the canonical list of modules.)
