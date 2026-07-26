'use client';
// ─────────────────────────────────────────────────────────────────────────────
// useDraftAutosave — localStorage-backed draft persistence for edit forms.
//
// While `enabled` is true, persists `draft` to localStorage under `storageKey`
// with a millisecond timestamp. On mount (once per key), if a fresh draft
// exists (newer than `ttlMs`), calls `onRestore` so the page can seed its
// form state. Returns a `clear` callback to drop the persisted draft (call
// after a successful save).
//
// Pair with `useEditMode` for the lifecycle and `<EditModeBar>` for the UI.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface PersistedEnvelope<T> {
  savedAt: number;
  draft: T;
}

export interface UseDraftAutosaveOptions<T> {
  /** Unique per-profile key, e.g. `kshuri:salon-portfolio-draft:${profileId}`. */
  storageKey: string;
  /** The current draft. Persisted whenever it changes while `enabled` is true. */
  draft: T;
  /** When false, no writes happen (typically `isEditing && isDirty`). */
  enabled: boolean;
  /** Invoked once on mount with the restored draft, if one exists & not expired. */
  onRestore?: (saved: T) => void;
  /** Max age (ms) before a persisted draft is considered stale. Default 24h. */
  ttlMs?: number;
}

export function useDraftAutosave<T>({
  storageKey,
  draft,
  enabled,
  onRestore,
  ttlMs = DEFAULT_TTL_MS,
}: UseDraftAutosaveOptions<T>): { clear: () => void } {
  // Restore once per (storageKey) on mount. Guarded by a ref so a re-render
  // can't replay the restore and clobber an in-progress edit.
  const restoredKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (restoredKeyRef.current === storageKey) return;
    restoredKeyRef.current = storageKey;
    if (typeof window === 'undefined' || !onRestore) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const env = JSON.parse(raw) as PersistedEnvelope<T>;
      if (!env || typeof env.savedAt !== 'number') return;
      if (Date.now() - env.savedAt > ttlMs) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      onRestore(env.draft);
    } catch {
      // best effort
    }
  }, [storageKey, ttlMs, onRestore]);

  // Persist on draft changes while enabled.
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    try {
      const env: PersistedEnvelope<T> = { savedAt: Date.now(), draft };
      window.localStorage.setItem(storageKey, JSON.stringify(env));
    } catch {
      // best effort (quota, disabled storage, …)
    }
  }, [storageKey, enabled, draft]);

  const clear = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // best effort
    }
  }, [storageKey]);

  return { clear };
}

export default useDraftAutosave;
