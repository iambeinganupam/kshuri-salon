import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

// Enable axe-core matchers across the @kshuri/ui test suite. Use
// `expect(await axe(container)).toHaveNoViolations()` inside component tests
// to catch regressions in the design-system's a11y contract.
expect.extend(toHaveNoViolations);

// jsdom does not implement ResizeObserver / DOMRect; Radix uses them in
// use-size / react-checkbox. Stub them so tests can mount Radix-backed
// components without crashes.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
