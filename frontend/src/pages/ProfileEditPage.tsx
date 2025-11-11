import { useNavigate } from 'react-router-dom';
import LoadingState from '@/components/LoadingState';
import { useAuth } from '@/hooks/useAuth';
import AccountForm, { AccountFormSubmitValues } from '@/components/AccountForm';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, refreshCurrentUser, isLoading } = useAuth();

  if (isLoading || !user) {
    return <LoadingState message="Loading profile..." />;
  }

  const handleSubmit = async ({
    full_name,
    email,
    password,
    avatarFile,
    role: _role
  }: AccountFormSubmitValues) => {
    await updateProfile({
      full_name,
      email,
      password,
      avatarFile: avatarFile ?? undefined
    });

    await refreshCurrentUser();
    navigate('/profile', { replace: true });
  };

  return (
    <AccountForm
      mode="edit"
      title="Edit your profile"
      subtitle="Update your personal information and profile photo."
      initialValues={{
        fullName: user.full_name,
        email: user.email,
        avatarUrl: user.avatar_image_url
      }}
      submitLabel="Save changes"
      pendingLabel="Saving..."
      onSubmit={handleSubmit}
      backButton={{
        label: 'Back',
        onClick: () => navigate('/profile')
      }}
    />
  );
};

export default ProfileEditPage;
