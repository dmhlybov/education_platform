import { apiFetch } from './client';
import type { CourseDetail, CourseResults, CourseSummary, CreateCoursePayload, QuizResult } from '../types';

export const getCourses = () => apiFetch<CourseSummary[]>('/api/courses');
export const getCourse = (courseId: number) => apiFetch<CourseDetail>(`/api/courses/${courseId}`);
export const getCourseResults = (courseId: number) => apiFetch<CourseResults>(`/api/courses/${courseId}/results`);
export const createCourse = (payload: CreateCoursePayload) =>
  apiFetch<CourseSummary>('/api/courses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const updateCourse = (courseId: number, payload: CreateCoursePayload) =>
  apiFetch<CourseSummary>(`/api/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
export const deleteCourse = (courseId: number) =>
  apiFetch<void>(`/api/courses/${courseId}`, { method: 'DELETE' });

export const assignCourse = (courseId: number, userId: number) =>
  apiFetch<{ status: string }>(`/api/courses/${courseId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId })
  });
export const submitQuiz = (quizId: number, answers: { question_id: number; selected_option_ids: number[] }[]) =>
  apiFetch<QuizResult>(`/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers })
  });

export async function uploadScorm(file: File, token: string) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/uploads/scorm', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(await response.text() || 'Upload failed');
  }
  return response.json() as Promise<{ url: string; title: string; package: string }>;
}

export async function uploadMedia(file: File, token: string) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/uploads/document', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) throw new Error(await response.text() || 'Upload failed');
  return response.json() as Promise<{ url: string; filename: string }>;
}

export async function uploadDocument(file: File, token: string) {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/uploads/document', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(await response.text() || 'Upload failed');
  }
  return response.json() as Promise<{ url: string; filename: string }>;
}
