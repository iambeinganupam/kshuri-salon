import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
// Data router (createBrowserRouter) instead of <BrowserRouter><Routes>… so that
// useBlocker (used on the Portfolio Edit page for unsaved-changes prompts)
// works. The JSX shape stays the same via createRoutesFromElements.
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { ApiClientProvider, createQueryClient } from "@kshuri/api-client";
import {
  LoadingRegion,
  PageHeaderSkeleton,
  StatsGridSkeleton,
  Skeleton,
} from "@kshuri/ui";
import { apiClient } from "@/lib/apiClient";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import PortalLayout from "@/components/PortalLayout";
import RequireRole from "@/components/RequireRole";
import KycEnforcer from "@/components/KycEnforcer";

// Eagerly imported: root auth pages (first paint) + 404 fallback.
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import NotFound from "./pages/NotFound";

// ── Lazy-loaded routes ────────────────────────────────────────────────────
const KycOnboardingPage     = lazy(() => import("@/pages/Onboarding/KycOnboarding"));
const KycPendingPage        = lazy(() => import("@/pages/Onboarding/KycPending"));
const Dashboard             = lazy(() => import("@/pages/Dashboard"));
const Bookings              = lazy(() => import("@/pages/bookings"));
const Services              = lazy(() => import("@/pages/Services"));
const StaffPage             = lazy(() => import("@/pages/StaffPage"));
const StaffDetailPage       = lazy(() => import("@/pages/StaffDetailPage"));
const FreelancerPage        = lazy(() => import("@/pages/FreelancerPage"));
const FreelancerDetailPage  = lazy(() => import("@/pages/FreelancerDetailPage"));
const BillingPage           = lazy(() => import("@/pages/BillingPage"));
const CalendarPage          = lazy(() => import("@/pages/CalendarPage"));
const SettingsPage          = lazy(() => import("@/pages/SettingsPage"));
const SalonProfilePage      = lazy(() => import("@/pages/SalonProfilePage"));
const ReportsPage           = lazy(() => import("@/pages/ReportsPage"));
const TransactionsPage      = lazy(() => import("@/pages/TransactionsPage"));
const AnalyticsPage         = lazy(() => import("@/pages/AnalyticsPage"));
const PortfolioPage         = lazy(() => import("@/pages/PortfolioPage"));
const SalonAddress          = lazy(() => import("@/pages/settings/Address"));
const SalonNotifications    = lazy(() => import("@/pages/settings/Notifications"));
const NotificationsPage     = lazy(() => import("@/pages/NotificationsPage"));
// Messages page is hidden until the full chat experience ships — see the
// commented-out routes below. Restore the import alongside.

const queryClient = createQueryClient();

function RouteFallback() {
  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-[1440px]">
      <LoadingRegion className="space-y-6">
        <PageHeaderSkeleton />
        <StatsGridSkeleton />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </LoadingRegion>
    </div>
  );
}

const lazyRoute = (element: React.ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{element}</Suspense>
);

function PortalRoute({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  // RequireRole handles auth + role gate (sends mismatched roles back to `/`
  // with a "use the right dashboard" toast). KycEnforcer redirects unapproved
  // vendors to the onboarding wizard before they can access protected pages.
  return (
    <RequireRole expectedRole="business_admin">
      <KycEnforcer>
        <PortalLayout>{children}</PortalLayout>
      </KycEnforcer>
    </RequireRole>
  );
}

// Onboarding routes: authenticated + role-checked, but no KycEnforcer (so
// vendors can reach the wizard/pending page while KYC is incomplete).
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  return (
    <RequireRole expectedRole="business_admin">
      {children}
    </RequireRole>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding/kyc" element={<OnboardingRoute>{lazyRoute(<KycOnboardingPage />)}</OnboardingRoute>} />
      <Route path="/onboarding/pending" element={<OnboardingRoute>{lazyRoute(<KycPendingPage />)}</OnboardingRoute>} />
      <Route path="/dashboard" element={<PortalRoute>{lazyRoute(<Dashboard />)}</PortalRoute>} />
      <Route path="/bookings" element={<PortalRoute>{lazyRoute(<Bookings />)}</PortalRoute>} />
      <Route path="/services" element={<PortalRoute>{lazyRoute(<Services />)}</PortalRoute>} />
      <Route path="/staff" element={<PortalRoute>{lazyRoute(<StaffPage />)}</PortalRoute>} />
      <Route path="/staff/:id" element={<PortalRoute>{lazyRoute(<StaffDetailPage />)}</PortalRoute>} />
      <Route path="/freelancers" element={<PortalRoute>{lazyRoute(<FreelancerPage />)}</PortalRoute>} />
      <Route path="/freelancers/:id" element={<PortalRoute>{lazyRoute(<FreelancerDetailPage />)}</PortalRoute>} />
      <Route path="/billing" element={<PortalRoute>{lazyRoute(<BillingPage />)}</PortalRoute>} />
      <Route path="/calendar" element={<PortalRoute>{lazyRoute(<CalendarPage />)}</PortalRoute>} />
      <Route path="/settings" element={<PortalRoute>{lazyRoute(<SettingsPage />)}</PortalRoute>} />
      <Route path="/settings/address" element={<PortalRoute>{lazyRoute(<SalonAddress />)}</PortalRoute>} />
      <Route path="/settings/notifications" element={<PortalRoute>{lazyRoute(<SalonNotifications />)}</PortalRoute>} />
      <Route path="/notifications" element={<PortalRoute>{lazyRoute(<NotificationsPage />)}</PortalRoute>} />
      <Route path="/reports" element={<PortalRoute>{lazyRoute(<ReportsPage />)}</PortalRoute>} />
      <Route path="/transactions" element={<PortalRoute>{lazyRoute(<TransactionsPage />)}</PortalRoute>} />
      <Route path="/analytics" element={<PortalRoute>{lazyRoute(<AnalyticsPage />)}</PortalRoute>} />
      <Route path="/salon-profile" element={<PortalRoute>{lazyRoute(<SalonProfilePage />)}</PortalRoute>} />
      <Route path="/portfolio" element={<PortalRoute>{lazyRoute(<PortfolioPage />)}</PortalRoute>} />
      {/* Messages — hidden until full chat experience ships.
          Re-enable both routes (and the sidebar entry in
          PortalLayout.tsx) once attachments / presence / receipts
          land. */}
      {/* <Route path="/messages" element={<MessagesRoute>{lazyRoute(<MessagesPage />)}</MessagesRoute>} /> */}
      {/* <Route path="/messages/:threadId" element={<MessagesRoute>{lazyRoute(<MessagesPage />)}</MessagesRoute>} /> */}
      <Route path="*" element={<NotFound />} />
    </>,
  ),
);

const App = () => (
  <ApiClientProvider client={apiClient}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <RouterProvider router={router} />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ApiClientProvider>
);

export default App;
