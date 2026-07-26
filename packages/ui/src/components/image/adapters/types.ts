/**
 * Image-source adapter contract.
 *
 * The image layer is intentionally storage-agnostic: a `KshuriImage` consumer
 * passes a raw URL, and the registry picks the adapter that recognises it.
 * Adding a new provider = add a new file under `./adapters/<name>.ts` and
 * register it in `./index.ts`. No edits to `KshuriImage`.
 */

export interface ImageTransform {
  /** Pixel width hint; adapters that support resizing emit a resized URL. */
  width?: number;
  /** Output format preference; adapters that can convert formats honor this. */
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  /** Quality preference (`"auto"` or a 1-100 integer). */
  quality?: "auto" | number;
  /** Crop mode hint for adapters that support transformation grammars. */
  crop?: "fill" | "fit" | "scale" | "thumb";
}

export interface ImageAdapter {
  /** Stable identifier used in dev tools / debugging. */
  readonly name: string;
  /** Does this adapter understand the given URL? */
  matches(url: string): boolean;
  /** Apply the transform and return the resolved URL. Must be idempotent. */
  transformUrl(url: string, transform?: ImageTransform): string;
  /** Build a `srcset` string. Adapters that cannot resize emit `"<url> 1x"`. */
  srcset(url: string, widths: readonly number[]): string;
}
