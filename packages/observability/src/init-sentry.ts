import * as Sentry from '@sentry/react';

/**
 * react-router v6 hooks needed to enable per-route Sentry transactions. Pass
 * them through from the consumer (where react-router-dom is already a dep)
 * so this package doesn't need to take react-router-dom as a peer.
 */
export interface ReactRouterV6Routing {
  useEffect: typeof import('react').useEffect;
  useLocation: () => unknown;
  useNavigationType: () => unknown;
  createRoutesFromChildren: (...args: unknown[]) => unknown;
  matchRoutes: (...args: unknown[]) => unknown;
}

export interface SentryInitOptions {
  dsn?: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  /**
   * Pass react-router v6 hooks (from 'react-router-dom') to enable per-route
   * Sentry transactions. Apps that don't pass these still get app-level
   * browser tracing via the default browserTracingIntegration().
   */
  reactRouterV6?: ReactRouterV6Routing;
}

export function initSentry(opts: SentryInitOptions): void {
  if (!opts.dsn) {
    // Dev: no DSN, no init. Safe no-op so the app still works locally.
    return;
  }

  const tracingIntegration = opts.reactRouterV6
    ? Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: opts.reactRouterV6.useEffect,
        // @sentry/react 7.x expects react-router hooks via these exact names;
        // we accept them as `unknown` at the contract boundary and trust the
        // consumer to pass the real ones.
        useLocation: opts.reactRouterV6.useLocation as never,
        useNavigationType: opts.reactRouterV6.useNavigationType as never,
        createRoutesFromChildren: opts.reactRouterV6.createRoutesFromChildren as never,
        matchRoutes: opts.reactRouterV6.matchRoutes as never,
      })
    : Sentry.browserTracingIntegration();

  Sentry.init({
    dsn: opts.dsn,
    environment: opts.environment,
    release: opts.release,
    tracesSampleRate: opts.tracesSampleRate ?? (opts.environment === 'production' ? 0.1 : 1.0),
    replaysSessionSampleRate: opts.replaysSessionSampleRate ?? 0.1,
    replaysOnErrorSampleRate: opts.replaysOnErrorSampleRate ?? 1.0,
    integrations: [
      tracingIntegration,
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    // Don't ship local-dev errors to the staging project
    enabled: opts.environment !== 'development',
  });
}

/**
 * Wraps react-router's `<Routes>` so each route navigation emits a Sentry
 * transaction with the matched route as the transaction name.
 *
 * Pair with `initSentry({ reactRouterV6 })` — both pieces are needed:
 *   1. initSentry wires the routing instrumentation to the tracing integration
 *   2. withSentryReactRouterV6Routing wraps <Routes> at the call site
 *
 * Usage:
 *   const SentryRoutes = withSentryReactRouterV6Routing(Routes);
 *   <SentryRoutes>...</SentryRoutes>
 */
export const withSentryReactRouterV6Routing = Sentry.withSentryReactRouterV6Routing;

export { Sentry };
