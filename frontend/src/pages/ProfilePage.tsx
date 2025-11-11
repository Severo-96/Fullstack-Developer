import { useEffect } from 'react';
import LoadingState from '@/components/LoadingState';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const defaultAvatarUrl = '/images/default-avatar.svg';

const ProfilePage = () => {
  const { user, refreshCurrentUser, isLoading, deleteAccount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      void refreshCurrentUser();
    }
  }, [isLoading, refreshCurrentUser]);

  if (isLoading || !user) {
    return <LoadingState message="Carregando perfil..." />;
  }

  const formattedCreatedAt = new Date(user.created_at).toLocaleString();
  const formattedUpdatedAt = new Date(user.updated_at).toLocaleString();

  const handleEdit = () => {
    navigate('/profile/edit');
  };

  const handleDelete = async () => {
    if (!window.confirm('Isso excluirá sua conta permanentemente. Continuar?')) {
      return;
    }

    try {
      await deleteAccount();
      navigate('/register', { replace: true });
    } catch (error) {
      console.error('Falha ao excluir a conta', error);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-lg-row align-items-start gap-4">
              <div className="flex-grow-1">
                <h1 className="h3 mb-4">Perfil</h1>
                <dl className="row mb-4">
                  <dt className="col-sm-4 text-muted">Nome completo</dt>
                  <dd className="col-sm-8">{user.full_name}</dd>

                  <dt className="col-sm-4 text-muted">E-mail</dt>
                  <dd className="col-sm-8">{user.email}</dd>

                  <dt className="col-sm-4 text-muted">Função</dt>
                  <dd className="col-sm-8">
                    {user.role === 'admin' ? 'Administrador' : 'Usuário padrão'}
                  </dd>

                  <dt className="col-sm-4 text-muted">Conta criada</dt>
                  <dd className="col-sm-8">{formattedCreatedAt}</dd>

                  <dt className="col-sm-4 text-muted">Última atualização</dt>
                  <dd className="col-sm-8">{formattedUpdatedAt}</dd>
                </dl>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-primary" onClick={handleEdit}>
                    Editar perfil
                  </button>
                  <button type="button" className="btn btn-outline-danger" onClick={handleDelete}>
                    Excluir conta
                  </button>
                </div>
              </div>

              <div className="text-center w-100 w-lg-auto">
                <h2 className="h5 mb-3">Avatar do perfil</h2>
                <img
                  src={user.avatar_image_url || defaultAvatarUrl}
                  alt={user.full_name}
                  className="rounded-circle border shadow-sm register-avatar-preview"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

