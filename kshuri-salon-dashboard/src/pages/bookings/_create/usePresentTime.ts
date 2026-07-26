// ─────────────────────────────────────────────────────────────────────────────
// usePresentTime — small subscription hook that returns a `Date.now()`
// timestamp and re-renders consumers on a fixed cadence.
//
// Used by Step3Schedule so the slot grid (and any derived state) reflects
// the wall clock without relying on incidental re-renders. Two refresh
// triggers:
//
//   1. Polling timer  — fires every `intervalMs` (default 30s, fine-grained
//      enough to disable a slot soon after it goes past, coarse enough not
//      to thrash React reconciliation).
//   2. Window focus   — backgrounded tabs throttle / suspend timers, so we
//      force a refresh when the tab regains focus to avoid a frozen clock.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

const DEFAULT_TICK_MS = 30_000;

export function usePresentTime(intervalMs: number = DEFAULT_TICK_MS): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    const onFocus = () => setNow(Date.now());
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);

  return now;
}
