import { describe, expect, it, vi, beforeEach } from 'vitest';
vi.mock('../client', () => ({
  request: vi.fn()
}));
import { request } from '../client';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkCreateUsers
} from '../users';
import type { UsersPagination } from '../users';
import type { User } from '@/types/user';

const mockRequest = vi.mocked(request);

describe('api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchUsers retrieves users and pagination without params', async () => {
    const backendResponse = {
      users: [
        { id: 1, full_name: 'Alice', email: 'alice@example.com', role: 'admin', created_at: '', updated_at: '' }
      ] satisfies User[],
      users_count: {
        total: 5,
        admin: 2,
        non_admin: 3,
        updated_at: '2025-11-11T12:00:00Z'
      },
      pagination: {
        page: 1,
        per_page: 20,
        total_pages: 3,
        total_count: 5
      }
    };

    mockRequest.mockResolvedValueOnce(backendResponse);

    const { users, counts, pagination } = await fetchUsers();

    expect(mockRequest).toHaveBeenCalledWith('/admin/users', { method: 'GET' });
    expect(users).toEqual(backendResponse.users);
    expect(counts).toEqual(backendResponse.users_count);
    expect(pagination).toEqual<UsersPagination>({
      page: 1,
      perPage: 20,
      totalPages: 3,
      totalCount: 5
    });
  });

  it('fetchUsers clamps pagination values and fills missing timestamps', async () => {
    mockRequest.mockResolvedValueOnce({
      users: [],
      users_count: {
        total: 0,
        admin: 0,
        non_admin: 0
      },
      pagination: {
        page: 5,
        per_page: 10,
        total_pages: 0,
        total_count: 0
      }
    });

    const { counts, pagination } = await fetchUsers({ page: 5, perPage: 10 });

    expect(mockRequest).toHaveBeenCalledWith('/admin/users?page=5&per_page=10', {
      method: 'GET'
    });
    expect(counts.updated_at).toBeDefined();
    expect(pagination).toEqual<UsersPagination>({
      page: 1,
      perPage: 10,
      totalPages: 1,
      totalCount: 0
    });
  });

  it('createUser submits multipart payload with required fields', async () => {
    mockRequest.mockResolvedValueOnce({ id: 99 });
    const avatar = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    await createUser({
      full_name: 'Bob',
      email: 'bob@example.com',
      password: 'password123',
      role: 'non_admin',
      avatar_image: avatar
    });

    expect(mockRequest).toHaveBeenCalledWith('/admin/users', expect.any(Object));
    const options = mockRequest.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);

    const entries = Array.from((options.body as FormData).entries());
    expect(entries).toEqual([
      ['user[full_name]', 'Bob'],
      ['user[email]', 'bob@example.com'],
      ['user[password]', 'password123'],
      ['user[role]', 'non_admin'],
      ['user[avatar_image]', avatar]
    ]);
  });

  it('updateUser only sends provided attributes', async () => {
    mockRequest.mockResolvedValueOnce({ id: 42 });

    await updateUser(42, {
      email: 'updated@example.com'
    });

    expect(mockRequest).toHaveBeenCalledWith('/admin/users/42', expect.any(Object));
    const options = mockRequest.mock.calls[0][1] as RequestInit;
    const entries = Array.from((options.body as FormData).entries());
    expect(entries).toEqual([['user[email]', 'updated@example.com']]);
  });

  it('deleteUser calls admin endpoint', async () => {
    mockRequest.mockResolvedValueOnce({ message: 'ok' });

    await deleteUser(7);

    expect(mockRequest).toHaveBeenCalledWith('/admin/users/7', {
      method: 'DELETE'
    });
  });

  it('bulkCreateUsers uploads file to admin endpoint', async () => {
    mockRequest.mockResolvedValueOnce({ import_id: '123', actor_id: '1', status: 'queued' });
    const file = new File(['csv'], 'users.csv', { type: 'text/csv' });

    await bulkCreateUsers(file);

    expect(mockRequest).toHaveBeenCalledWith('/admin/users/bulk', expect.any(Object));
    const options = mockRequest.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe('POST');
    const entries = Array.from((options.body as FormData).entries());
    expect(entries).toEqual([['file', file]]);
  });
});

