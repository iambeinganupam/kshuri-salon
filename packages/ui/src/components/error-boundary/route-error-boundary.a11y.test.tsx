import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { axe } from "jest-axe";
import { render } from "@testing-library/react";

import { RouteErrorBoundary } from "./route-error-boundary";

function Boom(): JSX.Element {
  throw new Error("Boom");
}

describe("a11y — RouteErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("the default fallback has no violations", async () => {
    const { container } = render(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
