// ─────────────────────────────────────────────────────────────────────────────
// Route-level error boundary. Wrap each app's root layout with this so an
// uncaught exception during render shows a friendly screen instead of a
// white screen of death — and ships a Sentry event.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Pressable, Text, View } from "react-native";
import { Sentry } from "./sentry";

interface Props {
  children: React.ReactNode;
  /** Renders the user-facing fallback. Defaults to a built-in minimal screen. */
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    });
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    if (this.state.error) {
      const Fallback = this.props.fallback ?? DefaultFallback;
      return <Fallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

interface FallbackProps {
  error: Error;
  reset: () => void;
}

// Avoid pulling in @kshuri/ui-native here so the boundary works even if the
// theme provider failed to mount.
function DefaultFallback({ error, reset }: FallbackProps): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0E0F11",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 22, color: "#FAFAFA", fontWeight: "600", textAlign: "center" }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 13, color: "#A1A1AA", textAlign: "center" }}>
        We've logged the issue. Tap below to try again.
      </Text>
      <Text style={{ fontSize: 11, color: "#71717A", textAlign: "center", marginTop: 8 }}>
        {error.message.slice(0, 240)}
      </Text>
      <Pressable
        onPress={reset}
        style={{
          marginTop: 16,
          backgroundColor: "#B2173E",
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 6,
        }}
      >
        <Text style={{ fontSize: 14, color: "#FFFFFF", fontWeight: "600" }}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
}
