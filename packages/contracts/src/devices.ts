// ─────────────────────────────────────────────────────────────────────────────
// Devices — request schemas + inferred types
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

const AUDIENCE = z.enum(['salon', 'freelancer', 'customer', 'staff', 'events', 'admin']);
const PLATFORM = z.enum(['ios', 'android', 'web', 'macos', 'windows']);

export const registerDeviceSchema = z.object({
  expo_push_token: z.string().min(8, 'Expo push token is required'),
  audience: AUDIENCE,
  platform: PLATFORM,
  device_name: z.string().max(120).optional(),
  app_version: z.string().max(40).optional(),
});

export const unregisterDeviceSchema = z.object({
  expo_push_token: z.string().min(8),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type UnregisterDeviceInput = z.infer<typeof unregisterDeviceSchema>;
