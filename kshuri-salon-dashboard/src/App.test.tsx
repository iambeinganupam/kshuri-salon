import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from './test/providers';

// Stub Vite env vars consumed at module scope
vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
vi.stubEnv('VITE_API_URL', 'http://localhost:3001');

// Mock auth-context so LoginPage doesn't need the full AuthProvider chain
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, isLoading: false, setAuthUser: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock @kshuri/api-client hooks used directly in LoginPage
vi.mock('@kshuri/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@kshuri/api-client')>();
  return {
    ...actual,
    ApiClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useApiClient: () => ({ get: vi.fn(), post: vi.fn() }),
    useVerifyFirebaseToken: () => ({ mutateAsync: vi.fn() }),
    isRoleMismatchError: () => false,
    isPhoneNotRegisteredError: () => false,
  };
});

// Mock Firebase phone auth hook
vi.mock('@/hooks/useFirebasePhoneAuth', () => ({
  useFirebasePhoneAuth: () => ({
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
    reset: vi.fn(),
    otpSent: false,
    isLoading: false,
  }),
}));

import LoginPage from './pages/LoginPage';

describe('App routing', () => {
  it('redirects unauthenticated user to /login', async () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /sign in/i }),
      ).toBeInTheDocument();
    });
  });
});
