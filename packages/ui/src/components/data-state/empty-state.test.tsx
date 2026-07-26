import { describe, expect, it, vi } from "vitest";
import { Inbox } from "lucide-react";
import { fireEvent, render, screen } from "@testing-library/react";

import { EmptyState } from "./empty-state";

describe("<EmptyState>", () => {
  it("renders the title and description with region semantics", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No bookings yet"
        description="Make one to see it here."
      />,
    );

    expect(
      screen.getByRole("region", { name: "No bookings yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Make one to see it here.")).toBeInTheDocument();
  });

  it("fires the action handler when the CTA is clicked", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={Inbox}
        title="No bookings yet"
        action={{ label: "Browse vendors", onClick }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Browse vendors" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("omits the description and action when not provided", () => {
    render(<EmptyState icon={Inbox} title="No bookings yet" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
