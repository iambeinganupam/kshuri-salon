import { QueryClient } from "@tanstack/react-query";

/**
 * React Query client tuned for mobile:
 *   • Longer staleTime — mobile users open the app for short bursts; we
 *     don't want a refetch on every focus event.
 *   • Retry once on network failure — flaky 4G/5G is common.
 *   • Refetch on reconnect, not on focus — focus fires often in RN.
 */
export function createMobileQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 8000),
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
