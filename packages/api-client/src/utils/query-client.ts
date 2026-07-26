import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

/**
 * Canonical QueryClient defaults for Kshuri dashboards.
 *
 * - `staleTime: 60s` — most resources tolerate one-minute staleness;
 *   per-hook overrides bump this where appropriate (e.g. catalog → 5min,
 *   categories → 10min, profile → 5min in useAuth.ts).
 * - `retry: 1` — single retry for transient network blips; auth failures
 *   already disable retry per-hook.
 * - `refetchOnWindowFocus: false` — focus refetches were producing surprise
 *   re-renders mid-edit. Routes that depend on freshness use
 *   `useQuery(..., { refetchOnWindowFocus: true })` explicitly.
 * - `gcTime: 5min` — keep query caches around for back-nav.
 */
const KSHURI_DEFAULTS: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: 0,
  },
};

/**
 * Build a QueryClient with the Kshuri defaults applied. Pass `overrides` to
 * tweak any field per app or per environment (e.g. set retry=0 in tests).
 *
 *   const queryClient = createQueryClient();
 *   <QueryClientProvider client={queryClient}>...</QueryClientProvider>
 *
 * Per-query overrides (e.g. catalog → 5min staleTime) belong in the
 * `useQuery` call inside the api-client hook, not here.
 */
export function createQueryClient(overrides?: DefaultOptions): QueryClient {
  const merged: DefaultOptions = {
    queries: { ...KSHURI_DEFAULTS.queries, ...overrides?.queries },
    mutations: { ...KSHURI_DEFAULTS.mutations, ...overrides?.mutations },
  };
  return new QueryClient({ defaultOptions: merged });
}
