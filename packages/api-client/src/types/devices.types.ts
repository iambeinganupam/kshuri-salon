// ─────────────────────────────────────────────────────────────────────────────
// Devices Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AudienceKey } from '../client/types';

export type DevicePlatform = 'ios' | 'android' | 'web' | 'macos' | 'windows';

/** Payload for POST /devices/register */
export interface RegisterDevicePayload {
  expo_push_token: string;
  audience: AudienceKey;
  platform: DevicePlatform;
  device_name?: string;
  app_version?: string;
}

/** Response from POST /devices/register */
export interface DeviceRegistration {
  id: string;
  audience: AudienceKey;
  platform: DevicePlatform;
  registered_at: string;
}
