// ─────────────────────────────────────────────────────────────────────────────
// Onboarding-seen persistence.
//
// One boolean per audience scoped under `kshuri.onboarding.<audience>`. The
// flag flips to true the first time the user finishes (or skips) the intro.
// Reset paths:
//   - Manual: clear app data from Settings
//   - Programmatic: clearOnboardingSeen(audience) — useful for end-to-end
//     tests that want to assert the onboarding flow renders.
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AudienceKey } from "@kshuri/api-client/types";

const ONBOARDING_KEY_PREFIX = "kshuri.onboarding." as const;

function key(audience: AudienceKey): string {
  return `${ONBOARDING_KEY_PREFIX}${audience}`;
}

export async function hasSeenOnboarding(
  audience: AudienceKey,
): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(key(audience));
    return v === "true";
  } catch {
    // Treat read failures as "not seen" so users still get the intro
    // rather than being silently bounced to login.
    return false;
  }
}

export async function markOnboardingSeen(audience: AudienceKey): Promise<void> {
  await AsyncStorage.setItem(key(audience), "true");
}

export async function clearOnboardingSeen(
  audience: AudienceKey,
): Promise<void> {
  await AsyncStorage.removeItem(key(audience));
}

/**
 * React hook variant — returns `null` while loading, then `true | false`.
 * Use to gate the root index.tsx redirect on first-render without flashing
 * the wrong route.
 */
import { useEffect, useState } from "react";

export function useHasSeenOnboarding(
  audience: AudienceKey,
): boolean | null {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    hasSeenOnboarding(audience).then((seen) => {
      if (!cancelled) setState(seen);
    });
    return () => {
      cancelled = true;
    };
  }, [audience]);
  return state;
}
