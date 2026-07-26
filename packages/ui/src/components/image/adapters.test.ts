import { describe, it, expect } from "vitest";

import {
  cloudinaryAdapter,
  noopAdapter,
  resolveAdapter,
  s3Adapter,
} from "./adapters";

const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
const CLOUDINARY_WITH_TRANSFORM =
  "https://res.cloudinary.com/demo/image/upload/c_thumb,g_face/sample.jpg";
const S3 = "https://my-bucket.s3.amazonaws.com/photos/sample.jpg";
const CLOUDFRONT = "https://d1234.cloudfront.net/photos/sample.jpg";
const RANDOM = "https://example.com/images/sample.jpg";

describe("resolveAdapter", () => {
  it("picks cloudinary for res.cloudinary.com URLs", () => {
    expect(resolveAdapter(CLOUDINARY).name).toBe("cloudinary");
  });

  it("picks s3 for s3.amazonaws.com URLs", () => {
    expect(resolveAdapter(S3).name).toBe("s3");
  });

  it("picks s3 for cloudfront URLs (typical S3 CDN)", () => {
    expect(resolveAdapter(CLOUDFRONT).name).toBe("s3");
  });

  it("falls back to noop for unknown hosts", () => {
    expect(resolveAdapter(RANDOM).name).toBe("noop");
    expect(resolveAdapter("").name).toBe("noop");
  });
});

describe("cloudinaryAdapter", () => {
  it("inserts default f_auto,q_auto", () => {
    expect(cloudinaryAdapter.transformUrl(CLOUDINARY)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/sample.jpg",
    );
  });

  it("adds width when provided", () => {
    expect(cloudinaryAdapter.transformUrl(CLOUDINARY, { width: 640 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/sample.jpg",
    );
  });

  it("preserves existing transformation segments", () => {
    expect(
      cloudinaryAdapter.transformUrl(CLOUDINARY_WITH_TRANSFORM, { width: 640 }),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/c_thumb,g_face/sample.jpg",
    );
  });

  it("emits a multi-width srcset", () => {
    const out = cloudinaryAdapter.srcset(CLOUDINARY, [320, 640]);
    expect(out).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_320/sample.jpg 320w, " +
        "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/sample.jpg 640w",
    );
  });

  it("returns non-cloudinary URLs unchanged", () => {
    expect(cloudinaryAdapter.transformUrl(RANDOM, { width: 640 })).toBe(RANDOM);
  });
});

describe("s3Adapter (passthrough today)", () => {
  it("returns the URL unchanged", () => {
    expect(s3Adapter.transformUrl(S3, { width: 640 })).toBe(S3);
  });

  it("emits a 1x srcset", () => {
    expect(s3Adapter.srcset(S3, [320, 640])).toBe(`${S3} 1x`);
  });
});

describe("noopAdapter", () => {
  it("matches anything (safety net)", () => {
    expect(noopAdapter.matches("")).toBe(true);
    expect(noopAdapter.matches("https://foo.test")).toBe(true);
  });

  it("returns the URL unchanged", () => {
    expect(noopAdapter.transformUrl(RANDOM)).toBe(RANDOM);
  });

  it("emits a 1x srcset", () => {
    expect(noopAdapter.srcset(RANDOM, [320])).toBe(`${RANDOM} 1x`);
  });
});
