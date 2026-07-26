import * as React from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Checkbox,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kshuri/ui";

import { cn } from "../lib/cn";

export interface CheckboxFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  itemClassName?: string;
}

export function CheckboxField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  name,
  label,
  description,
  disabled,
  itemClassName,
}: CheckboxFieldProps<TValues, TName>) {
  const { control } = useFormContext<TValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-start gap-3 space-y-0",
            itemClassName,
          )}
        >
          <FormControl>
            <Checkbox
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-0.5 leading-none">
            {label != null && <FormLabel className="cursor-pointer">{label}</FormLabel>}
            {description != null && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
