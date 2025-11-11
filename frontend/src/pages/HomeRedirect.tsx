import { Navigate } from 'react-router-dom';
import LoadingState from '@/components/LoadingState';
import { useAuth } from '@/hooks/useAuth';

const HomeRedirect = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? '/admin' : '/profile'} replace />;
};

export default HomeRedirect;

