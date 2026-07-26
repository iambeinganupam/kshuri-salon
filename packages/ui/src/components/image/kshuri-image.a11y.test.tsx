import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { render } from "@testing-library/react";

import { KshuriImage } from "./kshuri-image";

describe("a11y — KshuriImage", () => {
  it("has no violations with an alt text", async () => {
    const { container } = render(
      <KshuriImage
        src="https://res.cloudinary.com/demo/image/upload/vendor.jpg"
        alt="Salon storefront with neon signage"
        width={640}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with aspectRatio wrapping (decorative ratio box)", async () => {
    const { container } = render(
      <KshuriImage
        src="https://example.com/banner.jpg"
        alt="Stylist working on a client"
        aspectRatio={16 / 9}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
