import React, { createContext, useContext, useMemo } from "react";
import { vars } from "nativewind";
import { View, type ViewProps } from "react-native";
import {
  type AudienceTheme,
  type ColorScale,
  scaleToCssVars,
} from "@barber/config/design-tokens";

type ColorMode = "light" | "dark";

interface ThemeContextValue {
  theme: AudienceTheme;
  mode: ColorMode;
  scale: ColorScale;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps extends ViewProps {
  theme: AudienceTheme;
  mode?: ColorMode;
  children: React.ReactNode;
}

/**
 * Injects design-token CSS variables into the React Native subtree via
 * NativeWind's `vars()` API. Every component below this provider can use
 * Tailwind utilities like `bg-primary`, `text-foreground`, etc., and they
 * will resolve to the audience-specific HSL values from `design-tokens.ts`.
 *
 * Place this at the root of every mobile app, once.
 */
export function ThemeProvider({
  theme,
  mode = "light",
  children,
  style,
  ...rest
}: ThemeProviderProps) {
  const scale = mode === "dark" ? theme.dark : theme.light;
  const cssVars = useMemo(() => vars(scaleToCssVars(scale)), [scale]);
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, scale }),
    [theme, mode, scale],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, cssVars, style]} {...rest}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      "useTheme must be used inside <ThemeProvider> from @kshuri/ui-native",
    );
  }
  return ctx;
}
