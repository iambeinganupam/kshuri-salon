import {
  createApiClient,
  TokenManager,
  type ApiClientConfig,
} from "@kshuri/api-client/client";
import type { AudienceKey } from "@kshuri/api-client/types";
import type { AxiosInstance } from "axios";

export interface MobileApiOptions {
  baseURL: string;
  audience: AudienceKey;
  /** Called when the access token can no longer be refreshed and the user
   *  must re-authenticate (typically: force-route to /(auth)/login). */
  onSessionLost?: () => void;
}

export interface MobileApi {
  client: AxiosInstance;
  tokenManager: TokenManager;
}

/**
 * Factory that wires the shared @kshuri/api-client for use inside a React
 * Native / Expo app.
 *
 * Refresh strategy: the platform refresh-token cookie is httpOnly and lives
 * on the backend; mobile clients receive only the access token in the login
 * response body. When the access token expires the interceptor invokes
 * `onSessionLost`; the app is expected to route the user back to /login.
 *
 * (A future iteration can layer a React-Native cookie jar — e.g.
 *  `@react-native-cookies/cookies` — onto axios to enable transparent
 *  refresh on mobile, matching the web flow.)
 */
export function createMobileApi({
  baseURL,
  audience,
  onSessionLost,
}: MobileApiOptions): MobileApi {
  const tokenManager = new TokenManager();
  const config: ApiClientConfig = {
    baseURL,
    audience,
    onAuthFailure: onSessionLost,
  };
  const client = createApiClient(config, tokenManager);
  return { client, tokenManager };
}
