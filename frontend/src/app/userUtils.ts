import type { Student, User } from '../types';

export function userDisplayName(user?: User | null): string {
  if (!user) return '';
  const full = [user.first_name, user.second_name].filter(Boolean).join(' ').trim();
  return full || user.email;
}

export function userFirstName(user?: User | null): string {
  return user?.first_name?.trim() || 'Привет';
}

export function studentDisplayName(s: Student): string {
  const full = [s.first_name, s.second_name].filter(Boolean).join(' ').trim();
  return full || s.email;
}
