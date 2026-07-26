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
  useAppointments: () => ({ data: { items: [] }, isLoading: false, isError: false, refetch: vi.fn() }),
  useWorkingHours: () => ({ data: [], isLoading: false }),
}));

import CalendarPage from './CalendarPage';

describe('CalendarPage', () => {
  it('renders the Calendar heading', async () => {
    renderWithProviders(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Calendar$/i })).toBeInTheDocument();
    });
  });

  it('renders the Week / Day view toggle tabs', async () => {
    renderWithProviders(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Week/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Day/i })).toBeInTheDocument();
    });
  });
});
