import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { AxiosInstance } from "axios";
import { authService } from "@kshuri/api-client/services";
import type { AuthUser, AudienceKey } from "@kshuri/api-client/types";
import type { TokenManager } from "@kshuri/api-client/client";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "./secure-storage";
import {
  syncPushTokenOnLogin,
  syncPushTokenOnLogout,
} from "../push/sync";
import { clearAuthCookies } from "../cookies";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  audience: AudienceKey;
  apiClient: AxiosInstance;
  tokenManager: TokenManager;
  children: React.ReactNode;
}

/**
 * Mobile auth provider.
 *
 * Session model:
 *   • Login → backend returns access_token in body AND sets an httpOnly
 *     refresh-token cookie. The access token is persisted in SecureStore
 *     (audience-scoped); the cookie is held by the platform's native
 *     persistent cookie store:
 *       — iOS: NSHTTPCookieStorage.shared (persistent by default)
 *       — Android: WebView CookieManager via @react-native-cookies/cookies
 *         (wired by importing the cookies module at boot)
 *     Both survive cold start.
 *   • In-session refresh: api-client's interceptor calls POST /auth/refresh
 *     on 401; RN auto-sends the cookie (withCredentials: true); backend
 *     returns a new access_token.
 *   • Cold-start refresh: the provider tries the stored access token first.
 *     If it has expired (>15 min) the interceptor will issue a refresh; the
 *     persistent cookie is used and the user lands authenticated without
 *     re-login.
 *   • Logout clears the access token from SecureStore AND clears cookies
 *     via clearAuthCookies() so the next user on the same device cannot
 *     inherit the session.
 */
export function AuthProvider({
  audience,
  apiClient,
  tokenManager,
  children,
}: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getAccessToken(audience);
        if (cancelled) return;
        if (!stored) {
          setStatus("unauthenticated");
          return;
        }
        tokenManager.setAccessToken(stored);
        const profile = await authService.getProfile(apiClient);
        if (cancelled) return;
        setUser(profile);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        tokenManager.clear();
        await clearAccessToken(audience).catch(() => {});
        setStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audience, apiClient, tokenManager]);

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      const result = await authService.login(apiClient, email, password);
      tokenManager.setAccessToken(result.access_token);
      await setAccessToken(audience, result.access_token);
      setUser(result.user);
      setStatus("authenticated");
      void syncPushTokenOnLogin(apiClient, audience);
      return result.user;
    },
    [apiClient, audience, tokenManager],
  );

  const logout = useCallback<AuthContextValue["logout"]>(async () => {
    await syncPushTokenOnLogout(apiClient, audience);
    try {
      await authService.logout(apiClient);
    } catch {
      // Logout endpoint can fail (network, already-invalid token); local
      // cleanup must succeed regardless.
    }
    tokenManager.clear();
    await clearAccessToken(audience).catch(() => {});
    await clearAuthCookies();
    setUser(null);
    setStatus("unauthenticated");
  }, [apiClient, audience, tokenManager]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
