import { describe, it, expect, vi } from "vitest";
import { Bell, Calendar, Home, Settings } from "lucide-react";
import { fireEvent, render, screen } from "@testing-library/react";

import { BottomNav } from "./bottom-nav";

const ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Calendar", icon: Calendar, href: "/calendar" },
  { label: "Alerts", icon: Bell, href: "/alerts", badge: 3 },
  { label: "Settings", icon: Settings, href: "/settings" },
];

describe("<BottomNav>", () => {
  it("renders one entry per item with the label", () => {
    render(<BottomNav items={ITEMS} />);
    expect(screen.getByLabelText("Primary")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.getByLabelText("Home")).toBeInTheDocument();
  });

  it("marks the active item with aria-current=page", () => {
    const items = ITEMS.map((i, idx) => ({ ...i, active: idx === 1 }));
    render(<BottomNav items={items} />);
    expect(screen.getByLabelText("Calendar")).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Home")).not.toHaveAttribute("aria-current");
  });

  it("renders a numeric badge for a count", () => {
    render(<BottomNav items={ITEMS} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("truncates numeric badges over 9 to '9+' by default", () => {
    const items = [{ ...ITEMS[2], badge: 42 }, ITEMS[0]];
    render(<BottomNav items={items} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("renders a button for onClick items and fires the handler", () => {
    const handleClick = vi.fn();
    const items = [
      { label: "Logout", icon: Settings, onClick: handleClick },
      ITEMS[0],
    ];
    render(<BottomNav items={items} />);
    const button = screen.getByRole("button", { name: "Logout" });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("hides on lg+ breakpoints by default", () => {
    render(<BottomNav items={ITEMS} />);
    expect(screen.getByLabelText("Primary").className).toContain("lg:hidden");
  });

  it("keeps visible on desktop when hideOnDesktop=false", () => {
    render(<BottomNav items={ITEMS} hideOnDesktop={false} />);
    expect(screen.getByLabelText("Primary").className).not.toContain("lg:hidden");
  });
});
