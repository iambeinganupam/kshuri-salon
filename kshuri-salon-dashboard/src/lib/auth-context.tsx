// ─────────────────────────────────────────────────────────────────────────────
// AuthContext — kshuri-salon-dashboard (B2B Freelancer / Manager)
// ─────────────────────────────────────────────────────────────────────────────
// Migrated to use @kshuri/api-client shared package.
// Retains the activeLocationId for multi-location managers.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { AuthUser, UserRole } from '@kshuri/api-client/types';
import { useApiClient, assertExpectedRole, isRoleMismatchError } from '@kshuri/api-client';
import { tokenManager } from '@/lib/apiClient';
import { setSentryUser } from '@kshuri/observability';

// This dashboard is the home of the Salon Admin role only. Any other role
// signing in (freelancer, customer, staff, etc.) must be rejected at the
// auth boundary — never seated, never shown another role's data.
const EXPECTED_ROLES: readonly UserRole[] = ['business_admin'];

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeLocationId: string | null;
  setActiveLocation: (locationId: string) => void;
  setAuthUser: (user: AuthUser, accessToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const logoutRef = useRef<() => Promise<void>>();
  const apiClient = useApiClient();

  const setAuthUser = useCallback((u: AuthUser, accessToken: string) => {
    // Role gate at the auth boundary. Throws RoleMismatchError so the
    // LoginPage can render an inline error and prompt the user to create
    // a salon admin account.
    assertExpectedRole(u, EXPECTED_ROLES);
    tokenManager.setAccessToken(accessToken);
    tokenManager.setTenantContext({ tenantId: u.profile_id });
    setUser(u);
    setIsAuthenticated(true);
    setIsLoading(false);
    setSentryUser({ id: u.id, role: u.role });
  }, []);

  const setActiveLocation = useCallback((locationId: string) => {
    setActiveLocationId(locationId);
    tokenManager.updateTenantContext({ locationId });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Server may already have cleared the session
    } finally {
      tokenManager.clear();
      setSentryUser(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setActiveLocationId(null);
    }
  }, [apiClient]);

  logoutRef.current = logout;

  // Single-flight the mount-time silent refresh so React StrictMode's
  // intentional double-mount in dev (and any future re-renders that flip
  // the apiClient identity) can't fire two concurrent /auth/refresh
  // requests against a rotating-token backend. The second call would
  // arrive with a now-invalidated rtv and tear down the session.
  const refreshInflight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (refreshInflight.current) return;
    async function silentRefresh() {
      try {
        const { data: refreshData } = await apiClient.post<{
          success: boolean;
          data: { access_token: string };
        }>('/auth/refresh');

        tokenManager.setAccessToken(refreshData.data.access_token);

        const { data: profileData } = await apiClient.get<{
          success: boolean;
          data: AuthUser;
        }>('/auth/me');

        const u = profileData.data;

        // Stale refresh cookies from another dashboard (e.g. a freelancer
        // who logged in earlier on the same `localhost` host) must not seat
        // the user here. Wipe local + server-side session and stay
        // anonymous — the LoginPage will be shown.
        try {
          assertExpectedRole(u, EXPECTED_ROLES);
        } catch (err) {
          if (isRoleMismatchError(err)) {
            try { await apiClient.post('/auth/logout'); } catch { /* server may have already cleared */ }
            tokenManager.clear();
            return;
          }
          throw err;
        }

        tokenManager.setTenantContext({ tenantId: u.profile_id });
        setUser(u);
        setIsAuthenticated(true);
      } catch {
        // Only clear if there's no existing token — don't blow away a just-set login token
        const existing = tokenManager.getAccessToken?.();
        if (!existing) {
          tokenManager.setAccessToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    refreshInflight.current = silentRefresh().finally(() => {
      refreshInflight.current = null;
    });
  }, [apiClient]);

  useEffect(() => {
    const handler = () => { logoutRef.current?.(); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, activeLocationId, setActiveLocation, setAuthUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export type { AuthUser };
