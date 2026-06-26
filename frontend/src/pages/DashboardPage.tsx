import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import { Alert, Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { getCourses } from '../api/courses';
import { useAuth } from '../app/AuthContext';
import { userFirstName } from '../app/userUtils';

export function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: getCourses });

  const accessDenied = (location.state as { accessDenied?: { title?: string; message?: string } } | null)?.accessDenied;
  const courses = coursesQuery.data ?? [];
  const currentCourse = courses[0];
  const additionalCourses = Math.max(courses.length - 1, 0);

  const firstName = userFirstName(user);

  const metrics = [
    {
      label: 'Курсов назначено',
      value: coursesQuery.isLoading ? '—' : String(courses.length),
    },
    {
      label: 'Активный фокус',
      value: currentCourse ? '1' : '0',
    },
    {
      label: 'В очереди',
      value: String(additionalCourses),
    },
  ];

  return (
    <Stack spacing={4}>
      {accessDenied && (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate(location.pathname, { replace: true })}
            >
              Закрыть
            </Button>
          }
        >
          <Typography fontWeight={700} sx={{ fontSize: '0.875rem' }}>
            {accessDenied.title || 'Доступ ограничен'}
          </Typography>
          <Typography variant="body2">{accessDenied.message || 'Этот раздел недоступен для вашей роли.'}</Typography>
        </Alert>
      )}

      {/* Greeting */}
      <Box>
        <Typography
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.14em',
            color: 'var(--app-text-muted)',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          {user?.is_admin ? 'Панель администратора' : 'Панель обучения'}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 800,
            fontSize: { xs: '2.2rem', sm: '3rem', md: '3.5rem' },
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            color: 'var(--app-text-primary)',
          }}
        >
          {firstName}
          <Box component="span" sx={{ color: 'var(--app-color-primary)' }}>.</Box>
        </Typography>
      </Box>

      {/* Metric strip */}
      <Box
        sx={{
          display: 'flex',
          border: '1px solid var(--app-border)',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'var(--app-surface-elevated)',
        }}
      >
        {metrics.map((m, i) => (
          <Box key={m.label} sx={{ display: 'flex', flex: 1 }}>
            {i > 0 && <Divider orientation="vertical" flexItem sx={{ borderColor: 'var(--app-border)' }} />}
            <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: 2 }}>
              <Typography
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.62rem',
                  letterSpacing: '0.1em',
                  color: 'var(--app-text-muted)',
                  textTransform: 'uppercase',
                  mb: 0.5,
                }}
              >
                {m.label}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Syne", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '1.6rem', sm: '2rem' },
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: 'var(--app-text-primary)',
                }}
              >
                {coursesQuery.isLoading ? <CircularProgress size={18} sx={{ color: 'var(--app-text-muted)' }} /> : m.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Loading / error */}
      {coursesQuery.isError && (
        <Alert severity="error">Не удалось загрузить курсы. Обновите страницу.</Alert>
      )}

      {/* Main content */}
      <Grid container spacing={2.5} alignItems="stretch">
        {/* Current course */}
        <Grid size={{ xs: 12, xl: 8 }}>
          <Box
            sx={{
              height: '100%',
              border: '1px solid var(--app-border)',
              borderRadius: 2,
              backgroundColor: 'var(--app-surface-elevated)',
              p: { xs: 2.5, md: 3.5 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Accent glow */}
            {currentCourse && (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: -80,
                  right: -80,
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
            )}

            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                color: currentCourse ? 'var(--app-color-primary)' : 'var(--app-text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Текущий маршрут
            </Typography>

            {currentCourse ? (
              <>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Syne", sans-serif',
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', md: '1.9rem' },
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                      color: 'var(--app-text-primary)',
                      mb: 1,
                    }}
                  >
                    {currentCourse.title}
                  </Typography>
                  {currentCourse.description && (
                    <Typography
                      sx={{
                        color: 'var(--app-text-secondary)',
                        lineHeight: 1.7,
                        fontSize: '0.9rem',
                        maxWidth: 560,
                      }}
                    >
                      {currentCourse.description}
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" spacing={{ xs: 2, sm: 4 }}>
                  {[
                    { label: 'Статус', value: 'Активный' },
                    { label: 'В каталоге', value: additionalCourses > 0 ? `Ещё ${additionalCourses}` : 'Один курс' },
                  ].map((f) => (
                    <Box key={f.label}>
                      <Typography
                        sx={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '0.6rem',
                          letterSpacing: '0.1em',
                          color: 'var(--app-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {f.label}
                      </Typography>
                      <Typography
                        sx={{ fontWeight: 600, color: 'var(--app-text-primary)', fontSize: '0.875rem', mt: 0.25 }}
                      >
                        {f.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 'auto' }}>
                  <Button
                    component={RouterLink}
                    to={`/courses/${currentCourse.id}`}
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Продолжить курс
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/courses"
                    variant="outlined"
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Весь каталог
                  </Button>
                </Stack>
              </>
            ) : (
              <Box sx={{ py: 2 }}>
                <Typography
                  sx={{
                    fontFamily: '"Syne", sans-serif',
                    fontWeight: 700,
                    fontSize: '1.4rem',
                    letterSpacing: '-0.025em',
                    color: 'var(--app-text-primary)',
                    mb: 1,
                  }}
                >
                  Курсы ещё не назначены
                </Typography>
                <Typography sx={{ color: 'var(--app-text-secondary)', lineHeight: 1.7, mb: 2.5, fontSize: '0.9rem' }}>
                  Когда администратор назначит курс, здесь появится основной маршрут обучения.
                </Typography>
                <Button component={RouterLink} to="/courses" variant="outlined" endIcon={<ArrowForwardRoundedIcon />}>
                  Открыть каталог
                </Button>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Side cards */}
        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={2.5} sx={{ height: '100%' }}>
            {[
              {
                icon: <AutoStoriesRoundedIcon sx={{ fontSize: 18, color: 'var(--app-color-primary)' }} />,
                label: 'Каталог',
                title: 'Все курсы',
                desc: 'Полный список назначенных программ.',
                to: '/courses',
                cta: 'Открыть каталог',
              },
              {
                icon: <QueryStatsRoundedIcon sx={{ fontSize: 18, color: 'var(--app-color-primary)' }} />,
                label: 'Статистика',
                title: 'Результаты',
                desc: 'История тестов и оценки.',
                to: '/results',
                cta: 'Открыть результаты',
              },
            ].map((card) => (
              <Box
                key={card.to}
                sx={{
                  flex: 1,
                  border: '1px solid var(--app-border)',
                  borderRadius: 2,
                  backgroundColor: 'var(--app-surface-elevated)',
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  transition: 'border-color 160ms ease',
                  '&:hover': { borderColor: 'rgba(79,142,247,0.25)' },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {card.icon}
                  <Typography
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '0.62rem',
                      letterSpacing: '0.1em',
                      color: 'var(--app-text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {card.label}
                  </Typography>
                </Stack>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: '"Syne", sans-serif',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      letterSpacing: '-0.02em',
                      color: 'var(--app-text-primary)',
                      mb: 0.5,
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {card.desc}
                  </Typography>
                </Box>
                <Button
                  component={RouterLink}
                  to={card.to}
                  variant="outlined"
                  size="small"
                  sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                >
                  {card.cta}
                </Button>
              </Box>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
