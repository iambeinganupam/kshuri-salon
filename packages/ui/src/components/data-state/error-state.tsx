import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "../button";
import { cn } from "../../lib/utils";

import type { DataStateVariant } from "./empty-state";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: DataStateVariant;
  className?: string;
}

const paddingByVariant: Record<DataStateVariant, string> = {
  inline: "py-6",
  block: "py-16",
  "full-page": "py-24",
};

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  function ErrorState(
    {
      title = "Something went wrong",
      description,
      onRetry,
      retryLabel = "Try again",
      variant = "block",
      className,
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center px-4 text-center animate-in fade-in-50 duration-300",
          paddingByVariant[variant],
          className,
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mb-1 text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="max-w-sm text-xs text-muted-foreground/80">
            {description}
          </p>
        ) : null}
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    );
  },
);
