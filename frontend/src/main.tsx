// frontend/src/main.tsx
import './main.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import { ThemeContextProvider } from './app/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './layout/AppShell';
import { CoursesPage } from './pages/CoursesPage';
import { CourseViewPage } from './pages/CourseViewPage';
import { DashboardPage } from './pages/DashboardPage';
import { BitrixCallbackPage } from './pages/BitrixCallbackPage';
import { LoginPage } from './pages/LoginPage';
import { ResultsPage } from './pages/ResultsPage';
import { AdminPage } from './pages/admin/AdminPage';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/bitrix-callback" element={<BitrixCallbackPage />} />
              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="courses/:courseId" element={<CourseViewPage />} />
                <Route path="results" element={<ResultsPage />} />
                <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeContextProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
