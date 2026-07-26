// ─────────────────────────────────────────────────────────────────────────────
// slotGate — single source of truth for "can this slot be booked right now".
//
// Combines two independent invariants:
//   1. The slot must not have already started (clock-driven).
//   2. The backend must have flagged it `available` (booking-driven).
//
// Both the grid renderer (Step3Schedule) and the submit guard
// (useCreateBookingForm) call this so they can never disagree on whether a
// slot is bookable. The function is pure — pass `nowMs` explicitly so it
// stays testable and so callers can hold a ticking value in state.
// ─────────────────────────────────────────────────────────────────────────────

export type SlotGateReason = "ok" | "past" | "unavailable";

export interface SlotGateResult {
  bookable: boolean;
  reason: SlotGateReason;
}

interface GateSlotInput {
  /** ISO datetime string for the slot start. */
  start: string;
  /** Backend's availability flag (false when blocked / already booked). */
  available: boolean;
}

export function gateSlot(slot: GateSlotInput, nowMs: number): SlotGateResult {
  if (new Date(slot.start).getTime() <= nowMs) {
    return { bookable: false, reason: "past" };
  }
  if (!slot.available) {
    return { bookable: false, reason: "unavailable" };
  }
  return { bookable: true, reason: "ok" };
}

/** Human-readable explanation, used for tooltips / toasts. */
export const SLOT_GATE_MESSAGE: Record<SlotGateReason, string> = {
  ok: "",
  past: "This time has already passed",
  unavailable: "This slot is already taken or blocked",
};
