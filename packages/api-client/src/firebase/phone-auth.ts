// ─────────────────────────────────────────────────────────────────────────────
// Firebase Phone Auth Hook
// ─────────────────────────────────────────────────────────────────────────────
// Wraps Firebase Client SDK phone auth flow:
//   1. sendOtp(phoneNumber) → renders invisible reCAPTCHA, sends OTP via Firebase
//   2. confirmOtp(code)     → verifies OTP, returns Firebase ID token
//   3. POST idToken to backend /api/v1/auth/oauth/firebase-phone → Kshuri JWT
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type Auth,
} from 'firebase/auth';

export interface FirebasePhoneAuthConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
}

export type PhoneAuthState = 'idle' | 'sending' | 'awaiting-otp' | 'verifying' | 'success' | 'error';

export interface UsePhoneOtpReturn {
  state: PhoneAuthState;
  error: string | null;
  sendOtp: (phoneNumber: string) => Promise<void>;
  confirmOtp: (code: string) => Promise<string>; // returns Firebase ID token
  reset: () => void;
}

// Singleton Firebase app — initialized once per config
function getFirebaseApp(config: FirebasePhoneAuthConfig): FirebaseApp {
  const appName = `kshuri-phone-auth-${config.projectId}`;
  if (getApps().find(a => a.name === appName)) {
    return getApp(appName);
  }
  return initializeApp(config, appName);
}

export function usePhoneOtp(config: FirebasePhoneAuthConfig): UsePhoneOtpReturn {
  const [state, setState] = useState<PhoneAuthState>('idle');
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const authRef = useRef<Auth | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    confirmationRef.current = null;
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  }, []);

  const sendOtp = useCallback(async (phoneNumber: string) => {
    try {
      setState('sending');
      setError(null);

      const app = getFirebaseApp(config);
      const auth = getAuth(app);
      authRef.current = auth;

      // Ensure recaptcha container exists (invisible recaptcha)
      let container = document.getElementById('firebase-recaptcha');
      if (!container) {
        container = document.createElement('div');
        container.id = 'firebase-recaptcha';
        document.body.appendChild(container);
      }

      // Clear stale verifier
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
      }

      recaptchaRef.current = new RecaptchaVerifier(auth, 'firebase-recaptcha', {
        size: 'invisible',
      });

      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      confirmationRef.current = result;
      setState('awaiting-otp');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      setState('error');
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    }
  }, [config]);

  const confirmOtp = useCallback(async (code: string): Promise<string> => {
    if (!confirmationRef.current) {
      throw new Error('No OTP request in progress. Call sendOtp first.');
    }
    try {
      setState('verifying');
      const credential = await confirmationRef.current.confirm(code);
      const idToken = await credential.user.getIdToken();
      setState('success');
      return idToken;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid OTP code';
      setError(message);
      setState('error');
      throw err;
    }
  }, []);

  return { state, error, sendOtp, confirmOtp, reset };
}
