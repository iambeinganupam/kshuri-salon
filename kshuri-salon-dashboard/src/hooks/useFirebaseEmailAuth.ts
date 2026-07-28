import { useState, useCallback } from "react";
import { useRequestEmailOtp, useVerifyEmailOtp } from "@kshuri/api-client";

export function useEmailOtpAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otpSent, setOtpSent] = useState(false);

    const requestOtpMutation = useRequestEmailOtp();
    const verifyOtpMutation = useVerifyEmailOtp();

    // Request an OTP code to the email
    const requestEmailOtp = useCallback(async (email: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await requestOtpMutation.mutateAsync(email);

            // Optional: Save email locally to avoid re-asking if needed,
            // but usually state in the component is enough.
            window.localStorage.setItem('emailForSignIn', email);

            setOtpSent(true);
            return { success: true };
        } catch (err: any) {
            console.error("Email OTP Auth Error (requestEmailOtp):", err);
            setError(err.message || "Failed to send OTP. Please try again.");
            return { success: false, error: err };
        } finally {
            setIsLoading(false);
        }
    }, [requestOtpMutation]);

    // Complete sign-in given the OTP code
    const verifyEmailOtpCode = useCallback(async (email: string, otpCode: string, opts?: Record<string, any>) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await verifyOtpMutation.mutateAsync({
                email,
                otp_code: otpCode,
                role: 'business_admin',
                lookup_only: !opts?.is_signup, // default to lookup_only=true unless explicitly signing up
                ...opts,
            });

            window.localStorage.removeItem('emailForSignIn');

            return { success: true, result };
        } catch (err: any) {
            console.error("Email OTP Auth Error (verifyEmailOtp):", err);
            setError(err.message || "Invalid or expired OTP.");
            return { success: false, error: err };
        } finally {
            setIsLoading(false);
        }
    }, [verifyOtpMutation]);

    const reset = useCallback(() => {
        setOtpSent(false);
        setError(null);
    }, []);

    return {
        requestEmailOtp,
        verifyEmailOtpCode,
        reset,
        otpSent,
        isLoading,
        error,
    };
}
