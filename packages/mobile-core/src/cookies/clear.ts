// ─────────────────────────────────────────────────────────────────────────────
// Cookie management — wraps @react-native-cookies/cookies so we can clear the
// httpOnly refresh-token cookie on logout. Importing this file is enough to
// activate the persistent cookie jar on Android (which otherwise only keeps
// cookies in memory). iOS already persists cookies via NSHTTPCookieStorage.
// ─────────────────────────────────────────────────────────────────────────────

import CookieManager from "@react-native-cookies/cookies";

/**
 * Clear ALL cookies — used on logout so the next user on the same device
 * doesn't inherit the previous session's refresh-token cookie.
 *
 * Best-effort: failure here (e.g. on web) is swallowed so logout always
 * completes the rest of its cleanup.
 */
export async function clearAuthCookies(): Promise<void> {
  try {
    await CookieManager.clearAll();
  } catch {
    // Non-fatal — local cleanup must still succeed.
  }
}

/**
 * Ask the platform whether a session cookie exists for the given host. Useful
 * for debugging cold-start refresh failures ("did the cookie survive?").
 */
export async function hasAuthCookieForHost(host: string): Promise<boolean> {
  try {
    const cookies = await CookieManager.get(host);
    return Object.keys(cookies).length > 0;
  } catch {
    return false;
  }
}

export { CookieManager };
