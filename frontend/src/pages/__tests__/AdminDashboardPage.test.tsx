import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: {
      id: 1,
      role: 'admin',
      full_name: 'Admin User',
      email: 'admin@example.com',
      created_at: '',
      updated_at: ''
    }
  })
}));

vi.mock('@/api/users', () => {
  const fetchUsers = vi.fn();
  const updateUser = vi.fn();
  const deleteUser = vi.fn();
  const bulkCreateUsers = vi.fn();
  return {
    fetchUsers,
    updateUser,
    deleteUser,
    bulkCreateUsers
  };
});

vi.mock('@/services/actionCable', () => ({
  subscribeToChannel: vi.fn(() => ({ unsubscribe: vi.fn() })),
  disconnectConsumer: vi.fn()
}));

vi.mock('@/components/UsersCountCard', () => ({
  default: ({ counts }: { counts: { total: number } | null }) => (
    <div data-testid="users-count">{counts?.total ?? 0}</div>
  )
}));

vi.mock('@/components/UserTable', () => ({
  default: ({ users }: { users: Array<{ id: number; full_name: string }> }) => (
    <div data-testid="user-table">{users.map((user) => user.full_name).join(', ')}</div>
  )
}));

vi.mock('@/components/BulkImportProgress', () => ({
  default: () => <div data-testid="bulk-import-progress" />
}));

vi.mock('@/components/LoadingState', () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="loading-state">{message}</div>
  )
}));

import AdminDashboardPage from '../AdminDashboardPage';
import {
  fetchUsers as fetchUsersImport,
  updateUser as updateUserImport,
  deleteUser as deleteUserImport,
  bulkCreateUsers as bulkCreateUsersImport
} from '@/api/users';

const fetchUsersMock = vi.mocked(fetchUsersImport);
const updateUserMock = vi.mocked(updateUserImport);
const deleteUserMock = vi.mocked(deleteUserImport);
const bulkCreateUsersMock = vi.mocked(bulkCreateUsersImport);

const counts = {
  total: 25,
  admin: 5,
  non_admin: 20,
  updated_at: '2025-11-11T00:00:00Z'
};

const mockFetchUsersImplementation = ({
  page = 1,
  perPage = 20
}: { page?: number; perPage?: number } = {}) =>
  Promise.resolve({
    users: [{ id: page, full_name: `User Page ${page}`, email: '', role: 'admin', created_at: '', updated_at: '' }],
    counts,
    pagination: {
      page,
      perPage,
      totalPages: 3,
      totalCount: 25
    }
  });

beforeEach(() => {
  vi.clearAllMocks();
  fetchUsersMock.mockImplementation(mockFetchUsersImplementation);
});

describe('AdminDashboardPage', () => {
  it('loads users and shows pagination information', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(fetchUsersMock).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId('user-table')).toHaveTextContent('User Page 1');
    expect(screen.getByText(/Página 1 de 3/i)).toBeInTheDocument();
    expect(screen.getByText(/25 no total/)).toBeInTheDocument();
  });

  it('requests next page when clicking Next', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(fetchUsersMock).toHaveBeenCalledTimes(1));

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /próxima/i }));

    await waitFor(() => expect(fetchUsersMock).toHaveBeenCalledTimes(2));
    const [secondCallArgs] = fetchUsersMock.mock.calls[1];
    expect(secondCallArgs).toEqual({ page: 2, perPage: 20 });
    expect(screen.getByTestId('user-table')).toHaveTextContent('User Page 2');
  });

  it('updates per page selection', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => expect(fetchUsersMock).toHaveBeenCalledTimes(1));

    const user = userEvent.setup();

    await user.selectOptions(screen.getByRole('combobox'), '50');

    await waitFor(() => expect(fetchUsersMock).toHaveBeenCalledTimes(2));
    const [secondCallArgs] = fetchUsersMock.mock.calls[1];
    expect(secondCallArgs).toEqual({ page: 1, perPage: 50 });
  });
});

