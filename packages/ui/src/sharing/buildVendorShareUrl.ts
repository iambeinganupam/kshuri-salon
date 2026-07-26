// ─────────────────────────────────────────────────────────────────────────────
// buildVendorShareUrl — canonical shareable URL for a vendor's public profile.
//
// The customer portal (Next.js 16) serves vendor profiles at:
//
//   ${portalOrigin}/vendors/{url_slug}
//
// where `url_slug` is the human-readable slug column on `freelancer_profiles`
// or `salon_locations`. This helper is the single source of truth for that
// shape so dashboards, the portal itself, and any future "copy link" affordance
// all generate identical URLs.
//
// Base-URL resolution (highest priority wins):
//   1. Explicit `baseUrl` argument
//   2. Vite-style `import.meta.env.VITE_CUSTOMER_PORTAL_URL` (Vite dashboards)
//   3. `window.location.origin` (works perfectly when invoked from the portal
//      itself — the origin IS the portal)
//   4. Empty string (caller can detect and surface "Public link unavailable")
//
// Slug-less vendors (legacy data with `url_slug = NULL`) return `null` — the
// caller is expected to disable the share affordance rather than emit a broken
// link.
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildVendorShareUrlInput {
  /** Public slug from `freelancer_profiles.url_slug` or
   *  `salon_locations.url_slug`. */
  slug: string | null | undefined;
  /** Override the resolved portal origin. */
  baseUrl?: string;
}

export function resolvePortalBaseUrl(explicit?: string): string {
  if (explicit && explicit.trim()) return explicit.replace(/\/+$/, '');
  // Vite — `import.meta.env` is defined in Vite-built bundles only.
  try {
    const viteEnv =
      typeof import.meta !== 'undefined'
        ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
        : undefined;
    const fromVite = viteEnv?.VITE_CUSTOMER_PORTAL_URL;
    if (fromVite && fromVite.trim()) return fromVite.replace(/\/+$/, '');
  } catch {
    // Some bundlers throw on `import.meta` access — fall through.
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
}

export function buildVendorShareUrl({
  slug,
  baseUrl,
}: BuildVendorShareUrlInput): string | null {
  const trimmedSlug = slug?.trim();
  if (!trimmedSlug) return null;
  const root = resolvePortalBaseUrl(baseUrl);
  if (!root) return null;
  return `${root}/vendors/${encodeURIComponent(trimmedSlug)}`;
}
