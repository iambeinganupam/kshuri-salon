import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "../button";
import { cn } from "../../lib/utils";

export type DataStateVariant = "inline" | "block" | "full-page";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  variant?: DataStateVariant;
  className?: string;
}

const paddingByVariant: Record<DataStateVariant, string> = {
  inline: "py-6",
  block: "py-16",
  "full-page": "py-24",
};

const iconSizeByVariant: Record<DataStateVariant, string> = {
  inline: "h-12 w-12 [&>svg]:h-5 [&>svg]:w-5",
  block: "h-16 w-16 [&>svg]:h-7 [&>svg]:w-7",
  "full-page": "h-20 w-20 [&>svg]:h-9 [&>svg]:w-9",
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    { icon: Icon, title, description, action, variant = "block", className },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="region"
        aria-label={title}
        className={cn(
          "flex flex-col items-center justify-center px-4 text-center animate-in fade-in-50 duration-300",
          paddingByVariant[variant],
          className,
        )}
      >
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground/50",
            iconSizeByVariant[variant],
          )}
        >
          <Icon aria-hidden="true" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground/70">
            {description}
          </p>
        ) : null}
        {action ? (
          <Button
            type="button"
            onClick={action.onClick}
            className="mt-5"
            size="sm"
          >
            {action.label}
          </Button>
        ) : null}
      </div>
    );
  },
);
