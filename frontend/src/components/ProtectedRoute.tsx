import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  adminOnly?: boolean;
};

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Stack minHeight="100vh" alignItems="center" justifyContent="center" spacing={2} aria-busy="true" aria-live="polite" aria-atomic="true" role="status">
        <CircularProgress />
        <Alert icon={false} severity="info" sx={{ maxWidth: 420 }}>
          <Stack spacing={0.5}>
            <Typography fontWeight={700}>Проверяем доступ</Typography>
            <Typography variant="body2" color="text.secondary">Ещё немного, и откроем нужный раздел.</Typography>
          </Stack>
        </Alert>
      </Stack>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && !user.is_admin) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          accessDenied: {
            title: 'Нет доступа к разделу администрирования',
            message: 'Этот раздел доступен только администраторам. Вы вошли как ученик, поэтому мы вернули вас на главную страницу.',
          },
        }}
      />
    );
  }

  return <>{children}</>;
}
