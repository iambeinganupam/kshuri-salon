/* eslint-disable @typescript-eslint/no-explicit-any -- API hook returns from @kshuri/api-client are loosely shaped; narrowing belongs at the hook layer in a follow-up pass. */
import { useState, useCallback, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface UseFirebasePhoneAuthProps {
  containerId: string;
}

export function useFirebasePhoneAuth({ containerId }: UseFirebasePhoneAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const sendOtp = useCallback(async (phoneNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
        window.recaptchaVerifier = undefined;
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
      });

      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      return { success: true };
    } catch (err: any) {
      console.error("Firebase Phone Auth Error:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
      
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [containerId]);

  const verifyOtp = useCallback(async (otpCode: string) => {
    if (!confirmationResult) {
      setError("No OTP request found. Please request a new OTP.");
      return { success: false, error: new Error("No OTP request found") };
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await confirmationResult.confirm(otpCode);
      const idToken = await result.user.getIdToken();
      return { success: true, idToken };
    } catch (err: any) {
      console.error("Firebase OTP Verification Error:", err);
      setError(err.message || "Invalid OTP or verification failed.");
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [confirmationResult]);

  const reset = useCallback(() => {
    setOtpSent(false);
    setConfirmationResult(null);
    setError(null);
  }, []);

  return {
    sendOtp,
    verifyOtp,
    reset,
    otpSent,
    isLoading,
    error,
  };
}
