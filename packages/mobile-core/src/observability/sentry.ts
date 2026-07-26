// ─────────────────────────────────────────────────────────────────────────────
// Sentry initialization for React Native apps.
//
// Init is intentionally idempotent and silent in dev: it only ships events
// when EXPO_PUBLIC_SENTRY_DSN is set (so local development doesn't pollute
// the production project). Each app calls initSentry() exactly once, before
// the root component mounts (in app/_layout.tsx or via a side-effect import).
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

export interface InitSentryOptions {
  /** Audience identifier — added as a tag so we can filter issues per app. */
  audience: string;
  /** Override DSN. Defaults to process.env.EXPO_PUBLIC_SENTRY_DSN. */
  dsn?: string;
  /** Environment name (development/staging/production). Defaults to NODE_ENV. */
  environment?: string;
  /** Sample rate for tracing (0..1). Default 0.1 in production, 1 elsewhere. */
  tracesSampleRate?: number;
}

let initialized = false;

export function initSentry(options: InitSentryOptions): void {
  if (initialized) return;
  const dsn = options.dsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // No DSN configured — silently skip. Dev and demos never want to send
    // events without explicit opt-in.
    initialized = true;
    return;
  }
  const env =
    options.environment ?? process.env.EXPO_PUBLIC_APP_ENV ?? "development";
  const release = `${options.audience}@${Constants.expoConfig?.version ?? "0.0.0"}`;
  const tracesSampleRate =
    options.tracesSampleRate ?? (env === "production" ? 0.1 : 1);

  Sentry.init({
    dsn,
    environment: env,
    release,
    enableNative: true,
    tracesSampleRate,
    // Don't send breadcrumbs for routine app-state changes — too noisy.
    beforeBreadcrumb: (breadcrumb) =>
      breadcrumb.category === "ui.lifecycle" ? null : breadcrumb,
  });
  Sentry.setTag("audience", options.audience);
  initialized = true;
}

export { Sentry };
