// frontend/src/pages/ResultsPage.tsx
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Alert, Box, Button, CircularProgress, Divider, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getCourseResults, getCourses } from '../api/courses';

export function ResultsPage() {
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: getCourses });
  const courses = coursesQuery.data ?? [];

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const effectiveCourseId = selectedCourseId ?? courses[0]?.id ?? null;
  const selectedCourse = courses.find((c) => c.id === effectiveCourseId) ?? courses[0];

  const resultsQuery = useQuery({
    queryKey: ['course-results', effectiveCourseId],
    queryFn: () => getCourseResults(effectiveCourseId as number),
    enabled: Boolean(effectiveCourseId),
  });

  const items = resultsQuery.data?.items ?? [];
  const calcPercent = (score: number, total: number) => (total > 0 ? Math.round((score / total) * 100) : 0);
  const avgPercent = items.length
    ? Math.round(items.reduce((acc, i) => acc + calcPercent(i.score, i.total_questions), 0) / items.length)
    : 0;
  const bestPercent = items.length
    ? Math.max(...items.map((i) => calcPercent(i.score, i.total_questions)))
    : 0;
  const perfectAttempts = items.filter((i) => i.total_questions > 0 && i.score === i.total_questions).length;

  const metrics = [
    { label: 'Попыток', value: String(items.length) },
    { label: 'Средний балл', value: `${avgPercent}%` },
    { label: 'Без ошибок', value: String(perfectAttempts) },
  ];

  return (
    <Stack spacing={4}>
      {/* Header */}
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
          История тестов
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
          Результаты
          <Box component="span" sx={{ color: 'var(--app-color-primary)' }}>.</Box>
        </Typography>
      </Box>

      {/* Course selector */}
      {courses.length > 1 && (
        <TextField
          select
          label="Курс"
          value={effectiveCourseId ?? ''}
          onChange={(e) => setSelectedCourseId(Number(e.target.value))}
          size="small"
          sx={{ maxWidth: 400 }}
        >
          {courses.map((course) => (
            <MenuItem key={course.id} value={course.id}>
              {course.title}
            </MenuItem>
          ))}
        </TextField>
      )}

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
                  fontSize: { xs: '1.4rem', sm: '1.8rem' },
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: 'var(--app-text-primary)',
                }}
              >
                {resultsQuery.isLoading ? <CircularProgress size={16} sx={{ color: 'var(--app-text-muted)' }} /> : m.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {resultsQuery.isError && <Alert severity="error">Не удалось загрузить результаты.</Alert>}

      {/* Attempts list */}
      <Box
        sx={{
          border: '1px solid var(--app-border)',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'var(--app-surface-elevated)',
        }}
      >
        {/* Table header */}
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.5,
            borderBottom: '1px solid var(--app-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.015em',
              color: 'var(--app-text-primary)',
            }}
          >
            История попыток
          </Typography>
          {items.length > 0 && (
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                color: 'var(--app-color-primary)',
              }}
            >
              Лучший: {bestPercent}%
            </Typography>
          )}
        </Box>

        {items.length === 0 && !resultsQuery.isLoading ? (
          <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
            <Typography
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '-0.02em',
                color: 'var(--app-text-primary)',
                mb: 1,
              }}
            >
              Пока нет завершённых тестов
            </Typography>
            <Typography sx={{ color: 'var(--app-text-secondary)', lineHeight: 1.7, mb: 2.5, fontSize: '0.875rem' }}>
              Откройте курс, изучите материалы и завершите тест. Первая запись появится здесь автоматически.
            </Typography>
            <Button
              component={RouterLink}
              to={effectiveCourseId ? `/courses/${effectiveCourseId}` : '/courses'}
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              size="small"
            >
              {selectedCourse?.title ? `Открыть ${selectedCourse.title}` : 'К курсам'}
            </Button>
          </Box>
        ) : (
          <Stack divider={<Divider sx={{ borderColor: 'var(--app-border)' }} />}>
            {items.map((item, index) => {
              const percent = calcPercent(item.score, item.total_questions);
              const isPerfect = item.score === item.total_questions;
              const isLatest = index === 0;

              return (
                <Box
                  key={item.id}
                  sx={{
                    px: { xs: 2, md: 3 },
                    py: 2,
                    backgroundColor: isLatest ? 'rgba(79,142,247,0.04)' : 'transparent',
                    transition: 'background-color 140ms ease',
                    '&:hover': { backgroundColor: 'rgba(79,142,247,0.03)' },
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {isLatest && (
                            <Typography
                              sx={{
                                fontFamily: '"IBM Plex Mono", monospace',
                                fontSize: '0.6rem',
                                letterSpacing: '0.1em',
                                color: 'var(--app-color-primary)',
                                textTransform: 'uppercase',
                                border: '1px solid rgba(79,142,247,0.3)',
                                borderRadius: 0.5,
                                px: 0.6,
                                py: 0.1,
                              }}
                            >
                              Последняя
                            </Typography>
                          )}
                          {isPerfect && (
                            <Typography
                              sx={{
                                fontFamily: '"IBM Plex Mono", monospace',
                                fontSize: '0.6rem',
                                letterSpacing: '0.1em',
                                color: 'var(--app-color-success)',
                                textTransform: 'uppercase',
                                border: '1px solid rgba(52,211,153,0.3)',
                                borderRadius: 0.5,
                                px: 0.6,
                                py: 0.1,
                              }}
                            >
              Без ошибок
                            </Typography>
                          )}
                        </Stack>
                        <Typography
                          sx={{
                            fontFamily: '"Syne", sans-serif',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            letterSpacing: '-0.015em',
                            color: 'var(--app-text-primary)',
                            lineHeight: 1.2,
                          }}
                        >
                          {item.quiz_title}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '0.65rem',
                            color: 'var(--app-text-muted)',
                          }}
                        >
                          {new Date(item.created_at).toLocaleString('ru-RU')}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography
                        sx={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '0.6rem',
                          letterSpacing: '0.1em',
                          color: 'var(--app-text-muted)',
                          textTransform: 'uppercase',
                          mb: 0.5,
                        }}
                      >
                        Баллы
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Syne", sans-serif',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          letterSpacing: '-0.02em',
                          color: isPerfect ? 'var(--app-color-success)' : 'var(--app-text-primary)',
                        }}
                      >
                        {item.score}/{item.total_questions}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Stack spacing={0.75}>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{
                            height: 4,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: isPerfect ? 'var(--app-color-success)' : 'var(--app-color-primary)',
                            },
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: isPerfect ? 'var(--app-color-success)' : 'var(--app-color-primary)',
                          }}
                        >
                          {percent}%
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* CTA */}
      {items.length > 0 && effectiveCourseId && (
        <Box>
          <Button
            component={RouterLink}
            to={`/courses/${effectiveCourseId}`}
            variant="outlined"
            endIcon={<ArrowForwardRoundedIcon />}
          >
            Продолжить обучение
          </Button>
        </Box>
      )}
    </Stack>
  );
}
