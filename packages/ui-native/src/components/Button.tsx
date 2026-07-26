import React, { forwardRef } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type GestureResponderEvent,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import * as Haptics from "expo-haptics";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-md active:opacity-80",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        outline: "border border-input bg-background",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
        icon: "h-11 w-11",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

const buttonTextVariants = cva("text-sm font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      destructive: "text-destructive-foreground",
      outline: "text-foreground",
      secondary: "text-secondary-foreground",
      ghost: "text-foreground",
      link: "text-primary underline",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-base",
      icon: "text-sm",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps
  extends Omit<PressableProps, "children" | "style">,
    VariantProps<typeof buttonVariants> {
  className?: string;
  textClassName?: string;
  loading?: boolean;
  /** Override haptic on press. Defaults to Light impact. Pass `null` to disable. */
  haptic?: Haptics.ImpactFeedbackStyle | null;
  children: React.ReactNode;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      className,
      textClassName,
      variant,
      size,
      fullWidth,
      loading,
      disabled,
      haptic = Haptics.ImpactFeedbackStyle.Light,
      onPress,
      children,
      ...rest
    },
    ref,
  ) => {
    const handlePress = (event: GestureResponderEvent) => {
      if (haptic !== null) {
        Haptics.impactAsync(haptic).catch(() => {
          /* haptics unavailable — fail silently */
        });
      }
      onPress?.(event);
    };

    const isDisabled = disabled || loading;

    return (
      <Pressable
        ref={ref}
        disabled={isDisabled}
        onPress={handlePress}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          isDisabled && "opacity-50",
          className,
        )}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            className={cn(buttonTextVariants({ variant, size }))}
          />
        ) : typeof children === "string" ? (
          <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);
Button.displayName = "Button";
