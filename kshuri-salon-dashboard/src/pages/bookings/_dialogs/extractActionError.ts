// ─────────────────────────────────────────────────────────────────────────────
// extractActionError — turn an axios error into a user-readable string.
//
// Backend ValidationError responses follow the envelope:
//   { success: false, error: { code: 'VALIDATION_FAILED',
//                              message: 'Request validation failed.',
//                              details: { code, field, message? } } }
// The literal top-level message is generic; the actionable text lives in
// `details.message` (or the details `code`). This helper unwraps it so
// callers can `toast.error(extractActionError(err))` without re-deriving
// the same fallback chain in every catch block.
// ─────────────────────────────────────────────────────────────────────────────

type ErrorEnvelope = {
  response?: {
    data?: {
      error?: {
        message?: string;
        code?: string;
        details?: unknown;
      };
    };
  };
  message?: string;
};

export function extractActionError(err: unknown, fallback = "Action failed"): string {
  const envelope = err as ErrorEnvelope;
  const apiError = envelope?.response?.data?.error;

  if (apiError) {
    const details = apiError.details;
    if (details && typeof details === "object") {
      const detailMessage = (details as { message?: unknown }).message;
      if (typeof detailMessage === "string" && detailMessage.length > 0) {
        return detailMessage;
      }
    }
    if (apiError.message && apiError.message !== "Request validation failed.") {
      return apiError.message;
    }
  }

  if (envelope?.message) return envelope.message;
  return fallback;
}
