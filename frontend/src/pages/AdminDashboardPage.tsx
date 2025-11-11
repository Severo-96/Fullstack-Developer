import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingState from '@/components/LoadingState';
import UsersCountCard from '@/components/UsersCountCard';
import UserTable from '@/components/UserTable';
import BulkImportProgress, {
  BulkImportState
} from '@/components/BulkImportProgress';
import { bulkCreateUsers, deleteUser, fetchUsers, updateUser, UsersPagination } from '@/api/users';
import type { User, UsersCountSnapshot } from '@/types/user';
import type { BulkImportMessage } from '@/types/import';
import {
  disconnectConsumer,
  subscribeToChannel
} from '@/services/actionCable';
import {
  deriveBulkImportState,
  initialBulkImportState
} from '@/utils/bulkImport';

type RoleChangeState = {
  user: User;
  nextRole: 'admin' | 'non_admin';
} | null;

const AdminDashboardPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [counts, setCounts] = useState<UsersCountSnapshot | null>(null);
  const [pagination, setPagination] = useState<UsersPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [bulkImportState, setBulkImportState] = useState<BulkImportState>(
    initialBulkImportState
  );
  const bulkImportSubscriptionRef = useRef<any>(null);
  const isInitialLoadRef = useRef(true);

  const [pendingRoleChange, setPendingRoleChange] =
    useState<RoleChangeState>(null);

  const isCurrentUser = useMemo(
    () => (checkedUser: User) => user?.id === checkedUser.id,
    [user?.id]
  );

  const loadUsers = useCallback(
    async (options?: { suppressLoading?: boolean }) => {
      const showLoading = !options?.suppressLoading;

      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      try {
        const {
          users: fetchedUsers,
          counts: fetchedCounts,
          pagination: fetchedPagination
        } = await fetchUsers({ page, perPage });

        const safeTotalPages = Math.max(fetchedPagination.totalPages, 1);
        const adjustedPagination: UsersPagination = {
          ...fetchedPagination,
          totalPages: safeTotalPages,
          page: Math.min(fetchedPagination.page, safeTotalPages)
        };

        setUsers(fetchedUsers);
        setCounts(fetchedCounts);
        setPagination(adjustedPagination);

        if (page > safeTotalPages) {
          setPage(safeTotalPages);
        }
      } catch (exception) {
        const message =
          exception instanceof Error ? exception.message : 'Não foi possível carregar os usuários';
        setError(message);
        if (options?.suppressLoading) {
          console.error(message, exception);
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [page, perPage]
  );

  useEffect(() => {
    const suppressLoading = !isInitialLoadRef.current;
    void loadUsers({ suppressLoading });
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
    }
  }, [loadUsers]);

  useEffect(() => {
    return () => {
      bulkImportSubscriptionRef.current?.unsubscribe();
      disconnectConsumer();
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const subscription = subscribeToChannel(
      token,
      { channel: 'UsersCountChannel' },
      {
        received: (data: UsersCountSnapshot) => {
          setCounts({
            ...data,
            updated_at: data.updated_at || new Date().toISOString()
          });
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [token]);

  const refreshUsers = useCallback(async () => {
    await loadUsers({ suppressLoading: true });
  }, [loadUsers]);

  const effectiveTotalPages = pagination ? Math.max(pagination.totalPages, 1) : 1;
  const currentPageDisplay = Math.min(page, effectiveTotalPages);
  const pageStart =
    pagination && pagination.totalCount > 0
      ? (currentPageDisplay - 1) * pagination.perPage + 1
      : 0;
  const pageEnd =
    pagination && pagination.totalCount > 0
      ? Math.min(pageStart + pagination.perPage - 1, pagination.totalCount)
      : 0;

  const handlePerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = Number(event.target.value);
    if (Number.isNaN(nextValue) || nextValue <= 0) return;
    setPerPage(nextValue);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, effectiveTotalPages));
    if (safePage !== page) {
      setPage(safePage);
    }
  };

  const handleEditNavigate = (target: User) => {
    navigate(`/admin/users/${target.id}/edit`);
  };

  const handleDelete = async (target: User) => {
    if (!window.confirm(`Excluir ${target.full_name}?`)) {
      return;
    }

    try {
      await deleteUser(target.id);
      setUsers((prev) => prev.filter((item) => item.id !== target.id));
      void refreshUsers();
    } catch (exception) {
      alert(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível excluir o usuário'
      );
    }
  };

  const handleToggleRole = async (
    target: User,
    nextRole?: 'admin' | 'non_admin'
  ) => {
    const roleToApply = nextRole ?? (target.role === 'admin' ? 'non_admin' : 'admin');
    try {
      const updated = await updateUser(target.id, {
        role: roleToApply,
        full_name: target.full_name,
        email: target.email,
        avatar_image: undefined
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      await refreshUsers();
    } catch (exception) {
      alert(
        exception instanceof Error
          ? exception.message
          : 'Não foi possível alterar a função'
      );
    }
  };

  const handleBulkImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0) ?? null;
    setImportFile(file);
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      alert('Selecione um arquivo CSV ou planilha para importar.');
      return;
    }

    if (!token) {
      alert('Token de autenticação não encontrado.');
      return;
    }

    setBulkImportState({
      status: 'queued',
      processed: 0,
      total: 0,
      failed: 0,
      errors: [],
      message: 'Na fila para processamento'
    });

    try {
      const response = await bulkCreateUsers(importFile);
      bulkImportSubscriptionRef.current?.unsubscribe();
      bulkImportSubscriptionRef.current = subscribeToChannel(
        token,
        {
          channel: 'BulkImportChannel',
          import_id: response.import_id,
          actor_id: response.actor_id
        },
        {
          received: (message: BulkImportMessage) => {
            setBulkImportState((prev) => {
              const next = deriveBulkImportState(prev, message);
              if (
                message.event === 'finished' ||
                message.event === 'failed'
              ) {
                void refreshUsers();
              }
              return next;
            });
          }
        }
      );
    } catch (exception) {
      setBulkImportState({
        status: 'failed',
        processed: 0,
        total: 0,
        failed: 0,
        errors: [],
        message:
          exception instanceof Error
            ? exception.message
            : 'Não foi possível iniciar a importação em massa'
      });
    }
  };

  const resetBulkImportState = () => {
    bulkImportSubscriptionRef.current?.unsubscribe();
    bulkImportSubscriptionRef.current = null;
    setBulkImportState(initialBulkImportState);
    setImportFile(null);
  };

  if (loading) {
    return <LoadingState message="Carregando painel administrativo..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Administração de usuários</h1>
          <p className="text-muted mb-0">
            Gerencie todos os usuários, permissões e importações em massa
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/admin/users/new')}
          >
            Criar usuário
          </button>
        </div>
      </div>

      <UsersCountCard counts={counts} />

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
            <div>
              <h2 className="h5 mb-1">Importação em massa</h2>
              <p className="text-muted mb-0">
                Envie planilhas CSV ou Excel para criar usuários em lote
              </p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <input
                type="file"
                accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="form-control"
                onChange={handleBulkImportFileChange}
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleBulkImport}
                disabled={!importFile}
              >
                Importar
              </button>
            </div>
          </div>
          <BulkImportProgress
            state={bulkImportState}
            onReset={resetBulkImportState}
          />
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-3">
              <h2 className="h5 mb-0">Todos os usuários</h2>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  void loadUsers({ suppressLoading: true });
                }}
                title="Atualizar lista de usuários"
              >
                Atualizar lista
              </button>
            </div>
            <span className="badge bg-light text-dark border">
              {pagination?.totalCount ?? counts?.total ?? users.length} no total
            </span>
          </div>
          <UserTable
            users={users}
            onEdit={handleEditNavigate}
            onDelete={handleDelete}
            onToggleRole={(candidate) => {
              setPendingRoleChange({
                user: candidate,
                nextRole: candidate.role === 'admin' ? 'non_admin' : 'admin'
              });
            }}
            onConfirmToggleRole={(candidate, nextRole) => {
              setPendingRoleChange({ user: candidate, nextRole });
            }}
            currentUserId={user?.id ?? null}
          />
          {pagination && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mt-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Linhas por página:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={perPage}
                  onChange={handlePerPageChange}
                >
                  {[10, 20, 50, 100].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
                {pagination.totalCount > 0 && (
                  <span className="text-muted small">
                    Mostrando {pageStart}-{pageEnd} de {pagination.totalCount}
                  </span>
                )}
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">
                    Página {currentPageDisplay} de {effectiveTotalPages}
                  </span>
                  <div className="btn-group" role="group" aria-label="Controles de paginação">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handlePageChange(currentPageDisplay - 1)}
                      disabled={currentPageDisplay <= 1}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handlePageChange(currentPageDisplay + 1)}
                      disabled={
                        pagination.totalCount === 0 ||
                        currentPageDisplay >= effectiveTotalPages
                      }
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {pendingRoleChange && (
        <div className="modal-backdrop show" />
      )}
      {pendingRoleChange && (
        <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar alteração de função</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setPendingRoleChange(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Tem certeza de que deseja alterar a função de <strong>{pendingRoleChange.user.full_name}</strong> para <strong>{pendingRoleChange.nextRole === 'admin' ? 'Administrador' : 'Usuário'}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setPendingRoleChange(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    if (pendingRoleChange) {
                      await handleToggleRole(
                        pendingRoleChange.user,
                        pendingRoleChange.nextRole
                      );
                    }
                    setPendingRoleChange(null);
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;

