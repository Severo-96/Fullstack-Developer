import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingState from '@/components/LoadingState';
import UsersCountCard from '@/components/UsersCountCard';
import UserTable from '@/components/UserTable';
import BulkImportProgress, {
  BulkImportState
} from '@/components/BulkImportProgress';
import {
  bulkCreateUsers,
  deleteUser,
  fetchUsers,
  updateUser
} from '@/api/users';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [bulkImportState, setBulkImportState] = useState<BulkImportState>(
    initialBulkImportState
  );
  const bulkImportSubscriptionRef = useRef<any>(null);

  const [pendingRoleChange, setPendingRoleChange] =
    useState<RoleChangeState>(null);

  const isCurrentUser = useMemo(
    () => (checkedUser: User) => user?.id === checkedUser.id,
    [user?.id]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { users: fetchedUsers, counts: fetchedCounts } =
          await fetchUsers();
        setUsers(fetchedUsers);
        setCounts(fetchedCounts);
      } catch (exception) {
        setError(
          exception instanceof Error
            ? exception.message
            : 'Unable to load users'
        );
      } finally {
        setLoading(false);
      }
    };

    void load();

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

  const refreshUsers = async () => {
    try {
      const { users: fetchedUsers, counts: fetchedCounts } = await fetchUsers();
      setUsers(fetchedUsers);
      setCounts(fetchedCounts);
    } catch (exception) {
      console.error('Failed to refresh users', exception);
    }
  };

  const handleEditNavigate = (target: User) => {
    navigate(`/admin/users/${target.id}/edit`);
  };

  const handleDelete = async (target: User) => {
    if (!window.confirm(`Delete ${target.full_name}?`)) {
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
          : 'Unable to delete user'
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
          : 'Unable to toggle role'
      );
    }
  };

  const handleBulkImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0) ?? null;
    setImportFile(file);
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      alert('Please select a CSV or spreadsheet file to import.');
      return;
    }

    if (!token) {
      alert('Missing authentication token.');
      return;
    }

    setBulkImportState({
      status: 'queued',
      processed: 0,
      total: 0,
      failed: 0,
      errors: [],
      message: 'Queued for processing'
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
            : 'Bulk import failed to start'
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
    return <LoadingState message="Loading admin dashboard..." />;
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
          <h1 className="h3 mb-1">User Administration</h1>
          <p className="text-muted mb-0">
            Manage all users, permissions and bulk imports
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/admin/users/new')}
          >
            Create user
          </button>
        </div>
      </div>

      <UsersCountCard counts={counts} />

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
            <div>
              <h2 className="h5 mb-1">Bulk import</h2>
              <p className="text-muted mb-0">
                Upload CSV or Excel spreadsheets to create users in batch
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
                Import
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
            <h2 className="h5 mb-0">All users</h2>
            <span className="badge bg-light text-dark border">
              {users.length} total
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
                <h5 className="modal-title">Confirm role change</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setPendingRoleChange(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to change <strong>{pendingRoleChange.user.full_name}</strong>'s role to <strong>{pendingRoleChange.nextRole === 'admin' ? 'Admin' : 'User'}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setPendingRoleChange(null)}
                >
                  Cancel
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
                  Confirm
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

