import * as React from "react";

import { EmptyState, type EmptyStateProps } from "./empty-state";
import { ErrorState } from "./error-state";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatsGridSkeleton,
} from "./skeletons";

export interface QueryLike<T> {
  isPending: boolean;
  isError: boolean;
  error?: Error | null;
  data: T | undefined;
  refetch?: () => unknown;
}

export interface DataStateProps<T> {
  query: QueryLike<T>;
  children: (data: T) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
  skeleton?: React.ReactNode;
  empty?: Omit<EmptyStateProps, "variant" | "className">;
  errorTitle?: string;
  onRetry?: () => void;
  variant?: "inline" | "block" | "full-page";
}

const defaultIsEmpty = <T,>(data: T): boolean =>
  Array.isArray(data) && data.length === 0;

function DefaultSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
    </div>
  );
}

export function DataState<T>({
  query,
  children,
  isEmpty,
  skeleton,
  empty,
  errorTitle,
  onRetry,
  variant = "block",
}: DataStateProps<T>) {
  if (query.isPending) {
    return <LoadingRegion>{skeleton ?? <DefaultSkeleton />}</LoadingRegion>;
  }

  if (query.isError) {
    const retry = onRetry ?? query.refetch;
    return (
      <ErrorState
        title={errorTitle}
        description={query.error?.message}
        onRetry={retry ? () => retry() : undefined}
        variant={variant}
      />
    );
  }

  if (query.data === undefined) {
    return <LoadingRegion>{skeleton ?? <DefaultSkeleton />}</LoadingRegion>;
  }

  const emptyCheck = isEmpty ?? defaultIsEmpty;
  if (empty && emptyCheck(query.data)) {
    return <EmptyState {...empty} variant={variant} />;
  }

  return <>{children(query.data)}</>;
}
