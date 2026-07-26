import * as React from "react";
import {
  ErrorBoundary as ReactErrorBoundary,
  type FallbackProps,
} from "react-error-boundary";

import { ErrorState } from "../data-state/error-state";

export interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  /** Called when the boundary catches. Wire to Sentry.captureException. */
  onError?: (error: Error, info: { componentStack?: string | null }) => void;
  /** Called when the user clicks retry. Default: clears the error and re-mounts. */
  onReset?: () => void;
  /** Reset whenever any value in this array changes (typical: [pathname]). */
  resetKeys?: readonly unknown[];
  /** Title shown on the fallback. Default: "This page hit a snag". */
  fallbackTitle?: string;
  /** Custom fallback. When provided, overrides the default ErrorState UI. */
  fallback?: React.ComponentType<FallbackProps>;
  /** Layout variant for the default ErrorState fallback. */
  variant?: "inline" | "block" | "full-page";
}

function DefaultFallback({
  error,
  resetErrorBoundary,
  title,
  variant,
}: FallbackProps & { title: string; variant: "inline" | "block" | "full-page" }) {
  const description = error instanceof Error ? error.message : String(error ?? "");
  return (
    <ErrorState
      title={title}
      description={description}
      onRetry={resetErrorBoundary}
      variant={variant}
    />
  );
}

/**
 * RouteErrorBoundary — wrap each top-level route element so a crash on one
 * route keeps the rest of the app (layout, sidebar, header) responsive.
 *
 * Pairs with the existing app-level Sentry boundary (e.g. from
 * @kshuri/observability): caught errors are reported through `onError`,
 * the user sees the designed ErrorState fallback with a retry button.
 *
 * Typical wiring inside a `<Routes>`:
 *
 *   <Route
 *     path="/vendors"
 *     element={
 *       <RouteErrorBoundary onError={Sentry.captureException} resetKeys={[pathname]}>
 *         <VendorsPage />
 *       </RouteErrorBoundary>
 *     }
 *   />
 */
export function RouteErrorBoundary({
  children,
  onError,
  onReset,
  resetKeys,
  fallbackTitle = "This page hit a snag",
  fallback,
  variant = "block",
}: RouteErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={
        fallback ??
        ((props) => (
          <DefaultFallback {...props} title={fallbackTitle} variant={variant} />
        ))
      }
      onError={(error, info) => {
        const normalized = error instanceof Error ? error : new Error(String(error));
        const stack =
          info && typeof info === "object" && "componentStack" in info
            ? ((info as { componentStack?: string | null }).componentStack ?? null)
            : null;
        onError?.(normalized, { componentStack: stack });
      }}
      onReset={onReset}
      resetKeys={resetKeys ? [...resetKeys] : undefined}
    >
      {children}
    </ReactErrorBoundary>
  );
}
