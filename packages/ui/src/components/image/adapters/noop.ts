import type { ImageAdapter } from "./types";

/**
 * Fallback adapter for URLs no provider recognises. Always matches — must be
 * the LAST entry in the registry so the registry's linear scan only reaches
 * it when nothing else claimed the URL.
 */
export const noopAdapter: ImageAdapter = {
  name: "noop",

  matches() {
    return true;
  },

  transformUrl(url) {
    return url;
  },

  srcset(url) {
    return `${url} 1x`;
  },
};
