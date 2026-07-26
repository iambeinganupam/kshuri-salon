// ─────────────────────────────────────────────────────────────────────────────
// @kshuri/contracts — Zod schemas + types shared between backend (request
// validation) and the frontend api-client (response typing).
//
// Each migrated backend module gets its own subpath export
// (e.g. `@kshuri/contracts/addresses`). The main entry re-exports the
// whole set for convenience.
// ─────────────────────────────────────────────────────────────────────────────

export * as addresses     from './addresses';
export * as cms           from './cms';
export * as devices       from './devices';
export * as engagement    from './engagement';
export * as entitlements  from './entitlements';
export * as events        from './events';
export * as kyc           from './kyc';
export * as locations     from './locations';
export * as media         from './media';
export * as messaging     from './messaging';
export * as notifications from './notifications';
export * as payments      from './payments';
export * as plans         from './plans';
