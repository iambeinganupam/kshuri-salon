import React, { useEffect } from "react";
import { type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { cn } from "../lib/cn";

export interface SkeletonProps extends Omit<ViewProps, "style"> {
  className?: string;
}

/**
 * Animated placeholder. Matches the web `shimmer` keyframe by pulsing
 * opacity between 0.5 and 1.0 on a 1s loop — Reanimated approximation
 * since RN cannot interpolate background-position the way CSS can.
 */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={cn("rounded-md bg-muted", className)}
      style={animatedStyle}
      {...rest}
    />
  );
}
