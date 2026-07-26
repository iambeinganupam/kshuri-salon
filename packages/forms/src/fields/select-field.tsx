import * as React from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kshuri/ui";

import { cn } from "../lib/cn";

export interface SelectFieldOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

export interface SelectFieldProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  options: readonly SelectFieldOption[];
  disabled?: boolean;
  itemClassName?: string;
  triggerClassName?: string;
}

export function SelectField<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  name,
  label,
  description,
  placeholder,
  options,
  disabled,
  itemClassName,
  triggerClassName,
}: SelectFieldProps<TValues, TName>) {
  const { control } = useFormContext<TValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(itemClassName)}>
          {label != null && <FormLabel>{label}</FormLabel>}
          <Select
            disabled={disabled}
            value={field.value ?? ""}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger className={cn(triggerClassName)}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description != null && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
