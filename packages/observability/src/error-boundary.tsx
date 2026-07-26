import * as Sentry from '@sentry/react';
import type { ReactElement, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactElement;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={fallback ?? <div style={{ padding: 24 }}>Something went wrong. Please refresh.</div>}
      showDialog={false}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
