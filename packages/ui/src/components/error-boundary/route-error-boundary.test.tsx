import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { RouteErrorBoundary } from "./route-error-boundary";

function Boom({ message = "Boom" }: { message?: string }): JSX.Element {
  throw new Error(message);
}

describe("<RouteErrorBoundary>", () => {
  // react-error-boundary lets the error log through React's dev-mode handler;
  // silence it so the test output stays clean.
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the default ErrorState fallback when a child throws", () => {
    render(
      <RouteErrorBoundary>
        <Boom message="Network down" />
      </RouteErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("This page hit a snag")).toBeInTheDocument();
    expect(screen.getByText("Network down")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("invokes onError when a child throws", () => {
    const onError = vi.fn();
    render(
      <RouteErrorBoundary onError={onError}>
        <Boom message="Nope" />
      </RouteErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0][0] as Error).message).toBe("Nope");
  });

  it("resets via the retry button + onReset callback", () => {
    const onReset = vi.fn();
    function App() {
      const [showBoom, setShowBoom] = React.useState(true);
      return (
        <RouteErrorBoundary
          onReset={() => {
            onReset();
            setShowBoom(false);
          }}
        >
          {showBoom ? <Boom /> : <div>recovered</div>}
        </RouteErrorBoundary>
      );
    }
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText("recovered")).toBeInTheDocument();
  });

  it("renders a custom fallback when provided", () => {
    function CustomFallback({ error }: { error: Error }): JSX.Element {
      return <div data-testid="custom">custom:{error.message}</div>;
    }
    render(
      <RouteErrorBoundary fallback={CustomFallback}>
        <Boom message="x" />
      </RouteErrorBoundary>,
    );
    expect(screen.getByTestId("custom")).toHaveTextContent("custom:x");
  });
});
