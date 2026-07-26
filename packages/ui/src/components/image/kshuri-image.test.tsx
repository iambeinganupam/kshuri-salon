import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { KshuriImage } from "./kshuri-image";

const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
const NON_CLOUDINARY = "https://example.com/images/sample.jpg";

describe("<KshuriImage>", () => {
  it("renders a lazy-loaded image with the alt text", () => {
    render(<KshuriImage src={NON_CLOUDINARY} alt="Sample picture" />);
    const img = screen.getByAltText("Sample picture");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("src", NON_CLOUDINARY);
  });

  it("eager-loads when priority is set", () => {
    render(<KshuriImage src={NON_CLOUDINARY} alt="hero" priority />);
    expect(screen.getByAltText("hero")).toHaveAttribute("loading", "eager");
  });

  it("rewrites Cloudinary URLs with f_auto,q_auto and emits a srcset", () => {
    render(<KshuriImage src={CLOUDINARY} alt="vendor" width={640} />);
    const img = screen.getByAltText("vendor");
    expect(img.getAttribute("src")).toContain("f_auto,q_auto,w_640");
    expect(img.getAttribute("srcset")).toContain("w_320");
    expect(img.getAttribute("srcset")).toContain("w_1280");
  });

  it("does not rewrite non-Cloudinary URLs", () => {
    render(<KshuriImage src={NON_CLOUDINARY} alt="x" width={640} />);
    const img = screen.getByAltText("x");
    expect(img).toHaveAttribute("src", NON_CLOUDINARY);
    expect(img).not.toHaveAttribute("srcset");
  });

  it("does not emit srcset for S3 URLs (passthrough adapter)", () => {
    const S3 = "https://my-bucket.s3.amazonaws.com/photos/x.jpg";
    render(<KshuriImage src={S3} alt="s3" width={640} />);
    const img = screen.getByAltText("s3");
    expect(img).toHaveAttribute("src", S3);
    expect(img).not.toHaveAttribute("srcset");
  });

  it("swaps to the fallback src on error", () => {
    const fallback = "https://example.com/fallback.png";
    render(
      <KshuriImage src={NON_CLOUDINARY} alt="broken" fallback={fallback} />,
    );
    const img = screen.getByAltText("broken");
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", fallback);
  });

  it("calls user-provided onError in addition to swapping", () => {
    const onError = vi.fn();
    render(
      <KshuriImage
        src={NON_CLOUDINARY}
        alt="broken"
        fallback="https://example.com/f.png"
        onError={onError}
      />,
    );
    fireEvent.error(screen.getByAltText("broken"));
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("wraps in an aspect-ratio box when aspectRatio is provided", () => {
    render(
      <KshuriImage
        src={NON_CLOUDINARY}
        alt="banner"
        aspectRatio={16 / 9}
        data-testid="img"
      />,
    );
    const img = screen.getByTestId("img");
    expect(img.parentElement?.style.aspectRatio).toBeTruthy();
    expect(img.className).toContain("object-cover");
  });
});
