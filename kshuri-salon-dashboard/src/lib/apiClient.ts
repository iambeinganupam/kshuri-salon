// ─────────────────────────────────────────────────────────────────────────────
// API Client — kshuri-salon-dashboard
// ─────────────────────────────────────────────────────────────────────────────
// Thin wrapper that creates the shared @kshuri/api-client instance.
// ─────────────────────────────────────────────────────────────────────────────

import { createApiClient, TokenManager } from '@kshuri/api-client';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/** Singleton token manager for this app */
export const tokenManager = new TokenManager();

/** Pre-configured Axios instance with auto-refresh + tenant headers */
export const apiClient = createApiClient(
  {
    baseURL: API_BASE_URL,
    // Identifies this dashboard to the backend on every /auth/* call.
    // Server uses it to gate role-vs-audience and to scope the refresh
    // cookie per dashboard, so a freelancer's session can never be used
    // to refresh into the salon dashboard.
    audience: 'salon',
    onAuthFailure: () => {
      window.location.href = '/';
    },
  },
  tokenManager,
);

// ── Backward-compatible exports ──────────────────────────────────────────────
export const setAccessToken = (token: string | null) => tokenManager.setAccessToken(token);
export const getAccessToken = () => tokenManager.getAccessToken();
export const setTenantContext = (ctx: { tenantId?: string; locationId?: string }) =>
  tokenManager.setTenantContext(ctx);

export default apiClient;
