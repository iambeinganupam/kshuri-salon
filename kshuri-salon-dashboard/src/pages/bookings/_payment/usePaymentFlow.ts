// ─────────────────────────────────────────────────────────────────────────────
// usePaymentFlow — finite state machine driving the post-completion payment
// step. Keeps PaymentDialog presentational; every transition + API call
// flows through here.
//
// State graph:
//
//   chooseMethod ─┬─► cashConfirm ─► settling ─► done
//                 └─► upiPending  ─► settling ─► done
//
// "settling" is the brief window between optimistic mark-paid and the
// transaction being acknowledged by the server. React Query invalidations
// flip the booking card to its paid state once `done` fires.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useGenerateBill, useGenerateUpiQr } from "@kshuri/api-client/hooks";
import type { UpiPaymentRequest } from "@kshuri/api-client/types";

export type PaymentMethod = "cash" | "upi";
export type PaymentStep = "chooseMethod" | "cashConfirm" | "upiPending" | "settling" | "done";

interface UsePaymentFlowArgs {
  appointmentId: string;
  amount: number;
  onComplete?: () => void;
}

export function usePaymentFlow({ appointmentId, amount, onComplete }: UsePaymentFlowArgs) {
  const [step, setStep] = useState<PaymentStep>("chooseMethod");
  const [qrPayload, setQrPayload] = useState<UpiPaymentRequest | null>(null);

  const generateBill = useGenerateBill();
  const generateQr = useGenerateUpiQr();

  const reset = useCallback(() => {
    setStep("chooseMethod");
    setQrPayload(null);
  }, []);

  const showError = (err: unknown, fallback: string) => {
    const apiMsg = (err as {
      response?: { data?: { error?: { message?: string } } };
    })?.response?.data?.error?.message;
    toast.error(apiMsg ?? (err as Error)?.message ?? fallback);
  };

  /** Cash path: jump straight to confirm. */
  const pickCash = useCallback(() => setStep("cashConfirm"), []);

  /** UPI path: ask the backend to build the QR payload. */
  const pickUpi = useCallback(async () => {
    try {
      const payload = await generateQr.mutateAsync({ appointment_id: appointmentId });
      setQrPayload(payload);
      setStep("upiPending");
    } catch (err) {
      showError(err, "Couldn't generate UPI QR");
    }
  }, [appointmentId, generateQr]);

  /** Settle the bill against either method. */
  const recordPayment = useCallback(
    async (method: PaymentMethod) => {
      setStep("settling");
      try {
        await generateBill.mutateAsync({
          appointment_id: appointmentId,
          payment_method: method,
        });
        toast.success(`₹${amount.toLocaleString("en-IN")} recorded — ${method.toUpperCase()}`);
        setStep("done");
        onComplete?.();
      } catch (err) {
        showError(err, "Couldn't record payment");
        // Drop back to the previous step so the user can retry without
        // losing the QR payload they were already showing the customer.
        setStep(method === "upi" ? "upiPending" : "cashConfirm");
      }
    },
    [appointmentId, amount, generateBill, onComplete],
  );

  return {
    step,
    qrPayload,
    isGeneratingQr: generateQr.isPending,
    isSettling: generateBill.isPending,
    actions: {
      reset,
      pickCash,
      pickUpi,
      confirmCash: () => recordPayment("cash"),
      markUpiPaid: () => recordPayment("upi"),
      back: () => setStep("chooseMethod"),
    },
  };
}

export type PaymentFlow = ReturnType<typeof usePaymentFlow>;
