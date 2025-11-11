import { useNavigate } from 'react-router-dom';
import AccountForm, { AccountFormSubmitValues } from '@/components/AccountForm';
import { createUser } from '@/api/users';

const AdminCreateUserPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async ({
    full_name,
    email,
    password,
    avatarFile,
    role
  }: AccountFormSubmitValues) => {
    await createUser({
      full_name,
      email,
      password: password || '',
      role,
      avatar_image: avatarFile ?? null
    });

    navigate('/admin', { replace: true });
  };

  return (
    <AccountForm
      mode="register"
      title="Criar usuário"
      subtitle="Informe os dados para a nova conta de usuário."
      initialValues={{
        fullName: '',
        email: '',
        avatarUrl: null,
        role: 'non_admin'
      }}
      submitLabel="Criar usuário"
      pendingLabel="Criando usuário..."
      enableRoleSelection
      onSubmit={handleSubmit}
      backButton={{
        label: 'Voltar para o painel',
        onClick: () => navigate('/admin')
      }}
    />
  );
};

export default AdminCreateUserPage;
