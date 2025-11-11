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
      throw new Error('A senha é obrigatória');
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
      title="Junte-se aos Usuários Umanni"
      subtitle="Crie seu perfil e colabore com sua equipe"
      initialValues={{ fullName: '', email: '', avatarUrl: null }}
      submitLabel="Criar conta"
      pendingLabel="Criando conta..."
      onSubmit={handleSubmit}
      footerLeft={
        <span>
          Já possui uma conta? <Link to="/login">Entrar</Link>
        </span>
      }
    />
  );
};

export default RegisterPage;

