import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AccountForm, { AccountFormSubmitValues } from '@/components/AccountForm';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();

  if (isAuthenticated && !isLoading) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async ({
    full_name,
    email,
    password,
    avatarFile,
    role: _role
  }: AccountFormSubmitValues) => {
    if (!password) {
      throw new Error('Password is required');
    }

    const currentUser = await register({
      full_name,
      email,
      password,
      avatarFile
    });

    navigate(currentUser.role === 'admin' ? '/admin' : '/profile', { replace: true });
  };

  return (
    <AccountForm
      mode="register"
      title="Join Umanni Users"
      subtitle="Build your profile and collaborate with your team"
      initialValues={{ fullName: '', email: '', avatarUrl: null }}
      submitLabel="Create account"
      pendingLabel="Creating account..."
      onSubmit={handleSubmit}
      footerLeft={
        <span>
          Already have an account? <Link to="/login">Sign in</Link>
        </span>
      }
    />
  );
};

export default RegisterPage;

