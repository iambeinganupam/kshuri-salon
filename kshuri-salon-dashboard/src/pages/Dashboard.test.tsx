import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/providers';

vi.stubEnv('VITE_API_URL', 'http://localhost:3001');

// Auth context — authenticated business_admin
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', profile_id: 'p1', role: 'business_admin', first_name: 'Priya' },
    isAuthenticated: true,
    isLoading: false,
    activeLocationId: 'loc1',
    setActiveLocation: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// @kshuri/api-client hooks used by Dashboard
vi.mock('@kshuri/api-client/hooks', () => ({
  useDashboardKPIs: () => ({ data: undefined, isLoading: false }),
  useAppointments: () => ({ data: { items: [] }, isLoading: false }),
  useTransactions: () => ({ data: { items: [] }, isLoading: false }),
  useNotifications: () => ({ data: { items: [] }, isLoading: false }),
}));

import Dashboard from './Dashboard';

describe('Dashboard page', () => {
  it('renders the greeting heading', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Good morning|Good afternoon|Good evening/i),
      ).toBeInTheDocument();
    });
  });

  it('renders the Recent Bookings card', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Recent Bookings/i)).toBeInTheDocument();
    });
  });

  it('renders the Settlements Due card heading', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Settlements Due/i })).toBeInTheDocument();
    });
  });
});
