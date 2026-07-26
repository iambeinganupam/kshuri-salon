import * as React from "react";
import { useFormState } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@kshuri/ui";

import { cn } from "../lib/cn";

export interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  /** Disable while the form is submitting. Default: true. */
  disableWhileSubmitting?: boolean;
  /** Disable while the form is invalid (after at least one validation pass). Default: false. */
  disableWhenInvalid?: boolean;
  /** Spinner element shown while submitting. Default: a Loader2 spinner. */
  pendingIcon?: React.ReactNode;
  /** Label shown while submitting. Defaults to children. */
  pendingLabel?: React.ReactNode;
}

export function SubmitButton({
  disableWhileSubmitting = true,
  disableWhenInvalid = false,
  pendingIcon,
  pendingLabel,
  disabled,
  children,
  className,
  ...buttonProps
}: SubmitButtonProps) {
  const { isSubmitting, isValid } = useFormState();
  const pending = isSubmitting;
  const isDisabled =
    disabled ||
    (disableWhileSubmitting && pending) ||
    (disableWhenInvalid && !isValid);

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      className={cn("gap-2", className)}
      {...buttonProps}
    >
      {pending ? (pendingIcon ?? <Loader2 className="h-4 w-4 animate-spin" />) : null}
      {pending && pendingLabel != null ? pendingLabel : children}
    </Button>
  );
}
