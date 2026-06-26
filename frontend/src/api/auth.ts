import { apiFetch } from './client';
import type { CreateUserPayload, LoginResponse, Student, User } from '../types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || 'Login failed');
  }
  return response.json() as Promise<LoginResponse>;
}

export const getMe = () => apiFetch<User>('/api/auth/user/me');

export const getStudents = () => apiFetch<Student[]>('/api/auth/user/get_all');

export const createUser = (payload: CreateUserPayload) =>
  apiFetch<{ detail: string }>('/api/auth/user/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });


export const linkBitrix = (userId: number, bitrixUserId: string | null) =>
  apiFetch<{ detail: string }>(`/api/auth/user/link-bitrix/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ bitrix_user_id: bitrixUserId || null }),
  });

export const switchActive = (id: number) =>
  apiFetch<{ detail: string }>(`/api/auth/user/switch_active/${id}`, { method: 'POST' });

export const switchSuperuser = (id: number) =>
  apiFetch<{ detail: string }>(`/api/auth/user/switch_superuser/${id}`, { method: 'POST' });

export const changePassword = (id: number, newPassword: string) =>
  apiFetch<{ detail: string }>(`/api/auth/user/change_password/${id}`, {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword }),
  });

export const adminLoginAs = (id: number) =>
  apiFetch<{ access_token: string; token_type: string }>(`/api/auth/user/admin_login/${id}`, {
    method: 'POST',
  });

export const handleBitrixLogin = () => {
  window.location.href = '/api/auth/bitrix/login';
};