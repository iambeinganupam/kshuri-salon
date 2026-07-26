import { describe, it, expect } from "vitest";
import { Inbox } from "lucide-react";
import { axe } from "jest-axe";
import { render } from "@testing-library/react";

import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Input } from "./input";
import { Label } from "./label";
import { EmptyState } from "./data-state/empty-state";

/**
 * Smoke a11y test — composes the most-used primitives the way real pages do
 * and asserts axe finds zero violations. Catches regressions in our usage
 * patterns (icon-only buttons without aria-label, inputs without labels,
 * decorative icons without aria-hidden, etc.) without needing a dedicated
 * test file per primitive.
 */
describe("a11y — primitive composition", () => {
  it("a typical card with labelled inputs and a button has no violations", async () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" defaultValue="Asha" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="asha@example.com" />
            </div>
            <div className="flex items-center gap-2">
              <Badge>VIP</Badge>
              <Button type="button">Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("empty state with action inside a card has no violations", async () => {
    const { container } = render(
      <Card>
        <CardContent>
          <EmptyState
            icon={Inbox}
            title="No bookings yet"
            description="Browse vendors to make your first booking."
            action={{ label: "Browse", onClick: () => undefined }}
          />
        </CardContent>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
