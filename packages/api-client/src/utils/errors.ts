// ─────────────────────────────────────────────────────────────────────────────
// API Error Helpers — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Small, dependency-free helpers for extracting human-readable messages and
// machine-readable codes out of axios errors raised by mutation/query hooks.
// Backed by the Kshuri AppError JSON envelope:
//   { success: false, error: { code, message, details? } }
// ─────────────────────────────────────────────────────────────────────────────

import { isAxiosError } from 'axios';

interface KshuriErrorEnvelope {
  success: false;
  error: { code?: string; message?: string; details?: unknown };
}

function isKshuriEnvelope(value: unknown): value is KshuriErrorEnvelope {
  return (
    typeof value === 'object'
    && value !== null
    && 'error' in value
    && typeof (value as { error?: unknown }).error === 'object'
  );
}

/**
 * Pull the most specific user-facing message out of an axios error.
 * Falls back to the supplied default when no message is present.
 */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (isKshuriEnvelope(data) && data.error.message) {
      return data.error.message;
    }
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const m = (data as { message?: unknown }).message;
      if (typeof m === 'string') return m;
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Pull the AppError code (e.g. `RESOURCE_NOT_FOUND`, `VALIDATION_ERROR`)
 * out of an axios error so callers can branch on stable identifiers
 * rather than message text.
 */
export function extractApiErrorCode(err: unknown): string | null {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (isKshuriEnvelope(data) && data.error.code) {
      return data.error.code;
    }
  }
  return null;
}
