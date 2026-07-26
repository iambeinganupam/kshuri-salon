import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

/**
 * AsyncStorage-backed persister for React Query. Dashboards load instantly
 * from cache on cold start; a background refetch pulls fresh data shortly
 * after the UI is interactive.
 *
 * `maxAge` matches our default queries' `staleTime * cache lifetime` rough
 * budget — older snapshots are evicted so users on shared devices don't see
 * weeks-old data.
 */
export function createMobilePersister() {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: "kshuri.react-query-cache",
    throttleTime: 1000,
  });
}

export const PERSISTER_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
