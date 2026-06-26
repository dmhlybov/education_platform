import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { handleBitrixLogin } from '../api/auth';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;





export function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const statusId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldErrors = useMemo(() => ({
    email: !email.trim() ? 'Введите email.' : !emailPattern.test(email.trim()) ? 'Формат: name@example.com' : '',
    password: !password ? 'Введите пароль.' : '',
  }), [email, password]);

  const hasFieldErrors = Boolean(fieldErrors.email || fieldErrors.password);
  const canSubmit = !isSubmitting && !loading;
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const redirectTarget = fromPath && fromPath !== '/login' ? fromPath : '/';

  useEffect(() => {
    if (!loading && user) navigate(redirectTarget, { replace: true });
  }, [loading, navigate, redirectTarget, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setTouched({ email: true, password: true });
    setSubmitError('');
    if (hasFieldErrors) return;
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTarget, { replace: true });
    } catch {
      setSubmitError('Неверный email или пароль. Проверьте данные и попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--app-bg)',
        backgroundImage: `
          radial-gradient(ellipse 70% 60% at 15% 50%, rgba(79,142,247,0.09) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 20%, rgba(228,240,96,0.04) 0%, transparent 50%)
        `,
      }}
    >
      <Grid container sx={{ minHeight: '100vh', width: '100%' }}>
        {/* Left — hero */}
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { md: 6, lg: 8 },
            borderRight: '1px solid var(--app-border)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative glow */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              width: 600,
              height: 600,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(79,142,247,0.07) 0%, transparent 70%)',
              top: -200,
              left: -100,
              pointerEvents: 'none',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: 'var(--app-text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Learning
              <Box component="span" sx={{ color: 'var(--app-color-primary)' }}>.</Box>
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                color: 'var(--app-text-muted)',
                textTransform: 'uppercase',
                mb: 2,
              }}
            >
              Учебный портал
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 800,
                fontSize: { md: '3.5rem', lg: '4.5rem' },
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
                color: 'var(--app-text-primary)',
                mb: 3,
              }}
            >
              Обучение,<br />
              которое<br />
              <Box component="span" sx={{ color: 'var(--app-color-primary)' }}>работает.</Box>
            </Typography>
            <Typography
              sx={{
                fontSize: '1rem',
                color: 'var(--app-text-secondary)',
                lineHeight: 1.7,
                maxWidth: 420,
              }}
            >
              Курсы, тесты и результаты в одном месте.
              Войдите, чтобы продолжить обучение.
            </Typography>
          </Box>

          <Stack direction="row" spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
            {['Курсы', 'Тесты', 'Результаты', 'Администрирование'].map((item) => (
              <Typography
                key={item}
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  color: 'var(--app-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {item}
              </Typography>
            ))}
          </Stack>
        </Grid>

        {/* Right — form */}
        <Grid
          size={{ xs: 12, md: 5 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 3, sm: 4, md: 5, lg: 6 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 380 }}>
            {/* Mobile logo */}
            <Typography
              sx={{
                display: { md: 'none' },
                fontFamily: '"Syne", sans-serif',
                fontWeight: 800,
                fontSize: '1.3rem',
                color: 'var(--app-text-primary)',
                letterSpacing: '-0.02em',
                mb: 4,
              }}
            >
              Learning
              <Box component="span" sx={{ color: 'var(--app-color-primary)' }}>.</Box>
            </Typography>

            <Stack spacing={0.5} sx={{ mb: 3.5 }}>
              <Typography
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  color: 'var(--app-color-primary)',
                  textTransform: 'uppercase',
                }}
              >
                Вход в аккаунт
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Syne", sans-serif',
                  fontWeight: 700,
                  fontSize: '1.75rem',
                  letterSpacing: '-0.025em',
                  color: 'var(--app-text-primary)',
                  lineHeight: 1.1,
                }}
              >
                Войти
              </Typography>
            </Stack>




            <Stack
              component="form"
              spacing={2}
              onSubmit={onSubmit}
              aria-busy={isSubmitting || loading}
              noValidate
            >
              {submitError && (
                <Box id={statusId} aria-live="polite" aria-atomic="true">
                  <Alert severity="error" icon={<LockRoundedIcon />} sx={{ fontSize: '0.82rem' }}>
                    {submitError}
                  </Alert>
                </Box>
              )}

              {(isSubmitting || loading) && !submitError && (
                <Box id={statusId} aria-live="polite" aria-atomic="true">
                  <Alert severity="info" icon={<CircularProgress size={16} color="inherit" />} sx={{ fontSize: '0.82rem' }}>
                    {isSubmitting ? 'Входим в аккаунт…' : 'Проверяем сессию…'}
                  </Alert>
                </Box>
              )}

              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                fullWidth
                required
                disabled={!canSubmit}
                placeholder="name@example.com"
                error={touched.email && Boolean(fieldErrors.email)}
                helperText={touched.email ? fieldErrors.email || ' ' : ' '}
              />

              <TextField
                label="Пароль"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                fullWidth
                required
                disabled={!canSubmit}
                error={touched.password && Boolean(fieldErrors.password)}
                helperText={touched.password ? fieldErrors.password || ' ' : ' '}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={!canSubmit}
                startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                sx={{ mt: 0.5, minHeight: 48, fontSize: '0.95rem' }}
              >
                {isSubmitting ? 'Входим…' : 'Войти'}
              </Button>

              <div className="login-divider">или</div>

              <div className="login-bitrix-wrap">
                <button type="button" className="login-bitrix-btn" onClick={handleBitrixLogin} title="Войти через Bitrix24" aria-label="Войти через Bitrix24">
                  <svg width="256px" height="256px" viewBox="0 0 1024.00 1024.00" xmlns="http://www.w3.org/2000/svg" fill="#aa7b7b00" transform="rotate(0)matrix(1, 0, 0, 1, 0, 0)" stroke="#000000" stroke-width="0.01024">
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="6.144"></g>
                    <g id="SVGRepo_iconCarrier">
                      <circle cx="512" cy="512" r="512" style={{ "fill": "#2fc7f7" }}></circle>
                      <path d="M877 499.07h-22v-22h-5.91V505H877zM852.07 543A43.93 43.93 0 1 1 896 499.07 44.17 44.17 0 0 1 852.07 543zm0-79.83a35.9 35.9 0 1 0 35.9 35.9 35.87 35.87 0 0 0-35.9-35.9zm-84.48 59.56v-70.12h-14.78l-56.18 73.07v13.94h50.69v27.88h20.27v-27.88h16.9v-16.9zm-20.27-16.47v16.04H733.8c-4.22 0-11.83.42-14.36.42l28.72-38.86c0 3.38-.84 13.52-.84 22.39zm-132.21 60.82h79v-17.32h-52.39c7.18-28.72 51.11-35.06 51.11-67.16 0-17.32-11.83-30-36.33-30a85.18 85.18 0 0 0-38 9.29L624 478c8.45-3.8 17.74-7.6 29.14-7.6 9.29 0 17.74 3.8 17.74 14.36.41 23.6-51.12 25.29-55.77 82.32zm-76.45-46.89-33.79-46.46h24.5l22 30.41 22.39-30.41h24.5L564 520.19l34.64 46.89h-24.5l-22.39-31.26-22.81 31.26h-24.5zm-73.92-75.61a14.36 14.36 0 0 1 28.72 0c0 7.6-6.34 13.94-14.78 13.94s-13.94-5.91-13.94-13.94zm2.53 29.14h23.65v93.35h-23.64zm-73.5 0h20.27l2.53 10.56c8.45-8.45 16.05-12.67 25.77-12.67a24.76 24.76 0 0 1 13.09 3.8L447 495.27a20.08 20.08 0 0 0-10.56-3c-6.34 0-11.4 2.53-19 9.29v65.94h-23.66zm-124.6-29.14a14.24 14.24 0 0 1 14.36-14.36c8 0 14.78 5.91 14.78 14.36 0 7.6-6.34 13.94-14.78 13.94s-14.36-5.91-14.36-13.94zm2.53 29.14h23.65v93.35h-23.64zm55.3 70.55v-52h-16.9v-18.54H327v-21.54l23.65-6.76v28.3H379l-5.91 18.59H350.7v46c0 8.87 3 11.83 9.29 11.83a26.42 26.42 0 0 0 14.36-4.65l7.18 16.05c-6.76 4.65-18.16 7.18-27.46 7.18-16.89.46-27.07-8.84-27.07-24.46zM164 437h38c27.88 0 40.55 16.05 40.55 32.95 0 11.4-5.49 21.54-15.63 27v.42c15.21 3.8 24.5 16.05 24.5 31.26 0 20.27-15.21 38.44-45.62 38.44H164zm35.06 54.49c13.09 0 20.27-7.18 20.27-17.32 0-9.71-6.34-17.32-20.27-17.32h-11v34.64zm3.8 56.18c15.63 0 24.5-5.91 24.5-19 0-11-8.45-17.74-21.54-17.74h-17.74v36.75z" style={{ "fill": "#fff" }}></path>
                    </g>
                  </svg>
                </button>
              </div>
            </Stack>

            <Typography
              sx={{
                mt: 3,
                fontSize: '0.78rem',
                color: 'var(--app-text-muted)',
                lineHeight: 1.6,
              }}
            >
              Используйте рабочий email, привязанный к учётной записи. Если не можете войти — обратитесь к администратору.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
