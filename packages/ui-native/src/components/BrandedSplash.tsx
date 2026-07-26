// ─────────────────────────────────────────────────────────────────────────────
// BrandedSplash — full-screen loading state used during font hydration and
// auth cold-start. Renders the audience's primary color + brand-mark; gives
// us a continuous visual transition from native splash → JS splash → app.
//
// The native splash (configured in app.json) shows immediately on launch
// and must use the SAME background color so the handoff is invisible.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

export interface BrandedSplashProps {
  /** The brand wordmark text. Defaults to "Kshuri". */
  brand?: string;
  /** Caption below the wordmark — typically the audience tag e.g. "Pro". */
  tagline?: string;
  /** Background color (must match app.json's splash.backgroundColor). */
  backgroundColor?: string;
  /** Foreground color for the wordmark + spinner. */
  foregroundColor?: string;
  /** Whether to render an inline spinner. Default true. */
  showSpinner?: boolean;
}

export function BrandedSplash({
  brand = "Kshuri",
  tagline,
  backgroundColor = "#0E0F11",
  foregroundColor = "#FAFAFA",
  showSpinner = true,
}: BrandedSplashProps): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor,
        gap: 16,
      }}
    >
      <View style={{ alignItems: "center", gap: 4 }}>
        <Text
          style={{
            fontSize: 48,
            fontWeight: "700",
            color: foregroundColor,
            letterSpacing: 4,
          }}
        >
          {brand}
        </Text>
        {tagline ? (
          <Text
            style={{
              fontSize: 12,
              color: foregroundColor,
              opacity: 0.6,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {tagline}
          </Text>
        ) : null}
      </View>
      {showSpinner ? (
        <ActivityIndicator color={foregroundColor} style={{ marginTop: 12 }} />
      ) : null}
    </View>
  );
}
