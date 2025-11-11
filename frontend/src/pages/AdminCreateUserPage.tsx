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
      title="Create user"
      subtitle="Provide details for the new user account."
      initialValues={{
        fullName: '',
        email: '',
        avatarUrl: null,
        role: 'non_admin'
      }}
      submitLabel="Create user"
      pendingLabel="Creating user..."
      enableRoleSelection
      onSubmit={handleSubmit}
      backButton={{
        label: 'Back to dashboard',
        onClick: () => navigate('/admin')
      }}
    />
  );
};

export default AdminCreateUserPage;
