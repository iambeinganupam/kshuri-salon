import React from "react";
import { Text } from "./Text";
import { cn } from "../lib/cn";

export interface LabelProps {
  className?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Label({ className, required, children }: LabelProps) {
  return (
    <Text variant="label" className={cn("mb-1.5", className)}>
      {children}
      {required ? <Text className="text-destructive"> *</Text> : null}
    </Text>
  );
}
