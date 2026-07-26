import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ErrorState } from "./error-state";

describe("<ErrorState>", () => {
  it("renders with the default title and alert semantics", () => {
    render(<ErrorState />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders the provided description", () => {
    render(<ErrorState description="Network down" />);
    expect(screen.getByText("Network down")).toBeInTheDocument();
  });

  it("shows a retry button only when onRetry is provided", () => {
    const { rerender } = render(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    const onRetry = vi.fn();
    rerender(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
