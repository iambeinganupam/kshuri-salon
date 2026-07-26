import { useState, useEffect } from "react";
import { FadeIn } from "@kshuri/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, ArrowRight, Sparkles, Store } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth-context";
import {
  useVerifyFirebaseToken,
  isPhoneNotRegisteredError,
  isRoleMismatchError,
} from "@kshuri/api-client";
import { useFirebasePhoneAuth } from "@/hooks/useFirebasePhoneAuth";

// ── Resume-signup draft (localStorage) ────────────────────────────────────────
// Firebase phone-OTP ID tokens expire after ~60 min, so we cap drafts at 50 min
// and require the user to re-verify their number if they return later. The
// draft is keyed by digits-only phone number so re-typing the same number on a
// fresh signup picks the previous attempt back up.
// ── Field validators (shared by all signup forms in this app) ────────────────
const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile, 10 digits, starts 6-9
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_RE = /^[1-9]\d{5}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const NAME_RE = /^.{2,}$/;

const DRAFT_KEY_PREFIX = "kshuri:salon-signup-draft:";
const DRAFT_TTL_MS = 50 * 60 * 1000;
type OutletTypeValue = "unisex" | "male" | "female" | "";
type SignupDraft = {
  phone: string;
  idToken: string;
  idTokenIssuedAt: number;
  step: number;
  fullName: string;
  email: string;
  businessName: string;
  address: string;
  city: string;
  pincode: string;
  outletType: OutletTypeValue;
  gstin: string;
  tradeLicense: string;
};

function normalizeOutletTypeForApi(
  value: OutletTypeValue,
): "unisex" | "men" | "women" | undefined {
  if (!value) return undefined;
  if (value === "male") return "men";
  if (value === "female") return "women";
  return "unisex";
}
function draftKeyFor(phone: string) {
  return DRAFT_KEY_PREFIX + phone.replace(/\D/g, "");
}
function readFreshestDraft(): SignupDraft | null {
  try {
    let best: SignupDraft | null = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(DRAFT_KEY_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const d = JSON.parse(raw) as SignupDraft;
      if (Date.now() - d.idTokenIssuedAt > DRAFT_TTL_MS) {
        localStorage.removeItem(key);
        continue;
      }
      if (!best || d.idTokenIssuedAt > best.idTokenIssuedAt) best = d;
    }
    return best;
  } catch {
    return null;
  }
}

const TOTAL_STEPS = 3;

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = [
    "Phone Verification",
    "Personal & Outlet Details",
    "Business Documents (optional)",
  ];
  return (
    <div className="mb-8">
      <p className="text-sm text-muted-foreground mb-3">
        Step {current} of {total} — {labels[current - 1]}
      </p>
      <div className="flex gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < current ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthUser } = useAuth();

  // Pre-fill email when the user was bounced here from the LoginPage's
  // role-mismatch alert (LoginPage navigates with `?email=…` on the
  // "Create an Outlet Manager account" CTA so the user doesn't retype).
  const prefillEmail = (() => {
    const params = new URLSearchParams(location.search);
    return params.get("email") ?? "";
  })();

  // Form State
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [outletType, setOutletType] = useState<OutletTypeValue>("");
  const [gstin, setGstin] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");

  const [otpCode, setOtpCode] = useState("");
  const [idToken, setIdToken] = useState("");
  const [idTokenIssuedAt, setIdTokenIssuedAt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ── On mount: honor an OTP-handoff from LoginPage first, then fall back
  // to any saved signup draft. The handoff lets a user who just verified
  // their phone on /login skip Step 1 here — they shouldn't have to
  // re-verify the same number seconds later.
  useEffect(() => {
    const handoff = location.state as {
      phone?: string;
      idToken?: string;
      idTokenIssuedAt?: number;
    } | null;
    const HANDOFF_TTL = 50 * 60 * 1000;
    if (
      handoff?.idToken &&
      handoff.phone &&
      typeof handoff.idTokenIssuedAt === "number" &&
      Date.now() - handoff.idTokenIssuedAt < HANDOFF_TTL
    ) {
      setPhone(
        handoff.phone
          .replace(/^\+?91/, "")
          .replace(/\D/g, "")
          .slice(0, 10),
      );
      setIdToken(handoff.idToken);
      setIdTokenIssuedAt(handoff.idTokenIssuedAt);
      setStep(2);
      toast.success("Phone already verified — let's finish your details.");
      // Clear router state so a later in-app refresh doesn't keep replaying it.
      window.history.replaceState({}, "");
      return;
    }

    const draft = readFreshestDraft();
    if (!draft) return;
    // Normalise legacy drafts that may have stored phone in E.164 (+91…) form.
    setPhone(
      draft.phone
        .replace(/^\+?91/, "")
        .replace(/\D/g, "")
        .slice(0, 10),
    );
    setIdToken(draft.idToken);
    setIdTokenIssuedAt(draft.idTokenIssuedAt);
    setFullName(draft.fullName);
    setEmail(draft.email);
    setBusinessName(draft.businessName);
    setAddress(draft.address);
    setCity(draft.city);
    setPincode(draft.pincode);
    setOutletType(draft.outletType);
    setGstin(draft.gstin);
    setTradeLicense(draft.tradeLicense);
    setStep(draft.step);
    toast.info(
      `Welcome back — resuming your signup for +91${draft.phone.replace(/\D/g, "").slice(-10)}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist the draft on any field change once OTP has been verified ──
  useEffect(() => {
    if (!idToken || !phone) return;
    const draft: SignupDraft = {
      phone,
      idToken,
      idTokenIssuedAt,
      step,
      fullName,
      email,
      businessName,
      address,
      city,
      pincode,
      outletType,
      gstin,
      tradeLicense,
    };
    try {
      localStorage.setItem(draftKeyFor(phone), JSON.stringify(draft));
    } catch {
      /* quota or disabled — best effort */
    }
  }, [
    idToken,
    idTokenIssuedAt,
    phone,
    step,
    fullName,
    email,
    businessName,
    address,
    city,
    pincode,
    outletType,
    gstin,
    tradeLicense,
  ]);

  const verifyFirebaseTokenMutation = useVerifyFirebaseToken();

  const {
    sendOtp,
    verifyOtp,
    reset,
    otpSent,
    isLoading: isPhoneAuthLoading,
  } = useFirebasePhoneAuth({ containerId: "signup-recaptcha-container" });

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // ── Derived validity (recomputed on each render — cheap) ──
  const phoneValid = PHONE_RE.test(phone);
  const emailValid = email === "" || EMAIL_RE.test(email);
  const fullNameValid = NAME_RE.test(fullName.trim());
  const outletValid = NAME_RE.test(businessName.trim());
  const addressValid = address.trim().length >= 4;
  const cityValid = NAME_RE.test(city.trim());
  const pincodeValid = PINCODE_RE.test(pincode);
  const outletTypeValid = outletType !== "";
  const gstinValid = gstin === "" || GSTIN_RE.test(gstin);
  const step2Valid =
    fullNameValid &&
    emailValid &&
    outletValid &&
    addressValid &&
    cityValid &&
    pincodeValid &&
    outletTypeValid;
  const step3Valid = gstinValid; // trade_license is free-text, no specific format

  async function handleSendOtp() {
    if (!phoneValid)
      return toast.error(
        "Enter a valid 10-digit Indian mobile starting with 6-9",
      );
    // sendOtp expects E.164 — we store digits only and prepend +91 here.
    const result = await sendOtp(`+91${phone}`);
    if (result.success) {
      toast.success("OTP sent!");
    } else {
      toast.error("Failed to send OTP");
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length !== 6) return toast.error("Invalid OTP");

    const verifyResult = await verifyOtp(otpCode);
    if (!verifyResult.success || !verifyResult.idToken) {
      toast.error("Invalid OTP");
      return;
    }

    // Probe the backend in `lookup_only` mode BEFORE collecting details so a
    // user who already has an Outlet Manager account doesn't fill out Steps
    // 2 + 3 only to be rejected with AUTH_PHONE_EXISTS at final submit.
    //
    //   200 → existing Outlet Manager account → auto-login → dashboard.
    //   404 AUTH_PHONE_NOT_REGISTERED → no account yet → proceed to Step 2.
    //   403 AUTH_ROLE_MISMATCH → another role on this phone → send to login.
    try {
      const authResult = await verifyFirebaseTokenMutation.mutateAsync({
        id_token: verifyResult.idToken,
        role: "business_admin",
        lookup_only: true,
      });
      setAuthUser(authResult.user, authResult.access_token);
      try {
        localStorage.removeItem(draftKeyFor(phone));
      } catch {
        /* best effort */
      }
      toast.success(
        "You already have an Outlet Manager account — welcome back!",
      );
      navigate("/dashboard");
      return;
    } catch (err) {
      if (isPhoneNotRegisteredError(err)) {
        setIdToken(verifyResult.idToken);
        setIdTokenIssuedAt(Date.now());
        toast.success("Phone verified successfully!");
        nextStep();
        return;
      }
      if (isRoleMismatchError(err)) {
        toast.error(
          "This phone is registered with another role. Please sign in from the right dashboard.",
        );
        navigate("/", { state: { phone } });
        return;
      }
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        "Couldn't verify your account. Please try again.";
      toast.error(msg);
    }
  }

  async function handleFinalSubmit() {
    if (!businessName || !fullName)
      return toast.error("Please fill required fields");
    setIsLoading(true);
    try {
      const parts = fullName.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

      const authResult = await verifyFirebaseTokenMutation.mutateAsync({
        id_token: idToken,
        role: "business_admin",
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        legal_business_name: businessName,
        address_line1: address || undefined,
        city: city || undefined,
        postal_code: pincode || undefined,
        outlet_type: normalizeOutletTypeForApi(outletType),
        gstin: gstin || undefined,
        trade_license: tradeLicense || undefined,
        is_signup: true,
      });

      setAuthUser(authResult.user, authResult.access_token);
      // Signup succeeded — discard the draft so a future user on this browser
      // doesn't accidentally inherit it.
      try {
        localStorage.removeItem(draftKeyFor(phone));
      } catch {
        /* best effort */
      }
      toast.success(
        "Account created — complete KYC to start receiving bookings.",
      );
      // KYC + plan selection lives in the dedicated onboarding flow.
      navigate("/onboarding/kyc");
    } catch (err) {
      const apiErr = err as {
        response?: { data?: { error?: { code?: string; message?: string } } };
      };
      const code = apiErr?.response?.data?.error?.code;
      if (code === "AUTH_PHONE_EXISTS") {
        const existingRole = (
          apiErr?.response?.data?.error as
            { details?: Record<string, unknown> } | undefined
        )?.details?.existing_role as string | undefined;
        const ROLE_LABEL: Record<string, string> = {
          customer: "Customer",
          freelancer: "Freelancer",
          business_admin: "Salon / Outlet Manager",
          staff: "Staff",
          event_manager: "Event Manager",
          super_admin: "Admin",
        };
        if (existingRole === "business_admin") {
          toast.error(
            "This phone is already a Salon account — please sign in instead.",
          );
        } else if (existingRole && ROLE_LABEL[existingRole]) {
          toast.error(
            `This phone is registered as a ${ROLE_LABEL[existingRole]} account — sign in there instead.`,
          );
        } else {
          toast.error(
            "This phone is already registered. Please sign in instead.",
          );
        }
      } else if (code === "AUTH_EMAIL_EXISTS") {
        toast.error(
          "That email is already on another account. Try a different one.",
        );
      } else if (apiErr?.response?.data?.error?.message?.includes("email")) {
        toast.error("Please enter a valid email address.");
      } else {
        toast.error(
          apiErr?.response?.data?.error?.message ?? "Failed to create account",
        );
      }
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
              Join Estylr
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              Connect with premium salons, manage your schedule, and grow your
              freelancing career in the beauty industry.
            </p>
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
            <h2 className="text-[28px] font-serif font-bold text-foreground tracking-tight mb-1">
              Create Account
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <StepIndicator current={step} total={TOTAL_STEPS} />
          </FadeIn>

          <FadeIn delay={0.15} key={step}>
            {step === 1 && (
              <div className="space-y-5">
                <div id="signup-recaptcha-container"></div>
                {!otpSent ? (
                  <>
                    <div>
                      <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                        Phone Number <span className="text-accent">*</span>
                      </label>
                      <div className="flex items-stretch gap-2">
                        <div
                          aria-hidden
                          className="grid h-12 place-items-center rounded-xl border border-border/50 bg-muted/50 px-3 text-sm font-medium text-muted-foreground"
                        >
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-muted-foreground/70" />{" "}
                            +91
                          </span>
                        </div>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={10}
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) =>
                            setPhone(
                              e.target.value.replace(/\D/g, "").slice(0, 10),
                            )
                          }
                          className="h-12 flex-1 rounded-xl bg-muted/30 border-border/50 tracking-wider"
                        />
                      </div>
                      <p
                        className={`mt-1.5 text-xs ${
                          phone.length > 0 && !phoneValid
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {phone.length > 0 && !phoneValid
                          ? "Enter a 10-digit Indian mobile starting with 6, 7, 8, or 9."
                          : "10-digit mobile number, no spaces. We'll send a one-time code."}
                      </p>
                    </div>
                    <Button
                      disabled={isPhoneAuthLoading || !phoneValid}
                      className="w-full h-12 gap-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                      onClick={handleSendOtp}
                    >
                      {isPhoneAuthLoading
                        ? "Sending..."
                        : "Verify Phone Number"}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                        Enter 6-digit OTP
                      </label>
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={setOtpCode}
                        className="gap-2"
                      >
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
                      disabled={isPhoneAuthLoading || otpCode.length !== 6}
                      className="w-full h-12 gap-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                      onClick={handleVerifyOtp}
                    >
                      {isPhoneAuthLoading ? "Verifying..." : "Confirm OTP"}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          reset();
                          setOtpCode("");
                        }}
                        className="text-xs text-accent hover:underline font-medium"
                      >
                        Use a different number
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                    Full Name <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      placeholder="Rajesh Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className="pl-10 h-12 rounded-xl bg-muted/30 border-border/50"
                    />
                  </div>
                  {fullName.length > 0 && !fullNameValid && (
                    <p className="mt-1.5 text-xs text-destructive">
                      Please enter at least 2 characters.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                    Email{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      type="email"
                      placeholder="rajesh@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="pl-10 h-12 rounded-xl bg-muted/30 border-border/50"
                    />
                  </div>
                  {email.length > 0 && !emailValid && (
                    <p className="mt-1.5 text-xs text-destructive">
                      That doesn't look like a valid email address.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                    Outlet Name <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      placeholder="Your outlet name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      maxLength={200}
                      className="pl-10 h-12 rounded-xl bg-muted/30 border-border/50"
                    />
                  </div>
                  {businessName.length > 0 && !outletValid && (
                    <p className="mt-1.5 text-xs text-destructive">
                      Please enter at least 2 characters.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                    Outlet Address <span className="text-accent">*</span>
                  </label>
                  <Input
                    placeholder="Street + locality"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    maxLength={255}
                    autoComplete="street-address"
                    className="h-12 rounded-xl bg-muted/30 border-border/50"
                  />
                  {address.length > 0 && !addressValid && (
                    <p className="mt-1.5 text-xs text-destructive">
                      Address should be at least 4 characters.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                      City
                    </label>
                    <Input
                      placeholder="Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-12 rounded-xl bg-muted/30 border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                      Pincode <span className="text-accent">*</span>
                    </label>
                    <Input
                      placeholder="400001"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) =>
                        setPincode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      className="h-12 rounded-xl bg-muted/30 border-border/50"
                    />
                    {pincode.length > 0 && !pincodeValid && (
                      <p className="mt-1.5 text-xs text-destructive">
                        Enter a valid 6-digit pincode (cannot start with 0).
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                    Outlet Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["unisex", "male", "female"] as const).map((type) => {
                      const selected = outletType === type;
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant="outline"
                          onClick={() => setOutletType(type)}
                          aria-pressed={selected}
                          className={`h-11 rounded-xl text-xs font-medium capitalize ${
                            selected
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-muted/30 border-border/50 hover:border-primary"
                          }`}
                        >
                          {type === "male"
                            ? "Men"
                            : type === "female"
                              ? "Women"
                              : "Unisex"}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-semibold"
                    onClick={prevStep}
                  >
                    Back
                  </Button>
                  <Button
                    disabled={!step2Valid}
                    className="flex-1 h-12 gap-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                    onClick={nextStep}
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <p className="text-xs text-muted-foreground">
                  Both fields are optional. You can also add them later from
                  your business profile. Identity-document upload (Aadhaar /
                  PAN) happens on the KYC page right after signup.
                </p>
                <div>
                  <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                    GSTIN{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <Input
                    placeholder="22AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    maxLength={15}
                    className="h-12 rounded-xl bg-muted/30 border-border/50"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-foreground mb-2.5 block">
                    Trade License Number{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <Input
                    placeholder="License or registration number"
                    value={tradeLicense}
                    onChange={(e) => setTradeLicense(e.target.value)}
                    maxLength={100}
                    className="h-12 rounded-xl bg-muted/30 border-border/50"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl font-semibold"
                    onClick={prevStep}
                  >
                    Back
                  </Button>
                  <Button
                    disabled={isLoading}
                    className="flex-1 h-12 gap-2 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                    onClick={handleFinalSubmit}
                  >
                    {isLoading ? "Creating..." : "Create Account"}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </FadeIn>

          <FadeIn delay={0.25}>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-semibold hover:underline text-accent"
              >
                Sign in
              </Link>
            </p>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
