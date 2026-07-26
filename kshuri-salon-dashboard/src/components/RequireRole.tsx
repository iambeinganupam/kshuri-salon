// ─────────────────────────────────────────────────────────────────────────────
// RequireRole — frontend dashboard role guard.
//
// Wraps protected routes: while auth is resolving we render nothing (the
// AuthProvider does the silent refresh). Once resolved, anonymous users go
// to `/`, and users whose role does not match `expectedRole` are signed
// out and sent back to `/` with a toast pointing them at the correct
// dashboard.
//
// Defense in depth — the backend already rejects mismatched-role logins
// at the auth endpoints. This guard catches the rest:
//   - Stale tokens left in localStorage from a different dashboard
//   - Direct URL navigation by an authenticated non-salon-admin
//   - Future cases where a user changes role server-side
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import type { UserRole } from "@kshuri/api-client/types";
import { useAuth } from "@/lib/auth-context";

const ROLE_DASHBOARD_LABELS: Record<UserRole, string> = {
  customer: "customer",
  freelancer: "freelancer",
  business_admin: "salon",
  staff: "staff",
  event_manager: "event manager",
  super_admin: "admin",
};

interface RequireRoleProps {
  expectedRole: UserRole;
  children: React.ReactNode;
}

export default function RequireRole({ expectedRole, children }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const roleMismatch = !!user && user.role !== expectedRole;

  useEffect(() => {
    if (!roleMismatch || !user) return;
    const label = ROLE_DASHBOARD_LABELS[user.role] ?? user.role;
    toast.error(`This account is registered as a ${label}. Please use the ${label} dashboard.`);
    void logout();
  }, [roleMismatch, user, logout]);

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  if (roleMismatch) return <Navigate to="/" replace />;

  return <>{children}</>;
}
