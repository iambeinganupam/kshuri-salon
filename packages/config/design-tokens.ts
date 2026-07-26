/**
 * Shared design tokens — single source of truth for color, typography, radius,
 * and shadow values across all Kshuri apps (web + mobile).
 *
 * Each audience (salon, freelancer, customer, staff, events, admin) has its
 * own brand palette. Within an audience, light + dark variants are defined.
 *
 * Values are HSL triplets as strings ("H S% L%") so they plug directly into
 * `hsl(var(--token))` on web and into NativeWind's CSS-variable system on
 * mobile. Numeric helpers expose RGB-hex for cases that can't read CSS vars
 * (React Native StatusBar, native splash, etc.).
 */

// ─── Type shape ──────────────────────────────────────────────────────────────

export type HslTriplet = string; // e.g. "348 83% 42%"

export interface ColorScale {
  background: HslTriplet;
  foreground: HslTriplet;
  card: HslTriplet;
  cardForeground: HslTriplet;
  popover: HslTriplet;
  popoverForeground: HslTriplet;
  primary: HslTriplet;
  primaryForeground: HslTriplet;
  secondary: HslTriplet;
  secondaryForeground: HslTriplet;
  muted: HslTriplet;
  mutedForeground: HslTriplet;
  accent: HslTriplet;
  accentForeground: HslTriplet;
  destructive: HslTriplet;
  destructiveForeground: HslTriplet;
  border: HslTriplet;
  input: HslTriplet;
  ring: HslTriplet;
  gold: HslTriplet;
  goldForeground: HslTriplet;
  success: HslTriplet;
  successForeground: HslTriplet;
  /** Optional — not every audience defines an info accent. */
  info?: HslTriplet;
  /** Optional — not every audience defines an info accent. */
  infoForeground?: HslTriplet;
  /** Optional — not every audience defines a warning accent. */
  warning?: HslTriplet;
  /** Optional — not every audience defines a warning accent. */
  warningForeground?: HslTriplet;
  sidebar: {
    background: HslTriplet;
    foreground: HslTriplet;
    primary: HslTriplet;
    primaryForeground: HslTriplet;
    accent: HslTriplet;
    accentForeground: HslTriplet;
    border: HslTriplet;
    ring: HslTriplet;
  };
}

export interface AudienceTheme {
  /** Audience this theme belongs to. */
  audience: string;
  /** Primary body font (system fallbacks added at preset level). */
  fontSans: string;
  /** Display/heading font. */
  fontSerif: string;
  /** Border radius scale (rem). */
  radius: number;
  light: ColorScale;
  dark: ColorScale;
}

// ─── Audience: SALON ─────────────────────────────────────────────────────────
// Mirrors kshuri-salon-dashboard/src/index.css verbatim. Any divergence here
// means the mobile salon app would drift from the web salon app.

const salonLight: ColorScale = {
  background: "30 15% 97%",
  foreground: "20 25% 10%",
  card: "0 0% 100%",
  cardForeground: "20 25% 10%",
  popover: "0 0% 100%",
  popoverForeground: "20 25% 10%",
  primary: "348 83% 42%",
  primaryForeground: "0 0% 100%",
  secondary: "30 20% 94%",
  secondaryForeground: "20 20% 22%",
  muted: "30 12% 93%",
  mutedForeground: "20 8% 46%",
  accent: "36 100% 50%",
  accentForeground: "20 25% 10%",
  destructive: "0 72% 51%",
  destructiveForeground: "0 0% 100%",
  border: "30 12% 89%",
  input: "30 12% 86%",
  ring: "348 83% 42%",
  gold: "36 100% 50%",
  goldForeground: "20 25% 10%",
  success: "152 69% 36%",
  successForeground: "0 0% 100%",
  info: "215 70% 55%",
  infoForeground: "0 0% 100%",
  warning: "36 90% 50%",
  warningForeground: "20 25% 10%",
  sidebar: {
    background: "20 18% 99%",
    foreground: "20 20% 22%",
    primary: "348 83% 42%",
    primaryForeground: "0 0% 100%",
    accent: "30 18% 95%",
    accentForeground: "20 25% 12%",
    border: "30 12% 91%",
    ring: "348 83% 42%",
  },
};

const salonDark: ColorScale = {
  background: "222 22% 6%",
  foreground: "210 15% 92%",
  card: "222 18% 9%",
  cardForeground: "210 15% 92%",
  popover: "222 18% 9%",
  popoverForeground: "210 15% 92%",
  primary: "348 75% 55%",
  primaryForeground: "0 0% 100%",
  secondary: "222 14% 14%",
  secondaryForeground: "210 12% 78%",
  muted: "222 12% 12%",
  mutedForeground: "215 10% 48%",
  accent: "36 90% 50%",
  accentForeground: "20 25% 10%",
  destructive: "0 62% 45%",
  destructiveForeground: "0 0% 100%",
  border: "222 14% 15%",
  input: "222 14% 17%",
  ring: "348 75% 55%",
  gold: "36 90% 50%",
  goldForeground: "20 25% 10%",
  success: "152 60% 42%",
  successForeground: "0 0% 100%",
  info: "215 65% 58%",
  infoForeground: "0 0% 100%",
  warning: "36 85% 52%",
  warningForeground: "20 25% 10%",
  sidebar: {
    background: "222 22% 7%",
    foreground: "210 12% 82%",
    primary: "348 75% 55%",
    primaryForeground: "0 0% 100%",
    accent: "222 16% 12%",
    accentForeground: "210 12% 82%",
    border: "222 14% 13%",
    ring: "348 75% 55%",
  },
};

export const salonTheme: AudienceTheme = {
  audience: "salon",
  fontSans: "Plus Jakarta Sans",
  fontSerif: "DM Serif Display",
  radius: 0.75,
  light: salonLight,
  dark: salonDark,
};

// ─── Audience: FREELANCER, CUSTOMER, EVENTS ──────────────────────────────────
// All three web dashboards intentionally share the salon brand system
// (kshuri-{salon,freelancer,customer,events}-dashboard/src/index.css are
// token-identical). We model the relationship explicitly with aliases so a
// brand-wide tweak edits one definition; future divergence would replace
// the alias with its own block.

export const freelancerTheme: AudienceTheme = {
  ...salonTheme,
  audience: "freelancer",
};

export const customerTheme: AudienceTheme = {
  ...salonTheme,
  audience: "customer",
};

export const eventsTheme: AudienceTheme = {
  ...salonTheme,
  audience: "events",
};

// ─── Audience: STAFF ─────────────────────────────────────────────────────────
// Distinct identity: dark-only, red primary, gold accent. Uses Inter (not
// Plus Jakarta Sans). We mirror the values into both light and dark slots
// since the staff dashboard never toggles to a light mode — apps boot with
// `mode="dark"`.

const staffDark: ColorScale = {
  background: "240 6% 7%",
  foreground: "30 10% 92%",
  card: "240 5% 10%",
  cardForeground: "30 10% 92%",
  popover: "240 5% 10%",
  popoverForeground: "30 10% 92%",
  primary: "0 55% 42%",
  primaryForeground: "30 20% 96%",
  secondary: "240 4% 15%",
  secondaryForeground: "30 10% 80%",
  muted: "240 4% 15%",
  mutedForeground: "30 8% 50%",
  accent: "40 55% 60%",
  accentForeground: "240 6% 7%",
  destructive: "0 62% 50%",
  destructiveForeground: "0 0% 100%",
  border: "240 4% 16%",
  input: "240 4% 16%",
  ring: "40 55% 60%",
  gold: "40 55% 60%",
  goldForeground: "240 6% 7%",
  success: "152 60% 42%",
  successForeground: "0 0% 100%",
  sidebar: {
    background: "240 6% 8%",
    foreground: "30 10% 80%",
    primary: "0 55% 42%",
    primaryForeground: "30 20% 96%",
    accent: "240 4% 14%",
    accentForeground: "30 10% 80%",
    border: "240 4% 14%",
    ring: "40 55% 60%",
  },
};

export const staffTheme: AudienceTheme = {
  audience: "staff",
  fontSans: "Inter",
  fontSerif: "DM Serif Display",
  radius: 0.75,
  light: staffDark, // staff has no light mode; mirror dark for type completeness
  dark: staffDark,
};

// ─── Audience: ADMIN ─────────────────────────────────────────────────────────
// Distinct identity: deep maroon primary in light mode, brand inverts to
// gold-primary in dark mode. Uses Playfair Display (serif) + Inter (sans).

const adminLight: ColorScale = {
  background: "30 25% 97%",
  foreground: "15 30% 10%",
  card: "0 0% 100%",
  cardForeground: "15 30% 10%",
  popover: "0 0% 100%",
  popoverForeground: "15 30% 10%",
  primary: "0 58% 26%",
  primaryForeground: "30 30% 97%",
  secondary: "30 18% 93%",
  secondaryForeground: "15 30% 10%",
  muted: "30 12% 92%",
  mutedForeground: "15 8% 46%",
  accent: "40 78% 50%",
  accentForeground: "15 30% 10%",
  destructive: "0 72% 51%",
  destructiveForeground: "0 0% 100%",
  border: "30 12% 89%",
  input: "30 12% 89%",
  ring: "0 58% 26%",
  gold: "40 78% 50%",
  goldForeground: "15 30% 10%",
  success: "152 56% 39%",
  successForeground: "0 0% 100%",
  sidebar: {
    background: "0 0% 100%",
    foreground: "15 30% 10%",
    primary: "0 58% 26%",
    primaryForeground: "30 30% 97%",
    accent: "30 18% 95%",
    accentForeground: "15 30% 10%",
    border: "30 12% 91%",
    ring: "0 58% 26%",
  },
};

const adminDark: ColorScale = {
  background: "220 15% 6%",
  foreground: "220 10% 93%",
  card: "220 14% 10%",
  cardForeground: "220 10% 93%",
  popover: "220 14% 10%",
  popoverForeground: "220 10% 93%",
  primary: "40 72% 52%",
  primaryForeground: "220 15% 6%",
  secondary: "220 12% 14%",
  secondaryForeground: "220 10% 85%",
  muted: "220 12% 14%",
  mutedForeground: "220 8% 55%",
  accent: "40 72% 52%",
  accentForeground: "220 15% 6%",
  destructive: "0 62% 50%",
  destructiveForeground: "0 0% 100%",
  border: "220 12% 16%",
  input: "220 12% 16%",
  ring: "40 72% 52%",
  gold: "40 72% 52%",
  goldForeground: "220 15% 6%",
  success: "152 56% 39%",
  successForeground: "0 0% 100%",
  sidebar: {
    background: "220 16% 8%",
    foreground: "220 10% 85%",
    primary: "40 72% 52%",
    primaryForeground: "220 15% 6%",
    accent: "220 12% 12%",
    accentForeground: "220 10% 85%",
    border: "220 12% 13%",
    ring: "40 72% 52%",
  },
};

export const adminTheme: AudienceTheme = {
  audience: "admin",
  fontSans: "Inter",
  fontSerif: "Playfair Display",
  radius: 0.75,
  light: adminLight,
  dark: adminDark,
};

// ─── Theme registry ──────────────────────────────────────────────────────────

export const themes = {
  salon: salonTheme,
  freelancer: freelancerTheme,
  customer: customerTheme,
  events: eventsTheme,
  staff: staffTheme,
  admin: adminTheme,
} as const;

export type AudienceKey = keyof typeof themes;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert an HSL triplet string ("H S% L%") to a "#rrggbb" hex value.
 * Needed where CSS variables can't reach — e.g. React Native StatusBar
 * background, native splash color, app icon adaptive background.
 */
export function hslTripletToHex(triplet: HslTriplet): string {
  const [hStr, sStr, lStr] = triplet.split(" ");
  const h = Number(hStr);
  const s = Number(sStr.replace("%", "")) / 100;
  const l = Number(lStr.replace("%", "")) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const to255 = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to255(r)}${to255(g)}${to255(b)}`;
}

/**
 * Flatten a ColorScale to a CSS-variable map. Used by web (to generate
 * :root blocks) and by mobile (to feed NativeWind's vars() runtime API).
 *
 * Variable names match the existing web convention so a class like
 * `bg-primary` resolves to the same value on web and mobile.
 */
export function scaleToCssVars(scale: ColorScale): Record<string, string> {
  const out: Record<string, string> = {
    "--background": scale.background,
    "--foreground": scale.foreground,
    "--card": scale.card,
    "--card-foreground": scale.cardForeground,
    "--popover": scale.popover,
    "--popover-foreground": scale.popoverForeground,
    "--primary": scale.primary,
    "--primary-foreground": scale.primaryForeground,
    "--secondary": scale.secondary,
    "--secondary-foreground": scale.secondaryForeground,
    "--muted": scale.muted,
    "--muted-foreground": scale.mutedForeground,
    "--accent": scale.accent,
    "--accent-foreground": scale.accentForeground,
    "--destructive": scale.destructive,
    "--destructive-foreground": scale.destructiveForeground,
    "--border": scale.border,
    "--input": scale.input,
    "--ring": scale.ring,
    "--gold": scale.gold,
    "--gold-foreground": scale.goldForeground,
    "--success": scale.success,
    "--success-foreground": scale.successForeground,
    "--sidebar-background": scale.sidebar.background,
    "--sidebar-foreground": scale.sidebar.foreground,
    "--sidebar-primary": scale.sidebar.primary,
    "--sidebar-primary-foreground": scale.sidebar.primaryForeground,
    "--sidebar-accent": scale.sidebar.accent,
    "--sidebar-accent-foreground": scale.sidebar.accentForeground,
    "--sidebar-border": scale.sidebar.border,
    "--sidebar-ring": scale.sidebar.ring,
  };
  if (scale.info) out["--info"] = scale.info;
  if (scale.infoForeground) out["--info-foreground"] = scale.infoForeground;
  if (scale.warning) out["--warning"] = scale.warning;
  if (scale.warningForeground)
    out["--warning-foreground"] = scale.warningForeground;
  return out;
}
