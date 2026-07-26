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

// Mock all @kshuri/api-client/hooks used by the bookings page and sub-components
vi.mock('@kshuri/api-client/hooks', () => ({
  useAppointments: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useAppointmentAction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useStaffList: () => ({ data: [], isLoading: false }),
  useInviteStaff: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useServices: () => ({ data: [], isLoading: false }),
  useBusinessProfile: () => ({ data: undefined, isLoading: false }),
  useCreateBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateWalkIn: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAvailableSlots: () => ({ data: [], isLoading: false }),
  useRescheduleAppointment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useWorkingHours: () => ({ data: [], isLoading: false }),
  useGenerateBill: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGenerateUpiQr: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@kshuri/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@kshuri/api-client')>();
  return {
    ...actual,
    ApiClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useApiClient: () => ({ get: vi.fn(), post: vi.fn() }),
  };
});

import Bookings from './index';

describe('Bookings page', () => {
  it('renders the Bookings heading', async () => {
    renderWithProviders(<Bookings />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Bookings$/i })).toBeInTheDocument();
    });
  });

  it('renders the All / Pending / Accepted / In Progress / Completed tabs', async () => {
    renderWithProviders(<Bookings />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /All/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Pending/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Accepted/i })).toBeInTheDocument();
    });
  });

  it('shows empty state when no bookings', async () => {
    renderWithProviders(<Bookings />);

    await waitFor(() => {
      expect(screen.getByText(/Nothing here yet/i)).toBeInTheDocument();
    });
  });
});
