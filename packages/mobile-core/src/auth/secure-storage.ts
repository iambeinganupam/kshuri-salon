import * as SecureStore from "expo-secure-store";
import type { AudienceKey } from "@kshuri/api-client/types";

/**
 * Audience-scoped secure storage for the mobile access token.
 *
 * Origin/master's auth design puts refresh tokens in an httpOnly cookie,
 * which stock React-Native axios does not persist. Mobile apps therefore
 * store the access token directly so a cold start can attempt to validate
 * an existing session before falling back to /login.
 *
 * Keys are namespaced as `kshuri.access.<audience>` so multiple Kshuri apps
 * on the same device do not collide in iOS Keychain / Android Keystore.
 */

const ACCESS_KEY_PREFIX = "kshuri.access." as const;

function accessKey(audience: AudienceKey): string {
  return `${ACCESS_KEY_PREFIX}${audience}`;
}

export async function getAccessToken(
  audience: AudienceKey,
): Promise<string | null> {
  return SecureStore.getItemAsync(accessKey(audience));
}

export async function setAccessToken(
  audience: AudienceKey,
  token: string,
): Promise<void> {
  await SecureStore.setItemAsync(accessKey(audience), token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function clearAccessToken(audience: AudienceKey): Promise<void> {
  await SecureStore.deleteItemAsync(accessKey(audience));
}
