import * as React from "react";
import { Form as ShadForm } from "@kshuri/ui";
import type { FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form";

import { cn } from "./lib/cn";

export interface FormProps<TValues extends FieldValues>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  form: UseFormReturn<TValues>;
  onSubmit: SubmitHandler<TValues>;
  children: React.ReactNode;
}

/**
 * Form — typed shadcn `<Form>` (FormProvider) + a `<form>` element wired to
 * `handleSubmit`. Use with `useZodForm` for end-to-end typed validation.
 */
export function Form<TValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  noValidate = true,
  ...props
}: FormProps<TValues>) {
  return (
    <ShadForm {...form}>
      <form
        noValidate={noValidate}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
        {...props}
      >
        {children}
      </form>
    </ShadForm>
  );
}
