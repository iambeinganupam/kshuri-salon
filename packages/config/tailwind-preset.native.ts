/**
 * NativeWind Tailwind preset — mobile twin of `tailwind-preset.ts`.
 *
 * Same color/font/radius/animation keys as the web preset so utility classes
 * (`bg-primary`, `text-foreground`, `rounded-lg`) resolve identically across
 * web and mobile. Differences from web preset:
 *
 *   • Animations limited to those Reanimated can express. CSS keyframes that
 *     rely on `box-shadow` / `border-color` interpolation are dropped here
 *     and re-implemented as Reanimated hooks in @kshuri/ui-native.
 *   • `container` is omitted — mobile layouts aren't viewport-centered.
 *   • Font family fallbacks use the RN-native font name (no system-ui chain).
 *
 * Consumers pass the audience theme in via the `theme` arg so the preset
 * stays single-source: one helper, six audience apps.
 */
import type { Config } from "tailwindcss";
import type { AudienceTheme } from "./design-tokens";

export interface NativePresetOptions {
  theme: AudienceTheme;
}

export function createNativePreset({
  theme,
}: NativePresetOptions): Partial<Config> {
  return {
    darkMode: "class",
    theme: {
      extend: {
        fontFamily: {
          sans: [theme.fontSans],
          serif: [theme.fontSerif],
        },
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          gold: {
            DEFAULT: "hsl(var(--gold))",
            foreground: "hsl(var(--gold-foreground))",
          },
          success: {
            DEFAULT: "hsl(var(--success))",
            foreground: "hsl(var(--success-foreground))",
          },
          info: {
            DEFAULT: "hsl(var(--info))",
            foreground: "hsl(var(--info-foreground))",
          },
          warning: {
            DEFAULT: "hsl(var(--warning))",
            foreground: "hsl(var(--warning-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
          sidebar: {
            DEFAULT: "hsl(var(--sidebar-background))",
            foreground: "hsl(var(--sidebar-foreground))",
            primary: "hsl(var(--sidebar-primary))",
            "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
            accent: "hsl(var(--sidebar-accent))",
            "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
            border: "hsl(var(--sidebar-border))",
            ring: "hsl(var(--sidebar-ring))",
          },
        },
        borderRadius: {
          lg: `${theme.radius}rem`,
          md: `${theme.radius - 0.125}rem`,
          sm: `${theme.radius - 0.25}rem`,
        },
      },
    },
  };
}
