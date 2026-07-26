import type { ImageAdapter } from "./types";
import { cloudinaryAdapter } from "./cloudinary";
import { s3Adapter } from "./s3";
import { noopAdapter } from "./noop";

/**
 * Image-adapter registry.
 *
 * Linear-scanned by `resolveAdapter()`; the FIRST adapter whose `matches()`
 * returns true wins. `noopAdapter` must stay last — it matches everything as
 * a safety net for URLs no provider recognises.
 *
 * To add a new provider:
 *   1. Add `<name>.ts` here implementing `ImageAdapter`.
 *   2. Insert it BEFORE `noopAdapter` below.
 *   3. No edits to `KshuriImage`, `index.ts`, or any consumer.
 */
const REGISTRY: readonly ImageAdapter[] = [
  cloudinaryAdapter,
  s3Adapter,
  noopAdapter,
];

export function resolveAdapter(url: string): ImageAdapter {
  for (const adapter of REGISTRY) {
    if (adapter.matches(url)) return adapter;
  }
  // Unreachable: noopAdapter.matches() returns true unconditionally.
  return noopAdapter;
}

export type { ImageAdapter, ImageTransform } from "./types";
export { cloudinaryAdapter } from "./cloudinary";
export { s3Adapter } from "./s3";
export { noopAdapter } from "./noop";
