import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Alert, Box, Button, CircularProgress, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getCourses } from '../api/courses';

function estimateReadingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 180) || 3);
}

export function CoursesPage() {
  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: getCourses });
  const courses = coursesQuery.data ?? [];
  const [search, setSearch] = useState('');

  const totalReadingMinutes = courses.reduce((sum, c) => sum + estimateReadingMinutes(c.description || ''), 0);
  const avgMinutes = courses.length ? Math.round(totalReadingMinutes / courses.length) : 0;

  const needle = search.trim().toLowerCase();
  const filtered = needle
    ? courses.filter((c) => c.title.toLowerCase().includes(needle) || c.description?.toLowerCase().includes(needle))
    : courses;

  const metrics = [
    { label: 'Курсов', value: String(courses.length) },
    { label: 'Ср. время', value: `${avgMinutes} мин` },
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
          Каталог
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
          Курсы
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
                  fontSize: { xs: '1.4rem', sm: '1.8rem' },
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: 'var(--app-text-primary)',
                }}
              >
                {coursesQuery.isLoading ? <CircularProgress size={16} sx={{ color: 'var(--app-text-muted)' }} /> : m.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Search */}
      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по названию или описанию..."
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: 'var(--app-text-muted)' }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />

      {coursesQuery.isError && <Alert severity="error">Не удалось загрузить курсы.</Alert>}

      {!courses.length && !coursesQuery.isLoading && (
        <Alert severity="info">Курсы пока не добавлены. Как только они появятся, список обновится.</Alert>
      )}

      {courses.length > 0 && filtered.length === 0 && (
        <Alert severity="info">Ничего не найдено по запросу «{search}».</Alert>
      )}

      {/* Course list */}
      <Stack spacing={1.5}>
        {filtered.map((course, index) => {
          const isFeatured = index === 0 && !needle;
          const readingMinutes = estimateReadingMinutes(course.description || '');
          const featuredLabel = courses.length > 1 ? 'Следующий курс' : 'Ваш курс';

          return (
            <Box
              key={course.id}
              sx={{
                border: `1px solid ${isFeatured ? 'rgba(79,142,247,0.3)' : 'var(--app-border)'}`,
                borderRadius: 2,
                backgroundColor: isFeatured ? 'var(--app-surface-elevated)' : 'transparent',
                p: { xs: 2, md: 2.5 },
                display: 'flex',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 160ms ease, background-color 160ms ease',
                '&:hover': {
                  borderColor: 'rgba(79,142,247,0.35)',
                  backgroundColor: 'var(--app-surface-elevated)',
                },
              }}
            >
              {isFeatured && (
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    backgroundColor: 'var(--app-color-primary)',
                    borderRadius: '2px 0 0 2px',
                  }}
                />
              )}

              <Grid container spacing={2} alignItems="center" sx={{ flex: 1, pl: isFeatured ? 0.5 : 0 }}>
                <Grid size={{ xs: 12, md: 9 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography
                        sx={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '0.62rem',
                          letterSpacing: '0.1em',
                          color: isFeatured ? 'var(--app-color-primary)' : 'var(--app-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isFeatured ? featuredLabel : `Курс ${index + 1}`}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <ScheduleRoundedIcon sx={{ fontSize: 12, color: 'var(--app-text-muted)' }} />
                        <Typography
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '0.62rem',
                            color: 'var(--app-text-muted)',
                          }}
                        >
                          {readingMinutes} мин
                        </Typography>
                      </Stack>
                    </Stack>

                    <Typography
                      sx={{
                        fontFamily: '"Syne", sans-serif',
                        fontWeight: 700,
                        fontSize: { xs: '1.1rem', md: isFeatured ? '1.4rem' : '1.15rem' },
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15,
                        color: 'var(--app-text-primary)',
                      }}
                    >
                      {course.title}
                    </Typography>

                    {course.description && (
                      <Typography
                        sx={{
                          color: 'var(--app-text-secondary)',
                          lineHeight: 1.65,
                          fontSize: '0.875rem',
                          maxWidth: 680,
                        }}
                      >
                        {course.description}
                      </Typography>
                    )}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Button
                    component={RouterLink}
                    to={`/courses/${course.id}`}
                    fullWidth
                    variant={isFeatured ? 'contained' : 'outlined'}
                    endIcon={<ArrowForwardRoundedIcon />}
                    startIcon={!isFeatured ? <AutoStoriesRoundedIcon sx={{ fontSize: '16px !important' }} /> : undefined}
                    sx={{ minHeight: 44 }}
                  >
                    {isFeatured ? 'Продолжить' : 'Открыть'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
