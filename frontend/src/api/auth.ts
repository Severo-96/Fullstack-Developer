import { request, RequestOptions } from './client';
import type { User } from '@/types/user';

interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  avatarFile?: File | null;
  avatarUrl?: string;
}

interface TokenResponse {
  token: string;
}

export const login = async (payload: LoginPayload) => {
  const body = JSON.stringify(payload);
  const response = await request<TokenResponse>('/login', {
    method: 'POST',
    body,
    skipAuth: true
  });
  return response.token;
};

export const register = async (payload: RegisterPayload) => {
  const formData = await buildRegisterFormData(payload);
  const response = await request<TokenResponse & { user: User }>('/register', {
    method: 'POST',
    body: formData,
    skipAuth: true
  } as RequestOptions);
  return response;
};

export const fetchCurrentUser = () =>
  request<User>('/me', {
    method: 'GET'
  });

interface UpdateProfilePayload {
  full_name?: string;
  email?: string;
  password?: string;
  avatarFile?: File | null;
  avatarUrl?: string;
}

export const updateProfile = async (payload: UpdateProfilePayload) => {
  const body = await buildProfileFormData(payload);
  return request<User>('/me', {
    method: 'PUT',
    body
  } as RequestOptions);
};

export const deleteProfile = () =>
  request<{ message: string }>('/me', {
    method: 'DELETE'
  });

async function buildRegisterFormData(payload: RegisterPayload) {
  const formData = new FormData();
  formData.append('full_name', payload.full_name);
  formData.append('email', payload.email);
  formData.append('password', payload.password);

  if (payload.avatarFile) {
    formData.append('avatar_image', payload.avatarFile);
  }

  return formData;
}

async function buildProfileFormData(payload: UpdateProfilePayload) {
  const formData = new FormData();
  if (payload.full_name) formData.append('user[full_name]', payload.full_name);
  if (payload.email) formData.append('user[email]', payload.email);
  if (payload.password) formData.append('user[password]', payload.password);

  if (payload.avatarFile) {
    formData.append('user[avatar_image]', payload.avatarFile);
  }

  return formData;
}

