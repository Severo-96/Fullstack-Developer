import type { User } from '@/types/user';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleRole: (user: User) => void;
  onConfirmToggleRole?: (user: User, nextRole: 'admin' | 'non_admin') => void;
  currentUserId?: number | null;
}

const UserTable = ({
  users,
  onEdit,
  onDelete,
  onToggleRole,
  onConfirmToggleRole,
  currentUserId
}: UserTableProps) => {
  if (users.length === 0) {
    return (
      <div className="alert alert-secondary" role="alert">
        No users created yet.
      </div>
    );
  }

  const handleToggleClick = (user: User) => {
    const nextRole = user.role === 'admin' ? 'non_admin' : 'admin';

    if (onConfirmToggleRole) {
      onConfirmToggleRole(user, nextRole);
    } else {
      onToggleRole(user);
    }
  };

  return (
    <div className="table-responsive shadow-sm">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">Avatar</th>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Role</th>
            <th scope="col" className="text-end">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrent = currentUserId != null && user.id === currentUserId;
            return (
              <tr key={user.id}>
                <td>
                  {user.avatar_image_url ? (
                    <img
                      src={user.avatar_image_url}
                      alt={user.full_name}
                      className="rounded-circle border"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <div className="avatar-placeholder rounded-circle">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="fw-semibold">{user.full_name}</td>
                <td>{user.email}</td>
                <td>
                  <span
                    className={`badge ${
                      user.role === 'admin' ? 'bg-primary' : 'bg-secondary'
                    }`}
                  >
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="text-end">
                  {isCurrent ? (
                    <span className="badge bg-light text-dark border">
                      Your account
                    </span>
                  ) : (
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => onEdit(user)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => handleToggleClick(user)}
                      >
                        {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => onDelete(user)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;

