import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/providers';

vi.stubEnv('VITE_API_URL', 'http://localhost:3001');

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', profile_id: 'p1', role: 'business_admin' },
    isAuthenticated: true,
    isLoading: false,
    activeLocationId: 'loc1',
    setActiveLocation: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@kshuri/api-client/hooks', () => ({
  useStaffList: () => ({ data: [], isLoading: false }),
  useInviteStaff: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@kshuri/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@kshuri/api-client')>();
  return {
    ...actual,
    ApiClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useApiClient: () => ({
      get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      post: vi.fn(),
    }),
  };
});

import StaffPage from './StaffPage';

describe('StaffPage', () => {
  it('renders the Staff heading', async () => {
    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Staff$/i })).toBeInTheDocument();
    });
  });

  it('renders the Add Staff button', async () => {
    renderWithProviders(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Staff/i })).toBeInTheDocument();
    });
  });
});
