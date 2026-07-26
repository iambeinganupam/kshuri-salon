// ─────────────────────────────────────────────────────────────────────────────
// ApiClientProvider — @kshuri/api-client
// ─────────────────────────────────────────────────────────────────────────────
// React context that makes the configured Axios instance available to all
// service functions and hooks throughout the component tree.
//
// Usage in each app's App.tsx:
//   <ApiClientProvider client={apiClient}>
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <RouterProvider router={router} />
//       </AuthProvider>
//     </QueryClientProvider>
//   </ApiClientProvider>
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext } from 'react';
import type { AxiosInstance } from 'axios';

const ApiClientContext = createContext<AxiosInstance | null>(null);

export interface ApiClientProviderProps {
  client: AxiosInstance;
  children: React.ReactNode;
}

/**
 * Provides the configured Axios instance to all child components.
 * Service functions and hooks use `useApiClient()` to access it.
 */
export function ApiClientProvider({ client, children }: ApiClientProviderProps) {
  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}

/**
 * Hook to access the configured Axios instance from context.
 * Must be used within an `<ApiClientProvider>`.
 */
export function useApiClient(): AxiosInstance {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error(
      'useApiClient must be used within an <ApiClientProvider>. ' +
      'Wrap your app tree with <ApiClientProvider client={apiClient}>.',
    );
  }
  return client;
}
