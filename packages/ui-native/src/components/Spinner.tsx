import React from "react";
import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";

export interface SpinnerProps extends Omit<ActivityIndicatorProps, "color"> {
  /** Token name to use for color. Defaults to "primary". */
  tone?: "primary" | "foreground" | "muted";
}

const toneToCssVar: Record<NonNullable<SpinnerProps["tone"]>, string> = {
  primary: "hsl(var(--primary))",
  foreground: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
};

export function Spinner({ tone = "primary", ...rest }: SpinnerProps) {
  return <ActivityIndicator color={toneToCssVar[tone]} {...rest} />;
}
