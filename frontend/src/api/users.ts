import { request, RequestOptions } from './client';
import type { User, UserPayload, UsersCountSnapshot } from '@/types/user';
import type { BulkImportResponse } from '@/types/import';
import { fetchImageAsFile } from '@/utils/file';

interface UsersIndexResponse {
  users: User[];
  users_count: {
    total: number;
    admin: number;
    non_admin: number;
  };
}

export const fetchUsers = async () => {
  const response = await request<UsersIndexResponse>('/users', {
    method: 'GET'
  });

  const counts: UsersCountSnapshot = {
    total: response.users_count.total,
    admin: response.users_count.admin,
    non_admin: response.users_count.non_admin,
    updated_at: new Date().toISOString()
  };

  return { users: response.users, counts };
};

export const fetchUser = (id: number) =>
  request<User>(`/users/${id}`, {
    method: 'GET'
  });

export const createUser = async (
  payload: Required<UserPayload> & { avatarUrl?: string | null }
) => {
  const body = await buildUserFormData(payload);
  return request<User>(
    '/users',
    {
      method: 'POST',
      body
    } as RequestOptions
  );
};

export const updateUser = async (
  id: number,
  payload: UserPayload & { avatarUrl?: string | null }
) => {
  const body = await buildUserFormData(payload);
  return request<User>(
    `/users/${id}`,
    {
      method: 'PUT',
      body
    } as RequestOptions
  );
};

export const deleteUser = (id: number) =>
  request<{ message: string }>(`/users/${id}`, {
    method: 'DELETE'
  });

export const bulkCreateUsers = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return request<BulkImportResponse>('/users/bulk_create', {
    method: 'POST',
    body: formData
  } as RequestOptions);
};

async function buildUserFormData(
  payload: UserPayload & { avatarUrl?: string | null }
) {
  const formData = new FormData();

  if (payload.full_name) formData.append('user[full_name]', payload.full_name);
  if (payload.email) formData.append('user[email]', payload.email);
  if (payload.password) formData.append('user[password]', payload.password);
  if (payload.role) formData.append('user[role]', payload.role);

  const avatar = await resolveAvatar(payload.avatar_image, payload.avatarUrl);
  if (avatar) {
    formData.append('user[avatar_image]', avatar);
  }

  return formData;
}

async function resolveAvatar(
  avatarFile?: File | null,
  avatarUrl?: string | null
) {
  if (avatarFile) return avatarFile;

  if (avatarUrl) {
    return fetchImageAsFile(avatarUrl);
  }

  return null;
}

