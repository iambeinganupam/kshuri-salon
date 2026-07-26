import { describe, it, expect } from "vitest";
import { Calendar, Home, Settings } from "lucide-react";
import { axe } from "jest-axe";
import { render } from "@testing-library/react";

import { BottomNav } from "./bottom-nav";

describe("a11y — BottomNav", () => {
  it("has no violations with link items", async () => {
    const { container } = render(
      <BottomNav
        items={[
          { label: "Home", icon: Home, href: "/", active: true },
          { label: "Calendar", icon: Calendar, href: "/calendar" },
          { label: "Settings", icon: Settings, href: "/settings", badge: 5 },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with mixed link + button items", async () => {
    const { container } = render(
      <BottomNav
        items={[
          { label: "Home", icon: Home, href: "/" },
          { label: "Logout", icon: Settings, onClick: () => undefined },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
