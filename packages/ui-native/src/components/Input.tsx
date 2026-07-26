import React, { forwardRef } from "react";
import {
  TextInput,
  type TextInputProps,
  Platform,
} from "react-native";
import { cn } from "../lib/cn";

export interface InputProps extends Omit<TextInputProps, "style"> {
  className?: string;
  invalid?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ className, invalid, ...rest }, ref) => (
    <TextInput
      ref={ref}
      placeholderTextColor="hsl(var(--muted-foreground))"
      className={cn(
        "h-11 rounded-md border border-input bg-background px-3 text-base text-foreground",
        Platform.OS === "android" && "py-2",
        invalid && "border-destructive",
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = "Input";
