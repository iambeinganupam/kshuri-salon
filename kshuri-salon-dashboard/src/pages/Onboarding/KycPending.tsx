import { KycPendingScreen } from '@kshuri/ui';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

export default function KycPendingPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <KycPendingScreen
      onApproved={() => navigate('/dashboard', { replace: true })}
      onRejected={() => navigate('/onboarding/kyc', { replace: true })}
      onSignOut={async () => {
        await logout();
        navigate('/', { replace: true });
      }}
    />
  );
}
