'use client';
// ─────────────────────────────────────────────────────────────────────────────
// NotificationPreferences — channel-level toggle form.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@kshuri/api-client';
import { Switch } from '../components/switch';
import { Label } from '../components/label';

const CHANNELS = [
  ['in_app_enabled', 'In-app notifications'],
  ['push_enabled',   'Push notifications (mobile)'],
  ['email_enabled',  'Email'],
  ['sms_enabled',    'SMS'],
] as const;

type PreferenceKey = typeof CHANNELS[number][0];

export function NotificationPreferences() {
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const toggle = (key: PreferenceKey) =>
    update.mutate({ [key]: !data[key] });

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <h2 className="text-xl font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how you want to be notified.
        </p>
      </div>

      <div className="space-y-3">
        {CHANNELS.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key}>{label}</Label>
            <Switch
              id={key}
              checked={!!data[key]}
              onCheckedChange={() => toggle(key)}
              disabled={update.isPending}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
