import * as Sentry from '@sentry/react';

export function setSentryUser(user: { id: string; role?: string } | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: user.id, role: user.role });
}
