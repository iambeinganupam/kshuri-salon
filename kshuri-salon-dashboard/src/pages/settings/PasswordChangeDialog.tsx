// ─────────────────────────────────────────────────────────────────────────────
// PasswordChangeDialog — focused, modal-only password rotation flow.
//
// Design follows the GitHub / Linear / Vercel pattern: a dedicated modal
// keeps the Settings page tidy, gives the user a focused place to update
// the credential, and limits accidental edits. Includes:
//
//   • Show/hide toggles per field (eyeball icon)
//   • Inline password-strength hint (length / mixed-case / number)
//   • Client-side mismatch + reuse checks before hitting the network
//   • Success closes the modal and toasts; errors stay inside the modal
//
// Backend is `POST /auth/change-password` (added in this PR).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye, EyeOff, Lock, Loader2, Shield, Check, X,
} from "lucide-react";
import { toast } from "sonner";
import { useChangePassword } from "@kshuri/api-client/hooks";
import { cn } from "@/lib/utils";

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const MIN_LENGTH = 8;

interface StrengthCheck {
  label: string;
  pass: boolean;
}

function evaluateStrength(pwd: string): StrengthCheck[] {
  return [
    { label: `At least ${MIN_LENGTH} characters`, pass: pwd.length >= MIN_LENGTH },
    { label: "Mix of upper & lowercase", pass: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) },
    { label: "Includes a number", pass: /\d/.test(pwd) },
  ];
}

export function PasswordChangeDialog({ open, onOpenChange }: PasswordChangeDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const changePassword = useChangePassword();

  // Reset state on every open so a previously-typed half-flow doesn't
  // leak into the next session (especially after a successful change).
  useEffect(() => {
    if (open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
    }
  }, [open]);

  const checks = useMemo(() => evaluateStrength(newPassword), [newPassword]);
  const allChecksPass = checks.every((c) => c.pass);
  const matches = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0
    && allChecksPass
    && matches
    && newPassword !== currentPassword;

  const onSubmit = () => {
    if (!canSubmit) return;
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: (data) => {
          toast.success(data?.message ?? "Password updated");
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const apiMsg = (err as {
            response?: { data?: { error?: { message?: string } } };
          })?.response?.data?.error?.message;
          // Surface the specific server message — usually "Invalid email or
          // password" when the current-password check fails.
          toast.error(apiMsg ?? "Couldn't update password");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/30">
          <DialogTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Change Password
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Updating your password signs you out of all other devices and sessions.
          </p>
        </DialogHeader>

        <div className="px-5 py-5 space-y-4">
          <Field
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((v) => !v)}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />

          <Field
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
            placeholder="Choose a strong password"
            autoComplete="new-password"
          />

          {/* Password strength checklist — shown once the user starts typing
              the new password so the cues don't clutter the empty state. */}
          {newPassword.length > 0 && (
            <ul className="space-y-1 -mt-1">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5 text-[11px]">
                  {c.pass
                    ? <Check className="h-3 w-3 text-success" />
                    : <X className="h-3 w-3 text-muted-foreground/60" />}
                  <span className={c.pass ? "text-success" : "text-muted-foreground"}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div>
            <label className="text-[12px] font-semibold text-foreground mb-1.5 block">
              Confirm New Password
            </label>
            <Input
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && !matches && (
              <p className="text-[11px] text-destructive mt-1.5 flex items-center gap-1">
                <X className="h-3 w-3" /> Passwords don't match
              </p>
            )}
            {newPassword.length > 0 && newPassword === currentPassword && (
              <p className="text-[11px] text-destructive mt-1.5 flex items-center gap-1">
                <X className="h-3 w-3" /> New password must be different from current
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border/30 bg-muted/5 flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={changePassword.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-10 px-5 rounded-xl gap-1.5"
            onClick={onSubmit}
            disabled={!canSubmit || changePassword.isPending}
          >
            {changePassword.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
              : <><Shield className="h-4 w-4" /> Update Password</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  autoComplete?: string;
}

function Field({ label, value, onChange, show, onToggleShow, placeholder, autoComplete }: FieldProps) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("h-11 rounded-xl pr-11", show && "font-mono")}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
