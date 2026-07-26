// ─────────────────────────────────────────────────────────────────────────────
// useCreateBookingForm — wizard state machine for the salon "New Booking" flow.
//
// Owns every piece of mutable state behind the 3-step wizard so the dialog
// stays presentational. Exposes a single object: { state, derived, actions }.
//
//   state    — raw form fields the user is editing
//   derived  — computed values (totals, validity per step, selected service rows)
//   actions  — setters, navigation helpers, reset, submit
//
// Submission goes through `useCreateWalkIn`, which is the only mutation the
// salon dashboard uses for in-person bookings (POST /booking/walk-in).
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateWalkIn } from "@kshuri/api-client/hooks";
import type { VendorService } from "@kshuri/api-client/types";
import { gateSlot, SLOT_GATE_MESSAGE } from "./slotGate";

export type WizardStep = 1 | 2 | 3;
export type BookingType = "walkin" | "kshuri";

export interface SelectedSlot {
  /** ISO datetime, e.g. 2026-05-09T10:00:00.000Z */
  start: string;
  end: string;
  /** Display label, e.g. "10:00 AM" */
  label: string;
}

interface FormState {
  step: WizardStep;
  bookingType: BookingType;
  customerName: string;
  customerPhone: string;
  selectedServiceIds: string[];
  date: Date;
  selectedSlot: SelectedSlot | null;
  selectedStaffId: string | null;
  notes: string;
}

const initialState: FormState = {
  step: 1,
  bookingType: "walkin",
  customerName: "",
  customerPhone: "",
  selectedServiceIds: [],
  date: new Date(),
  selectedSlot: null,
  selectedStaffId: null,
  notes: "",
};

export function useCreateBookingForm(opts: {
  services: VendorService[];
  onSuccess?: () => void;
}) {
  const { services, onSuccess } = opts;
  const [state, setState] = useState<FormState>(initialState);
  const createWalkIn = useCreateWalkIn();

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedServices = useMemo(
    () => services.filter((s) => state.selectedServiceIds.includes(s.id)),
    [services, state.selectedServiceIds],
  );

  const totalAmount = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.default_price ?? 0), 0),
    [selectedServices],
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.duration_minutes ?? 0), 0),
    [selectedServices],
  );

  const isStepValid = useMemo<Record<WizardStep, boolean>>(() => ({
    1: state.customerName.trim().length > 0,
    2: state.selectedServiceIds.length > 0,
    3: !!state.selectedSlot,
  }), [state.customerName, state.selectedServiceIds.length, state.selectedSlot]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleService = useCallback((serviceId: string) => {
    setState((prev) => ({
      ...prev,
      selectedServiceIds: prev.selectedServiceIds.includes(serviceId)
        ? prev.selectedServiceIds.filter((id) => id !== serviceId)
        : [...prev.selectedServiceIds, serviceId],
      // Clear the chosen slot — the new total duration may invalidate it.
      selectedSlot: null,
    }));
  }, []);

  const setDate = useCallback((d: Date | undefined) => {
    if (!d) return;
    setState((prev) => ({ ...prev, date: d, selectedSlot: null }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.step === 1 && !prev.customerName.trim()) {
        toast.error("Enter customer name");
        return prev;
      }
      if (prev.step === 2 && prev.selectedServiceIds.length === 0) {
        toast.error("Select at least one service");
        return prev;
      }
      return { ...prev, step: Math.min(3, prev.step + 1) as WizardStep };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as WizardStep,
    }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const submit = useCallback(() => {
    if (!state.selectedSlot) {
      toast.error("Pick a time slot");
      return;
    }
    // Re-run the same gate the slot grid uses so a stale picked slot
    // (clock drifted past it while the modal was open) can never POST.
    const gate = gateSlot(
      { start: state.selectedSlot.start, available: true },
      Date.now(),
    );
    if (!gate.bookable) {
      toast.error(SLOT_GATE_MESSAGE[gate.reason] || "Pick a different slot");
      return;
    }
    createWalkIn.mutate(
      {
        service_ids: state.selectedServiceIds,
        customer_name: state.customerName.trim(),
        customer_phone: state.customerPhone.trim() || undefined,
        slot_start: state.selectedSlot.start,
        slot_end: state.selectedSlot.end,
        staff_member_id: state.selectedStaffId ?? undefined,
        booking_type: state.bookingType,
        notes: state.notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Booking created for ${state.customerName.trim()}`);
          reset();
          onSuccess?.();
        },
        onError: (err: unknown) => {
          const apiMsg = (err as {
            response?: { data?: { error?: { message?: string } } };
          })?.response?.data?.error?.message;
          toast.error(apiMsg ?? (err as Error).message ?? "Failed to create booking");
        },
      },
    );
  }, [state, createWalkIn, reset, onSuccess]);

  return {
    state,
    derived: {
      selectedServices,
      totalAmount,
      totalDuration,
      isStepValid,
      isSubmitting: createWalkIn.isPending,
    },
    actions: {
      update,
      toggleService,
      setDate,
      goNext,
      goBack,
      reset,
      submit,
    },
  };
}

export type CreateBookingForm = ReturnType<typeof useCreateBookingForm>;
