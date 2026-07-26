// ─────────────────────────────────────────────────────────────────────────────
// API Response & Error Types — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// Standard envelope types matching the backend's response helpers:
//   success(res, data)      → { success: true, data: T }
//   paginated(res, data, m) → { success: true, data: T[], meta: M }
//   error handler           → { success: false, error: { code, message, details } }
// ─────────────────────────────────────────────────────────────────────────────

/** Standard success envelope returned by all backend endpoints */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/** Paginated success envelope with cursor-based or offset meta */
export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

/** Pagination metadata returned by list endpoints */
export interface PaginationMeta {
  has_more: boolean;
  total?: number;
  cursor?: string;
  page?: number;
  limit?: number;
}

/** Standard error envelope returned by the global error handler */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Each Kshuri dashboard identifies itself as one of these audiences. The
 * server uses it to enforce role-vs-audience at the auth boundary and to
 * scope refresh-token cookies per audience.
 */
export type AudienceKey =
  | 'salon'
  | 'freelancer'
  | 'staff'
  | 'customer'
  | 'events'
  | 'admin';

/** Configuration for createApiClient() */
export interface ApiClientConfig {
  /** Base URL of the backend API server (e.g., 'http://localhost:3001') */
  baseURL: string;
  /**
   * Audience identifier — REQUIRED for any dashboard that calls /auth/*.
   * Sent automatically as the `X-Kshuri-Audience` header so the server can
   * gate role-vs-audience and pick the correct refresh-token cookie.
   */
  audience?: AudienceKey;
  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;
  /** Callback invoked when token refresh fails (e.g., redirect to login) */
  onAuthFailure?: () => void;
}

/** Paginated list result returned by service functions */
export interface PaginatedResult<T> {
  items: T[];
  has_more: boolean;
}
