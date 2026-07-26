import * as React from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@kshuri/ui";

import { cn } from "../lib/cn";

export interface TextFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "form"> {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  /** Wrapper className (applied to the FormItem). */
  itemClassName?: string;
}

/**
 * TextField — react-hook-form-bound input with a label, optional description,
 * and inline error message. Reads the controlling form from context, so it
 * only needs `name` + display props.
 */
export function TextField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  name,
  label,
  description,
  itemClassName,
  className,
  type = "text",
  ...inputProps
}: TextFieldProps<TValues, TName>) {
  const { control } = useFormContext<TValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(itemClassName)}>
          {label != null && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input
              type={type}
              {...inputProps}
              {...field}
              value={field.value ?? ""}
              className={cn(className)}
            />
          </FormControl>
          {description != null && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
