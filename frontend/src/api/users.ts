import { request, RequestOptions } from './client';
import type { User, UserPayload, UsersCountSnapshot, UserRole } from '@/types/user';
import type { BulkImportResponse } from '@/types/import';

interface UsersIndexResponse {
  users: User[];
  users_count: UsersCountSnapshot;
  pagination: {
    page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface UsersPagination {
  page: number;
  perPage: number;
  totalPages: number;
  totalCount: number;
}

export const fetchUsers = async (params?: { page?: number; perPage?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.perPage) searchParams.set('per_page', params.perPage.toString());

  const query = searchParams.toString();
  const path = `/admin/users${query ? `?${query}` : ''}`;

  const response = await request<UsersIndexResponse>(path, { method: 'GET' });

  const counts: UsersCountSnapshot = {
    total: response.users_count.total,
    admin: response.users_count.admin,
    non_admin: response.users_count.non_admin,
    updated_at: response.users_count.updated_at ?? new Date().toISOString()
  };

  const totalPages = Math.max(response.pagination.total_pages, 1);
  const currentPage = Math.max(1, Math.min(response.pagination.page, totalPages));

  const pagination: UsersPagination = {
    page: currentPage,
    perPage: response.pagination.per_page,
    totalPages,
    totalCount: response.pagination.total_count
  };

  return { users: response.users, counts, pagination };
};

export const fetchUser = (id: number) =>
  request<User>(`/admin/users/${id}`, {
    method: 'GET'
  });

export const createUser = async (
  payload: Omit<UserPayload, 'role' | 'password'> & {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
  }
) => {
  const body = await buildUserFormData(payload);
  return request<User>(
    '/admin/users',
    {
      method: 'POST',
      body
    } as RequestOptions
  );
};

export const updateUser = async (
  id: number,
  payload: UserPayload
) => {
  const body = await buildUserFormData(payload);
  return request<User>(
    `/admin/users/${id}`,
    {
      method: 'PUT',
      body
    } as RequestOptions
  );
};

export const deleteUser = (id: number) =>
  request<{ message: string }>(`/admin/users/${id}`, {
    method: 'DELETE'
  });

export const bulkCreateUsers = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return request<BulkImportResponse>('/admin/users/bulk', {
    method: 'POST',
    body: formData
  } as RequestOptions);
};

async function buildUserFormData(payload: UserPayload) {
  const formData = new FormData();

  if (payload.full_name) formData.append('user[full_name]', payload.full_name);
  if (payload.email) formData.append('user[email]', payload.email);
  if (payload.password) formData.append('user[password]', payload.password);
  if (payload.role) formData.append('user[role]', payload.role);

  if (payload.avatar_image) {
    formData.append('user[avatar_image]', payload.avatar_image);
  }

  return formData;
}
