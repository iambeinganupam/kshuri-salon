import "@testing-library/jest-dom/vitest";

// jsdom does not implement ResizeObserver / MutationObserver shapes that
// Radix UI uses internally (use-size, react-checkbox). Polyfill them with
// no-op stubs so component tests can mount without crashes.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (typeof globalThis.DOMRect === "undefined") {
  globalThis.DOMRect = class DOMRect {
    static fromRect() {
      return new DOMRect();
    }
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    top = 0;
    right = 0;
    bottom = 0;
    left = 0;
    toJSON() {
      return {};
    }
  } as unknown as typeof DOMRect;
}
