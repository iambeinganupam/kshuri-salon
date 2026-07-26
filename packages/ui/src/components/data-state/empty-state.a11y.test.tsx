import { describe, it, expect } from "vitest";
import { Inbox } from "lucide-react";
import { axe } from "jest-axe";
import { render } from "@testing-library/react";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

describe("a11y — DataState primitives", () => {
  it("EmptyState has no violations", async () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="No bookings yet"
        description="Make one to see it here."
        action={{ label: "Browse", onClick: () => undefined }}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ErrorState has no violations", async () => {
    const { container } = render(
      <ErrorState
        title="Couldn't load"
        description="Network down"
        onRetry={() => undefined}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
