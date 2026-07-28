// ─────────────────────────────────────────────────────────────────────────────
// Login Page — kshuri-salon-dashboard (Outlet Manager)
// ─────────────────────────────────────────────────────────────────────────────
// Phone + OTP is the only path in/out of this dashboard.
//
// Flow:
//   1. User types 10-digit phone → we prepend +91 and call Firebase sendOtp.
//   2. User types 6-digit OTP → Firebase verifies → we receive an idToken.
//   3. We exchange the idToken with the backend in `lookup_only` mode:
//        - exists & role=business_admin → log them in.
//        - exists but different role    → "create an Outlet Manager account"
//                                          inline CTA (we never reveal the
//                                          actual role on file).
//        - no account on this dashboard → silently route to /signup with the
//                                          verified idToken handed off via
//                                          router state — signup picks it up
//                                          and starts at Step 2 (no second
//                                          OTP round-trip).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { FadeIn } from "@kshuri/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, ArrowRight, Sparkles, Building2, Star, Shield, ShieldAlert } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  useVerifyFirebaseToken,
  isRoleMismatchError,
  isPhoneNotRegisteredError,
  isEmailNotRegisteredError,
} from "@kshuri/api-client";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useFirebasePhoneAuth } from "@/hooks/useFirebasePhoneAuth";
import { useEmailOtpAuth } from "@/hooks/useFirebaseEmailAuth";
import { auth } from "@/lib/firebase";

// Wording the user requested: never reveal the actual role of the account
// (no cross-pollination between dashboards). The vendor portal is its own
// world — mismatched logins are treated as "no outlet account on file."
const ROLE_MISMATCH_TITLE = "This number isn't registered as an Outlet Manager";
const ROLE_MISMATCH_DETAIL = "Create an Outlet Manager account to access the vendor portal.";
const ROLE_MISMATCH_CTA = "Create an Outlet Manager account →";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Persistent inline alert when the verified phone belongs to a non-vendor
  // role. We deliberately don't say which role — the salon dashboard is its
  // own world. New-phone users never see this; they're auto-routed to signup.
  const [roleMismatch, setRoleMismatch] = useState(false);

  const [phone, setPhone] = useState("");
  const [emailUser, setEmailUser] = useState("");
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [otpCode, setOtpCode] = useState("");
  // We keep the just-verified idToken so the role-mismatch "Create account"
  // CTA can hand it off to /signup — signup then skips its own Step 1 instead
  // of re-asking for the same number we already verified seconds ago.
  const [verifiedIdToken, setVerifiedIdToken] = useState<string>("");
  const [verifiedIdTokenAt, setVerifiedIdTokenAt] = useState<number>(0);

  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

  const verifyFirebaseTokenMutation = useVerifyFirebaseToken();

  const {
    sendOtp,
    verifyOtp,
    reset,
    otpSent,
    isLoading: isPhoneAuthLoading,
  } = useFirebasePhoneAuth({ containerId: "recaptcha-container" });

  const {
    requestEmailOtp,
    verifyEmailOtpCode,
    reset: resetEmail,
    otpSent: emailOtpSent,
    isLoading: isEmailAuthLoading,
  } = useEmailOtpAuth();

  const PHONE_RE = /^[6-9]\d{9}$/;
  const phoneValid = PHONE_RE.test(phone);

  // (Note: handleEmailLinkVerification removed as it's an OTP flow now)

  async function handleRequestEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!emailUser || !emailUser.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    const result = await requestEmailOtp(emailUser);
    if (result.success) {
      toast.success("OTP sent! Please check your email.");
    } else {
      toast.error("Failed to send login OTP. Please try again.");
    }
  }

  async function handleVerifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setRoleMismatch(false);
    try {
      const verifyResult = await verifyEmailOtpCode(emailUser, otpCode);
      if (!verifyResult.success || !verifyResult.result) {
        if (verifyResult.error) {
          throw verifyResult.error;
        }
        toast.error("Invalid OTP. Please try again.");
        return;
      }

      const authResult = verifyResult.result;

      setVerifiedIdToken(""); // We don't have idToken for email OTP logic currently, signup flow needs to be updated if email signup is intended via this route

      setAuthUser(authResult.user, authResult.access_token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: unknown) {
      if (isEmailNotRegisteredError(err) || isPhoneNotRegisteredError(err)) {
        toast.success("Email verified — let's finish setting up your outlet.");
        navigate("/signup", {
          state: {
            email: emailUser,
          },
        });
        return;
      }
      if (isRoleMismatchError(err)) {
        setRoleMismatch(true);
        return;
      }
      console.error("Email OTP Verify Error:", err);
      toast.error("Login failed after OTP verification.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneValid) {
      toast.error("Enter a valid 10-digit Indian mobile starting with 6-9");
      return;
    }

    // sendOtp expects E.164 — state holds digits only, we prepend +91 here.
    const result = await sendOtp(`+91${phone}`);
    if (result.success) {
      toast.success("OTP sent! Please check your phone.");
    } else {
      toast.error("Failed to send OTP. Please try again.");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    const verifyResult = await verifyOtp(otpCode);
    if (!verifyResult.success || !verifyResult.idToken) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    // Remember the just-verified idToken so we can hand it off to /signup
    // either explicitly (role-mismatch CTA) or implicitly (new-user redirect).
    setVerifiedIdToken(verifyResult.idToken);
    const issuedAt = Date.now();
    setVerifiedIdTokenAt(issuedAt);

    setIsLoading(true);
    setRoleMismatch(false);
    try {
      const authResult = await verifyFirebaseTokenMutation.mutateAsync({
        id_token: verifyResult.idToken,
        role: "business_admin",
        lookup_only: true,
      });

      setAuthUser(authResult.user, authResult.access_token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: unknown) {
      if (isPhoneNotRegisteredError(err)) {
        // New phone, no Outlet Manager account yet. Skip the inline CTA —
        // the user clearly wants to access this dashboard, so route them
        // straight to signup with the verified token. The signup page
        // honors the handoff and lands them on Step 2 (details).
        toast.success("Phone verified — let's finish setting up your outlet.");
        navigate("/signup", {
          state: {
            phone,
            idToken: verifyResult.idToken,
            idTokenIssuedAt: issuedAt,
          },
        });
        return;
      }
      if (isRoleMismatchError(err)) {
        setRoleMismatch(true);
        return;
      }
      console.error(err);
      toast.error("Login failed after OTP verification.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Branding Panel */}
      <div className="hidden md:flex md:w-[45%] relative overflow-hidden bg-card border-r border-border">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[300px] h-[300px] rounded-full bg-accent/10" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
          <FadeIn>
            <div className="h-16 w-16 rounded-2xl bg-primary/15 backdrop-blur-sm flex items-center justify-center mb-8 mx-auto border border-primary/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-[44px] font-serif font-bold text-foreground leading-[1.1] tracking-tight mb-4">
              Welcome to<br />Estylr
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-12">
              India's premier salon management platform. Manage your business, staff, and bookings — all in one place.
            </p>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div className="flex items-center gap-6 text-muted-foreground text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>2,000+ Outlets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-accent" />
                <span>4.8★ Rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Secure Payments</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full max-w-md">
          <FadeIn>
            <div className="flex items-center justify-center gap-2.5 mb-6 md:hidden">
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="mb-8">
              <h2 className="text-[28px] font-serif font-bold text-foreground tracking-tight">Sign in</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We'll send a one-time code to your phone.
              </p>
            </div>
          </FadeIn>

          {roleMismatch && (
            <FadeIn delay={0.05}>
              <div
                role="alert"
                className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ROLE_MISMATCH_TITLE}</p>
                      <p className="text-xs text-muted-foreground mt-1">{ROLE_MISMATCH_DETAIL}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/signup", {
                            state: verifiedIdToken
                              ? {
                                phone,
                                idToken: verifiedIdToken,
                                idTokenIssuedAt: verifiedIdTokenAt,
                              }
                              : undefined,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                      >
                        {ROLE_MISMATCH_CTA}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRoleMismatch(false);
                          reset();
                          setOtpCode("");
                          setPhone("");
                        }}
                        className="inline-flex items-center rounded-lg px-3 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      >
                        Try a different number
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.1}>
            <div className="flex bg-muted/50 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setLoginMethod("phone")}
                className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-all ${loginMethod === "phone" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Phone
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-all ${loginMethod === "email" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Email
              </button>
            </div>

            <div id="recaptcha-container" />

            {loginMethod === "phone" && (
              !otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-2.5 block">Phone Number</label>
                    <div className="flex items-stretch gap-2">
                      <div
                        aria-hidden
                        className="grid h-12 place-items-center rounded-xl border border-border/50 bg-muted/50 px-3 text-sm font-medium text-muted-foreground"
                      >
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-muted-foreground/70" /> +91
                        </span>
                      </div>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="h-12 flex-1 rounded-xl bg-muted/30 border-border/50 tracking-wider"
                      />
                    </div>
                    <p
                      className={`mt-1.5 text-xs ${phone.length > 0 && !phoneValid ? "text-destructive" : "text-muted-foreground"
                        }`}
                    >
                      {phone.length > 0 && !phoneValid
                        ? "Enter a 10-digit Indian mobile starting with 6, 7, 8, or 9."
                        : "10-digit mobile, no spaces."}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={isPhoneAuthLoading || !phoneValid}
                    className="w-full h-12 gap-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                  >
                    {isPhoneAuthLoading ? "Sending…" : "Send OTP"} <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                      Enter 6-digit OTP
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Code sent to <span className="font-medium text-foreground">+91 {phone}</span>
                    </p>
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} className="gap-2">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    type="submit"
                    disabled={isPhoneAuthLoading || isLoading || otpCode.length !== 6}
                    className="w-full h-12 gap-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                  >
                    {isPhoneAuthLoading || isLoading ? "Verifying…" : "Verify OTP"} <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        reset();
                        setOtpCode("");
                        setRoleMismatch(false);
                      }}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Use a different number
                    </button>
                  </div>
                </form>
              )
            )}

            {loginMethod === "email" && (
              !emailOtpSent ? (
                <form onSubmit={handleRequestEmailOtp} className="space-y-5">
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-2.5 block">Email Address</label>
                    <div className="flex items-stretch gap-2">
                      <div
                        aria-hidden
                        className="grid h-12 place-items-center rounded-xl border border-border/50 bg-muted/50 px-3 text-sm font-medium text-muted-foreground"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground/70" />
                      </div>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="hello@example.com"
                        value={emailUser}
                        onChange={(e) => setEmailUser(e.target.value)}
                        className="h-12 flex-1 rounded-xl bg-muted/30 border-border/50"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isEmailAuthLoading || !emailUser.includes("@")}
                    className="w-full h-12 gap-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                  >
                    {isEmailAuthLoading ? "Sending…" : "Send OTP"} <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                      Enter 6-digit OTP
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Code sent to <span className="font-medium text-foreground">{emailUser}</span>
                    </p>
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} className="gap-2">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    type="submit"
                    disabled={isEmailAuthLoading || isLoading || otpCode.length !== 6}
                    className="w-full h-12 gap-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                  >
                    {isEmailAuthLoading || isLoading ? "Verifying…" : "Verify OTP"} <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        resetEmail();
                        setOtpCode("");
                        setRoleMismatch(false);
                      }}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Use a different email
                    </button>
                  </div>
                </form>
              )
            )}
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-center text-sm text-muted-foreground mt-8">
              New to Estylr?{" "}
              <Link to="/signup" className="font-semibold hover:underline text-accent">
                Create an Outlet Manager account
              </Link>
            </p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
