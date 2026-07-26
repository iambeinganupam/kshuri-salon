// ─────────────────────────────────────────────────────────────────────────────
// Push token sync — registers / unregisters the device with the backend so
// the server can target this user with push notifications. Called by the
// AuthProvider on login + logout. Best-effort: failure here never blocks the
// auth flow.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from "axios";
import Constants from "expo-constants";
import { devicesService } from "@kshuri/api-client/services";
import type { AudienceKey } from "@kshuri/api-client/types";
import { registerForPush } from "./registerForPush";

const TOKEN_KEY = "kshuri.push.token";
const tokenCache = new Map<string, string>(); // audience → last-synced token

export async function syncPushTokenOnLogin(
  apiClient: AxiosInstance,
  audience: AudienceKey,
): Promise<void> {
  try {
    const reg = await registerForPush();
    if (!reg) return; // simulator / denied permission — silently no-op
    const appVersion =
      Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version;
    await devicesService.registerDevice(apiClient, {
      expo_push_token: reg.expoPushToken,
      audience,
      platform: reg.platform,
      device_name: reg.deviceName,
      app_version: typeof appVersion === "string" ? appVersion : undefined,
    });
    tokenCache.set(`${TOKEN_KEY}.${audience}`, reg.expoPushToken);
  } catch {
    // Push registration is non-critical — the app still works without push.
  }
}

export async function syncPushTokenOnLogout(
  apiClient: AxiosInstance,
  audience: AudienceKey,
): Promise<void> {
  const cached = tokenCache.get(`${TOKEN_KEY}.${audience}`);
  if (!cached) return;
  try {
    await devicesService.unregisterDevice(apiClient, cached);
  } catch {
    // Best-effort — server's stale-token cleanup will eventually catch it.
  } finally {
    tokenCache.delete(`${TOKEN_KEY}.${audience}`);
  }
}
