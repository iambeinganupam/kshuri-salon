import React from "react";
import { View, Image, type ImageSourcePropType } from "react-native";
import { Text } from "./Text";
import { cn } from "../lib/cn";

export interface AvatarProps {
  source?: ImageSourcePropType;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { box: "h-8 w-8", text: "text-xs" },
  md: { box: "h-10 w-10", text: "text-sm" },
  lg: { box: "h-14 w-14", text: "text-base" },
} as const;

export function Avatar({ source, fallback, size = "md", className }: AvatarProps) {
  const s = sizes[size];
  const initials = fallback
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View
      className={cn(
        "items-center justify-center overflow-hidden rounded-full bg-muted",
        s.box,
        className,
      )}
    >
      {source ? (
        <Image source={source} className="h-full w-full" />
      ) : (
        <Text weight="semibold" className={cn("text-foreground", s.text)}>
          {initials}
        </Text>
      )}
    </View>
  );
}
