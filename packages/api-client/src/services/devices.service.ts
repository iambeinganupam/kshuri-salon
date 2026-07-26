// ─────────────────────────────────────────────────────────────────────────────
// Devices Service — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from 'axios';
import type {
  DeviceRegistration,
  RegisterDevicePayload,
} from '../types/devices.types';

export async function registerDevice(
  client: AxiosInstance,
  payload: RegisterDevicePayload,
): Promise<DeviceRegistration> {
  const { data } = await client.post<{ success: true; data: DeviceRegistration }>(
    '/devices/register',
    payload,
  );
  return data.data;
}

export async function unregisterDevice(
  client: AxiosInstance,
  expoPushToken: string,
): Promise<void> {
  await client.delete('/devices/register', {
    data: { expo_push_token: expoPushToken },
  });
}
