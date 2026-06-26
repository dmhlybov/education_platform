import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../app/AuthContext';
import type { LoginResponse } from '../types';

export function BitrixCallbackPage() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');
    const code = params.get('code');

    if (errorParam) {
      setError(errorDescription || errorParam);
      return;
    }
    if (!code) {
      setError('Missing OAuth code');
      return;
    }

    apiFetch<LoginResponse>(`/api/auth/bitrix/callback?code=${encodeURIComponent(code)}`)
      .then((data) => loginWithToken(data.access_token))
      .then(() => navigate('/', { replace: true }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Ошибка авторизации');
      });
  }, []);

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3, backgroundColor: 'var(--app-bg)' }}>
        <Alert severity="error" sx={{ maxWidth: 480, width: '100%' }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate('/login', { replace: true })}>
          Вернуться к входу
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: 'var(--app-bg)' }}>
      <CircularProgress size={36} />
      <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.95rem' }}>
        Входим через Bitrix24…
      </Typography>
    </Box>
  );
}
