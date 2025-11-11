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
            : 'Não foi possível carregar os detalhes do usuário'
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
      avatar_image: avatarFile ?? undefined
    });

    navigate('/admin', { replace: true });
  };

  if (loading) {
    return <LoadingState message="Carregando usuário..." />;
  }

  if (error || !user) {
    return (
      <div className="alert alert-danger" role="alert">
        {error || 'Usuário não encontrado.'}
      </div>
    );
  }

  return (
    <AccountForm
      mode="edit"
      title={`Editar ${user.full_name}`}
      subtitle="Atualize os dados e as permissões deste usuário."
      initialValues={{
        fullName: user.full_name,
        email: user.email,
        avatarUrl: user.avatar_image_url,
        role: user.role
      }}
      submitLabel="Salvar alterações"
      pendingLabel="Salvando..."
      enableRoleSelection
      onSubmit={handleSubmit}
      backButton={{
        label: 'Voltar para o painel',
        onClick: () => navigate('/admin')
      }}
    />
  );
};

export default AdminEditUserPage;
