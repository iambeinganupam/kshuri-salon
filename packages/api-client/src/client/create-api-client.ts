// ─────────────────────────────────────────────────────────────────────────────
// API Client Factory — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Creates a configured Axios instance with:
//   • Request interceptor: attaches Bearer token + X-Tenant-Id + X-Location-Id
//   • Response interceptor: auto-refresh on 401 with concurrent request queuing
//
// Replaces 6 identical copies of `apiClient.ts` across the monorepo.
// Each app calls createApiClient() once at startup and passes the result
// to the ApiClientProvider.
// ─────────────────────────────────────────────────────────────────────────────

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

import type { TokenManager } from './token-manager';
import type { ApiClientConfig } from './types';

/**
 * Creates a fully-configured Axios instance for the Kshuri API.
 *
 * @example
 * ```ts
 * const tokenManager = new TokenManager();
 * const apiClient = createApiClient({
 *   baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
 *   onAuthFailure: () => navigate('/login'),
 * }, tokenManager);
 * ```
 */
export function createApiClient(
  config: ApiClientConfig,
  tokenManager: TokenManager,
): AxiosInstance {
  const client = axios.create({
    baseURL: `${config.baseURL}/api/v1`,
    withCredentials: true, // Sends httpOnly refresh_token cookie
    timeout: config.timeout ?? 15_000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // ── Request Interceptor — Attach Token + Tenant + Audience ──────────────
  client.interceptors.request.use(
    (req: InternalAxiosRequestConfig) => {
      const token = tokenManager.getAccessToken();
      if (token && req.headers) {
        req.headers['Authorization'] = `Bearer ${token}`;
      }

      const tenant = tokenManager.getTenantContext();
      if (tenant.tenantId && req.headers) {
        req.headers['X-Tenant-Id'] = tenant.tenantId;
      }
      if (tenant.locationId && req.headers) {
        req.headers['X-Location-Id'] = tenant.locationId;
      }

      // Audience header — sent on every request so the server can gate
      // /auth/* endpoints by role-vs-audience and scope refresh-token
      // cookies per dashboard. Harmless on non-auth routes.
      if (config.audience && req.headers) {
        req.headers['X-Kshuri-Audience'] = config.audience;
      }

      return req;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // ── Response Interceptor — Auto-Refresh on 401 ─────────────────────────
  let isRefreshing = false;
  let refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }> = [];

  function processQueue(error: unknown, token: string | null): void {
    refreshQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token!);
    });
    refreshQueue = [];
  }

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      const is401 = error.response?.status === 401;
      const isAuthEndpoint = originalRequest.url?.includes('/auth/');
      const alreadyRetried = originalRequest._retry === true;

      // Don't refresh for auth endpoints, already-retried requests, or non-401 errors
      if (!is401 || isAuthEndpoint || alreadyRetried) {
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          }
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Cookie is sent automatically (withCredentials: true)
        const { data } = await client.post<{
          success: boolean;
          data: { access_token: string };
        }>('/auth/refresh');

        const newToken = data.data.access_token;
        tokenManager.setAccessToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        }
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenManager.clear();
        // Notify the app that auth has failed
        config.onAuthFailure?.();
        // Web-only DOM signal. Guarded so React Native / Node consumers
        // (whose tsconfig omits `lib: ["dom"]`) typecheck cleanly.
        const g = globalThis as {
          window?: { dispatchEvent: (e: unknown) => boolean };
          CustomEvent?: new (type: string) => unknown;
        };
        if (g.window && g.CustomEvent) {
          g.window.dispatchEvent(new g.CustomEvent('auth:logout'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return client;
}
