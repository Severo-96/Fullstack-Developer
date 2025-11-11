import type { UsersCountSnapshot } from '@/types/user';

interface UsersCountCardProps {
  counts: UsersCountSnapshot | null;
}

const UsersCountCard = ({ counts }: UsersCountCardProps) => {
  if (!counts) {
    return (
      <div className="alert alert-info mb-4" role="alert">
        Aguardando estatísticas de usuários...
      </div>
    );
  }

  return (
    <div className="row g-3 mb-4">
      <div className="col-md-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h6 className="card-subtitle text-muted">Total de usuários</h6>
            <p className="display-6 fw-bold mb-0">{counts.total}</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h6 className="card-subtitle text-muted">Administradores</h6>
            <p className="display-6 fw-bold mb-0 text-primary">{counts.admin}</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h6 className="card-subtitle text-muted">Usuários padrão</h6>
            <p className="display-6 fw-bold mb-0 text-secondary">
              {counts.non_admin}
            </p>
          </div>
        </div>
      </div>
      <div className="col-12 text-end text-muted small">
        Atualizado às {new Date(counts.updated_at).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default UsersCountCard;

