import { useKycStatus } from '@kshuri/api-client';
import { useLocation, Navigate } from 'react-router-dom';

const EXEMPT_PATHS = ['/onboarding/', '/notifications', '/settings/profile', '/settings/notifications'];

interface KycEnforcerProps {
  children: React.ReactNode;
}

export default function KycEnforcer({ children }: KycEnforcerProps) {
  const { data, isLoading } = useKycStatus();
  const location = useLocation();

  if (isLoading) return <>{children}</>;
  if (!data) return <>{children}</>;
  if (data.status === 'approved') return <>{children}</>;
  if (EXEMPT_PATHS.some((p) => location.pathname.startsWith(p))) return <>{children}</>;

  const target =
    data.status === 'submitted' || data.status === 'auto_passed' || data.status === 'auto_flagged'
      ? '/onboarding/pending'
      : '/onboarding/kyc';

  return <Navigate to={target} replace />;
}
