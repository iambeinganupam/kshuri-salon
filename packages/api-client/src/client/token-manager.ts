// ─────────────────────────────────────────────────────────────────────────────
// Token Manager — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Manages in-memory access token and tenant context.
// NEVER persists to localStorage or sessionStorage (XSS protection).
// Each app creates one TokenManager instance and passes it to createApiClient().
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantContext {
  tenantId?: string;
  locationId?: string;
}

export class TokenManager {
  private accessToken: string | null = null;
  private tenantContext: TenantContext = {};

  // ── Access Token ──────────────────────────────────────────────────────────

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // ── Tenant Context ────────────────────────────────────────────────────────

  setTenantContext(ctx: TenantContext): void {
    this.tenantContext = ctx;
  }

  updateTenantContext(partial: Partial<TenantContext>): void {
    this.tenantContext = { ...this.tenantContext, ...partial };
  }

  getTenantContext(): TenantContext {
    return this.tenantContext;
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  clear(): void {
    this.accessToken = null;
    this.tenantContext = {};
  }
}
