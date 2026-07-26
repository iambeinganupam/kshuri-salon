import React, { forwardRef } from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "../lib/cn";
import { Text } from "./Text";

export const Card = forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...rest }, ref) => (
    <View
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-card",
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...rest }, ref) => (
    <View ref={ref} className={cn("p-4 pb-2", className)} {...rest} />
  ),
);
CardHeader.displayName = "CardHeader";

export interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}
export const CardTitle = ({ className, children }: CardTitleProps) => (
  <Text variant="h4" className={cn("text-card-foreground", className)}>
    {children}
  </Text>
);

export interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}
export const CardDescription = ({
  className,
  children,
}: CardDescriptionProps) => (
  <Text variant="muted" className={cn(className)}>
    {children}
  </Text>
);

export const CardContent = forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...rest }, ref) => (
    <View ref={ref} className={cn("p-4 pt-2", className)} {...rest} />
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<View, ViewProps & { className?: string }>(
  ({ className, ...rest }, ref) => (
    <View
      ref={ref}
      className={cn("flex-row items-center p-4 pt-0", className)}
      {...rest}
    />
  ),
);
CardFooter.displayName = "CardFooter";
