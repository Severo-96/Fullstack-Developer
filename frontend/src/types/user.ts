export type UserRole = 'admin' | 'non_admin';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsersCountSnapshot {
  total: number;
  admin: number;
  non_admin: number;
  updated_at: string;
}

export interface UserPayload {
  full_name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  avatar_image?: File | null;
}

