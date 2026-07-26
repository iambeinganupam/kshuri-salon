import { describe, expect, it, vi } from "vitest";
import { Inbox } from "lucide-react";
import { render, screen, fireEvent } from "@testing-library/react";

import { DataState, type QueryLike } from "./data-state";

function makeQuery<T>(overrides: Partial<QueryLike<T>>): QueryLike<T> {
  return {
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe("<DataState>", () => {
  it("renders the default skeleton when pending", () => {
    render(
      <DataState query={makeQuery<string[]>({ isPending: true })}>
        {() => <div>never</div>}
      </DataState>,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("never")).not.toBeInTheDocument();
  });

  it("renders the custom skeleton when provided", () => {
    render(
      <DataState
        query={makeQuery<string[]>({ isPending: true })}
        skeleton={<div data-testid="custom-skeleton">loading…</div>}
      >
        {() => <div>never</div>}
      </DataState>,
    );

    expect(screen.getByTestId("custom-skeleton")).toBeInTheDocument();
  });

  it("renders an error alert with the error message and retries via query.refetch", () => {
    const refetch = vi.fn();
    render(
      <DataState
        query={makeQuery<string[]>({
          isError: true,
          error: new Error("Network down"),
          refetch,
        })}
      >
        {() => <div>never</div>}
      </DataState>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Network down")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("prefers the explicit onRetry handler over query.refetch", () => {
    const refetch = vi.fn();
    const onRetry = vi.fn();
    render(
      <DataState
        query={makeQuery<string[]>({
          isError: true,
          error: new Error("Boom"),
          refetch,
        })}
        onRetry={onRetry}
      >
        {() => <div>never</div>}
      </DataState>,
    );

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(refetch).not.toHaveBeenCalled();
  });

  it("renders the empty state when the data is empty and `empty` is provided", () => {
    render(
      <DataState
        query={makeQuery<string[]>({ data: [] })}
        empty={{
          icon: Inbox,
          title: "Nothing here",
          description: "Bookings will appear once made.",
        }}
      >
        {() => <div>never</div>}
      </DataState>,
    );

    expect(
      screen.getByRole("region", { name: "Nothing here" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bookings will appear once made."),
    ).toBeInTheDocument();
    expect(screen.queryByText("never")).not.toBeInTheDocument();
  });

  it("renders the success path when data is non-empty", () => {
    render(
      <DataState query={makeQuery<string[]>({ data: ["a", "b"] })}>
        {(data) => <div>items:{data.length}</div>}
      </DataState>,
    );

    expect(screen.getByText("items:2")).toBeInTheDocument();
  });

  it("uses the custom isEmpty predicate over the default", () => {
    render(
      <DataState
        query={makeQuery<{ items: string[] }>({ data: { items: [] } })}
        isEmpty={(d) => d.items.length === 0}
        empty={{ icon: Inbox, title: "Empty list" }}
      >
        {() => <div>never</div>}
      </DataState>,
    );

    expect(
      screen.getByRole("region", { name: "Empty list" }),
    ).toBeInTheDocument();
  });
});
