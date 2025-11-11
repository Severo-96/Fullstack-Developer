import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingState from '@/components/LoadingState';
import AccountForm, { AccountFormSubmitValues } from '@/components/AccountForm';
import { fetchUser, updateUser } from '@/api/users';
import type { User } from '@/types/user';

const AdminEditUserPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedUser = await fetchUser(Number(id));
        setUser(fetchedUser);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : 'Unable to load user details'
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleSubmit = async ({
    full_name,
    email,
    password,
    avatarFile,
    role
  }: AccountFormSubmitValues) => {
    if (!id) return;

    await updateUser(Number(id), {
      full_name,
      email,
      password,
      role,
      avatar_image: avatarFile ?? undefined,
      avatarUrl: undefined
    });

    navigate('/admin', { replace: true });
  };

  if (loading) {
    return <LoadingState message="Loading user..." />;
  }

  if (error || !user) {
    return (
      <div className="alert alert-danger" role="alert">
        {error || 'User not found.'}
      </div>
    );
  }

  return (
    <AccountForm
      mode="edit"
      title={`Edit ${user.full_name}`}
      subtitle="Update account details and permissions for this user."
      initialValues={{
        fullName: user.full_name,
        email: user.email,
        avatarUrl: user.avatar_image_url,
        role: user.role
      }}
      submitLabel="Save changes"
      pendingLabel="Saving..."
      enableRoleSelection
      onSubmit={handleSubmit}
      backButton={{
        label: 'Back to dashboard',
        onClick: () => navigate('/admin')
      }}
    />
  );
};

export default AdminEditUserPage;
