import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import UserTable from '../UserTable';
import type { User } from '@/types/user';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  full_name: 'Alice Example',
  email: 'alice@example.com',
  role: 'admin',
  avatar_image_url: null,
  created_at: '',
  updated_at: '',
  ...overrides
});

describe('UserTable', () => {
  it('renders empty state when there are no users', () => {
    render(
      <UserTable
        users={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleRole={vi.fn()}
      />
    );

    expect(screen.getByText('Nenhum usuário criado ainda.')).toBeInTheDocument();
  });

  it('hides actions for the current user', () => {
    const user = buildUser();
    render(
      <UserTable
        users={[user]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleRole={vi.fn()}
        currentUserId={user.id}
      />
    );

    expect(screen.getByText('Sua conta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull();
  });

  it('invokes callbacks for edit, toggle, and delete', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onToggleRole = vi.fn();
    const onConfirmToggleRole = vi.fn();
    const user = buildUser({ role: 'non_admin', id: 42, full_name: 'Bob' });

    render(
      <UserTable
        users={[user]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleRole={onToggleRole}
        onConfirmToggleRole={onConfirmToggleRole}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith(user);

    fireEvent.click(screen.getByRole('button', { name: /tornar administrador/i }));
    expect(onConfirmToggleRole).toHaveBeenCalledWith(user, 'admin');
    expect(onToggleRole).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /excluir/i }));
    expect(onDelete).toHaveBeenCalledWith(user);
  });
});

