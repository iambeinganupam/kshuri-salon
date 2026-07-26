import React, { forwardRef } from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Typography primitive. Variants mirror common web heading + body roles so
 * salon-mobile reads `<Text variant="h1">` exactly like salon-web's `<h1>`.
 *
 * Headings use the audience's `fontSerif` (e.g. DM Serif Display); body and
 * label variants use `fontSans` (Plus Jakarta Sans for salon, Inter elsewhere).
 */
const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      h1: "font-serif text-4xl leading-tight",
      h2: "font-serif text-3xl leading-tight",
      h3: "font-serif text-2xl leading-snug",
      h4: "font-serif text-xl leading-snug",
      h5: "font-serif text-lg leading-snug",
      body: "font-sans text-base leading-normal",
      "body-sm": "font-sans text-sm leading-normal",
      label: "font-sans text-sm font-medium",
      muted: "font-sans text-sm text-muted-foreground",
      caption: "font-sans text-xs text-muted-foreground",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: { variant: "body" },
});

export interface TextProps
  extends Omit<RNTextProps, "style">,
    VariantProps<typeof textVariants> {
  className?: string;
}

export const Text = forwardRef<RNText, TextProps>(
  ({ className, variant, weight, ...rest }, ref) => (
    <RNText
      ref={ref}
      className={cn(textVariants({ variant, weight }), className)}
      {...rest}
    />
  ),
);
Text.displayName = "Text";
