// ─────────────────────────────────────────────────────────────────────────────
// OTA update helpers — wraps expo-updates so the app can poll for new JS
// bundles on launch + foreground and apply them without requiring an
// app-store resubmission.
//
// Native changes (new permissions, new native modules) still require a
// full rebuild — see docs/MOBILE_DEPLOYMENT.md.
//
// Channel routing is configured in each app's app.json and per-env via the
// EXPO_PUBLIC_UPDATE_CHANNEL env var (production / staging / development).
// ─────────────────────────────────────────────────────────────────────────────

import * as Updates from "expo-updates";

export interface UpdateCheckResult {
  /** True when a new update was downloaded and is ready to apply on next reload. */
  newAvailable: boolean;
  /** Set when the update channel knows about a new update we haven't downloaded. */
  newDetected: boolean;
}

/**
 * Check the update channel for a newer JS bundle. If found, download it.
 * Returns immediately on dev builds (where updates are disabled) or when the
 * platform reports no network — safe to call on every cold start.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!Updates.isEnabled) {
    return { newAvailable: false, newDetected: false };
  }
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      return { newAvailable: false, newDetected: false };
    }
    const fetched = await Updates.fetchUpdateAsync();
    return { newAvailable: fetched.isNew, newDetected: true };
  } catch {
    // Network outage, expired channel token, etc. — non-fatal.
    return { newAvailable: false, newDetected: false };
  }
}

/**
 * Apply a downloaded update by reloading the JS bundle. Call this when the
 * user is at a safe moment to take a reload (e.g. on app foreground with no
 * pending writes, or after a manual prompt).
 */
export async function applyUpdate(): Promise<void> {
  if (!Updates.isEnabled) return;
  await Updates.reloadAsync();
}

/**
 * Returns the runtime identifier (build id) and the loaded update's id, so
 * Sentry events / dashboards can show exactly which JS bundle is running.
 */
export function getRuntimeInfo(): {
  runtimeVersion: string | null;
  updateId: string | null;
  channel: string | null;
} {
  return {
    runtimeVersion: Updates.runtimeVersion ?? null,
    updateId: Updates.updateId ?? null,
    channel: Updates.channel ?? null,
  };
}
