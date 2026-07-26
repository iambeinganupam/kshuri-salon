import type { ImageAdapter } from "./types";

/**
 * S3 / S3-compatible adapter.
 *
 * Plain S3 has no inline transformation grammar — every variant is a separate
 * object. This adapter is a passthrough today; when the backend wires a
 * Lambda@Edge or CloudFront Functions transformer (e.g. `?w=640&q=auto`), this
 * is the file to extend. Recognised hosts are conservative on purpose; add
 * more as deployments diverge.
 */

const S3_HOSTS = [
  "s3.amazonaws.com",
  ".s3.amazonaws.com",
  "amazonaws.com/",
  ".cloudfront.net",
];

function isS3(url: string): boolean {
  return S3_HOSTS.some((h) => url.includes(h));
}

export const s3Adapter: ImageAdapter = {
  name: "s3",

  matches: isS3,

  transformUrl(url) {
    return url;
  },

  srcset(url) {
    return `${url} 1x`;
  },
};
