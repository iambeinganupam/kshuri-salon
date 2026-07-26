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

// Services imports hooks from @kshuri/api-client (no /hooks suffix)
vi.mock('@kshuri/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@kshuri/api-client')>();
  return {
    ...actual,
    ApiClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useApiClient: () => ({ get: vi.fn(), post: vi.fn() }),
    useServices: () => ({ data: [], isLoading: false }),
    useCreateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteService: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useProducts: () => ({ data: [], isLoading: false }),
    useCreateProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useUpdateProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDeleteProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
    usePortfolio: () => ({ data: [], isLoading: false }),
    useBusinessProfile: () => ({ data: undefined, isLoading: false }),
    useOwnVendorReviews: () => ({ data: { items: [] }, isLoading: false }),
  };
});

import Services from './Services';

describe('Services page', () => {
  it('renders the Services & Products heading', async () => {
    renderWithProviders(<Services />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Services & Products/i })).toBeInTheDocument();
    });
  });

  it('renders the Services and Products tabs', async () => {
    renderWithProviders(<Services />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Services/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Products/i })).toBeInTheDocument();
    });
  });
});
