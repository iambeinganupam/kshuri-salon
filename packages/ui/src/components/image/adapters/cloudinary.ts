import type { ImageAdapter, ImageTransform } from "./types";

const HOST = "res.cloudinary.com";
const UPLOAD_MARKER = "/image/upload/";

function isCloudinary(url: string): boolean {
  return url.includes(HOST) && url.includes(UPLOAD_MARKER);
}

function buildTransform(t: ImageTransform): string {
  const parts: string[] = [];
  if (t.format) parts.push(`f_${t.format}`);
  if (t.quality !== undefined) parts.push(`q_${t.quality}`);
  if (t.width) parts.push(`w_${t.width}`);
  if (t.crop) parts.push(`c_${t.crop}`);
  return parts.join(",");
}

export const cloudinaryAdapter: ImageAdapter = {
  name: "cloudinary",

  matches: isCloudinary,

  transformUrl(url, transform = {}) {
    if (!isCloudinary(url)) return url;
    const t = buildTransform({
      format: transform.format ?? "auto",
      quality: transform.quality ?? "auto",
      ...transform,
    });
    if (!t) return url;
    const idx = url.indexOf(UPLOAD_MARKER);
    const before = url.slice(0, idx + UPLOAD_MARKER.length);
    const after = url.slice(idx + UPLOAD_MARKER.length);
    return `${before}${t}/${after}`;
  },

  srcset(url, widths) {
    if (!isCloudinary(url)) return `${url} 1x`;
    return widths
      .map((w) => `${cloudinaryAdapter.transformUrl(url, { width: w })} ${w}w`)
      .join(", ");
  },
};
