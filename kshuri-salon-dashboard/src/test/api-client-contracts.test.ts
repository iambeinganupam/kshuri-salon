// ─────────────────────────────────────────────────────────────────────────────
// Contract tests for @kshuri/api-client surface used by this dashboard.
//
// These guard two regressions we hit in real signups + service edits:
//
//   1. `coerceService` in catalogService MUST carry `inclusions` through.
//      Earlier it stripped them on the way out, so the "What's included"
//      bullets vanished from the edit dialog after Save → re-open.
//
//   2. `isPhoneNotRegisteredError(err)` MUST match an axios error envelope
//      carrying `error.code === 'AUTH_PHONE_NOT_REGISTERED'`. The salon +
//      freelancer LoginPages key off this helper to decide whether to
//      auto-redirect to /signup with the verified idToken handoff.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { catalogService } from "@kshuri/api-client/services";
import { isPhoneNotRegisteredError, isRoleMismatchError } from "@kshuri/api-client";

// Minimal mock of the bits of AxiosInstance the catalog service actually uses
// (get/put/post/delete). Each method returns `{ data: { success: true, data: ... } }`
// to mirror the production envelope.
function mockAxios(overrides: Partial<Record<"get" | "put" | "post" | "delete", unknown>>): AxiosInstance {
  return {
    get: overrides.get ?? vi.fn(),
    put: overrides.put ?? vi.fn(),
    post: overrides.post ?? vi.fn(),
    delete: overrides.delete ?? vi.fn(),
  } as unknown as AxiosInstance;
}

describe("catalogService.updateService — coerceService boundary", () => {
  it("carries inclusions through from the wire response (regression: was being dropped)", async () => {
    const client = mockAxios({
      put: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            id: "svc_1",
            name: "Premium Bridal Package",
            description: "All-day glam",
            category: { id: "cat_1", name: "Bridal" },
            price: 15000,
            duration_minutes: 30,
            is_active: true,
            // pg returns JSONB columns already parsed — keep that contract.
            inclusions: [
              "30-min dedicated session",
              "Many more included",
            ],
            staff_overrides: [],
          },
        },
      }),
    });

    const updated = await catalogService.updateService(client, "svc_1", {
      inclusions: ["30-min dedicated session", "Many more included"],
    });

    expect(updated.inclusions).toEqual([
      "30-min dedicated session",
      "Many more included",
    ]);
  });

  it("normalizes a missing inclusions field to an empty array", async () => {
    const client = mockAxios({
      put: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            id: "svc_2",
            name: "Simple Haircut",
            category: { id: "cat_2", name: "Hair" },
            price: 500,
            duration_minutes: 30,
            is_active: true,
            staff_overrides: [],
            // no `inclusions` key at all — older rows / new rows that were
            // never set should round-trip as []
          },
        },
      }),
    });

    const updated = await catalogService.updateService(client, "svc_2", {});
    expect(updated.inclusions).toEqual([]);
  });

  it("filters out non-string entries defensively", async () => {
    const client = mockAxios({
      put: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            id: "svc_3",
            name: "Mixed",
            category: { id: "cat_3", name: "Spa" },
            price: 1000,
            duration_minutes: 30,
            is_active: true,
            // A misbehaving migration / hand-edit could leave a non-string
            // in JSONB — we sanitise rather than crash the page.
            inclusions: ["valid bullet", 42, null, "another"],
            staff_overrides: [],
          },
        },
      }),
    });

    const updated = await catalogService.updateService(client, "svc_3", {});
    expect(updated.inclusions).toEqual(["valid bullet", "another"]);
  });
});

describe("isPhoneNotRegisteredError — frontend error helper", () => {
  it("matches an axios error envelope with code AUTH_PHONE_NOT_REGISTERED", () => {
    const err = {
      response: {
        status: 404,
        data: {
          success: false,
          error: {
            code: "AUTH_PHONE_NOT_REGISTERED",
            message: "No account is registered with this phone number on this dashboard.",
            details: { audience: "salon" },
          },
        },
      },
    };
    expect(isPhoneNotRegisteredError(err)).toBe(true);
  });

  it("does NOT match a different error code (e.g. AUTH_PHONE_EXISTS)", () => {
    const err = {
      response: { status: 409, data: { error: { code: "AUTH_PHONE_EXISTS" } } },
    };
    expect(isPhoneNotRegisteredError(err)).toBe(false);
  });

  it("returns false for non-axios errors / unknown shapes", () => {
    expect(isPhoneNotRegisteredError(new Error("boom"))).toBe(false);
    expect(isPhoneNotRegisteredError(null)).toBe(false);
    expect(isPhoneNotRegisteredError(undefined)).toBe(false);
    expect(isPhoneNotRegisteredError("string")).toBe(false);
  });

  it("returns false for AUTH_ROLE_MISMATCH (separate flow path)", () => {
    const err = {
      response: { status: 403, data: { error: { code: "AUTH_ROLE_MISMATCH" } } },
    };
    expect(isPhoneNotRegisteredError(err)).toBe(false);
    // Sanity: the role-mismatch helper still matches the same shape.
    expect(isRoleMismatchError(err)).toBe(true);
  });
});
