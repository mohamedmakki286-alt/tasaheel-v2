import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import LoadingScreen from './LoadingScreen';

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) {
    switch (role) {
      case 'customer': return <Navigate to="/app" replace />;
      case 'workshop': return <Navigate to="/dashboard" replace />;
      case 'admin':
      case 'super_admin': return <Navigate to="/" replace />;
      default: return <Navigate to="/dashboard" replace />;
    }
  }
  return <>{children}</>;
}
