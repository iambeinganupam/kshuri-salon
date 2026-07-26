import * as React from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
} from "@kshuri/ui";

import { cn } from "../lib/cn";

export interface TextareaFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "form"> {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  itemClassName?: string;
}

export function TextareaField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  name,
  label,
  description,
  itemClassName,
  className,
  ...textareaProps
}: TextareaFieldProps<TValues, TName>) {
  const { control } = useFormContext<TValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(itemClassName)}>
          {label != null && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea
              {...textareaProps}
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
