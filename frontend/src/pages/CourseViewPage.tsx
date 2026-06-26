import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import AudiotrackRoundedIcon from '@mui/icons-material/AudiotrackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import TopicRoundedIcon from '@mui/icons-material/TopicRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container, LinearProgress, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { alpha } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCourse, getCourseResults, submitQuiz } from '../api/courses';
import { useSetPageTitle } from '../app/PageTitleContext';
import { DocxViewer } from '../components/DocxViewer';
import { LearningMetricCard } from '../components/LearningMetricCard';
import { PptxViewer } from '../components/PptxViewer';
import { ScormViewer } from '../components/ScormViewer';
import { XlsxViewer } from '../components/XlsxViewer';
import type { Lesson, QuizResult } from '../types';

function absolutizeMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function extractYoutubeEmbed(url: string): string | null {
  if (url.includes('youtube.com/watch?v=')) {
    const id = url.split('v=')[1]?.split('&')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  return null;
}

function estimateTextMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 180) || 2);
}

function estimateLessonMinutes(type: string, content: string): number {
  if (type === 'text') return estimateTextMinutes(content);
  if (type === 'video') return 8;
  if (type === 'audio') return 5;
  return 4;
}

function sortLessonsInLearningOrder(lessons: Lesson[]) {
  return [...lessons].sort((a, b) => {
    const positionDiff = (a.position ?? 0) - (b.position ?? 0);
    if (positionDiff !== 0) return positionDiff;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

const lessonMeta: Record<string, { icon: React.ReactNode; title: string; hint: string; chipLabel: string }> = {
  text:     { icon: <ArticleRoundedIcon color="primary" />,     title: 'Теория',    hint: 'Ключевой материал темы.',            chipLabel: 'Теория' },
  video:    { icon: <PlayCircleRoundedIcon color="primary" />,  title: 'Видео',     hint: 'Видеоразбор по теме.',               chipLabel: 'Видео' },
  audio:    { icon: <AudiotrackRoundedIcon color="primary" />,  title: 'Аудио',     hint: 'Короткое аудиоповторение.',          chipLabel: 'Аудио' },
  document: { icon: <DescriptionRoundedIcon color="primary" />, title: 'Документ',  hint: 'Файл с дополнительными материалами.',chipLabel: 'Документы' },
  scorm:    { icon: <SchoolRoundedIcon color="primary" />,      title: 'SCORM',     hint: 'Интерактивный учебный модуль.',      chipLabel: 'SCORM' },
};

type Phase = 'materials' | 'quiz';

export function CourseViewPage() {
  const { courseId } = useParams();
  const numericCourseId = Number(courseId);
  const queryClient = useQueryClient();

  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [hasInitializedTheme, setHasInitializedTheme] = useState(false);
  const [phase, setPhase] = useState<Phase>('materials');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [viewedMaterialIds, setViewedMaterialIds] = useState<Record<string, Set<string>>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, Record<number, number[]>>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<Record<string, number>>({});
  const [lastSubmissionResult, setLastSubmissionResult] = useState<Record<string, QuizResult>>({});

  const courseQuery = useQuery({ queryKey: ['course', numericCourseId], queryFn: () => getCourse(numericCourseId), enabled: Boolean(numericCourseId) });
  const resultsQuery = useQuery({ queryKey: ['course-results', numericCourseId], queryFn: () => getCourseResults(numericCourseId), enabled: Boolean(numericCourseId) });

  useSetPageTitle(courseQuery.data ? { label: courseQuery.data.title, caption: 'Материалы и каталог' } : null);

  const themes = courseQuery.data?.themes?.length
    ? [...courseQuery.data.themes].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    : [{ id: 0, title: courseQuery.data?.title || 'Тема', description: courseQuery.data?.description || '', position: 1, lessons: courseQuery.data?.lessons ?? [], quizzes: courseQuery.data?.quizzes ?? [] }];

  const activeTheme = themes?.[activeThemeIndex] ?? themes?.[0];
  const themeKey = String(activeTheme?.id ?? 'fallback');
  const effectiveLessons = sortLessonsInLearningOrder(activeTheme?.lessons ?? []);
  const quiz = activeTheme?.quizzes?.[0];
  const hasQuiz = !!quiz && quiz.questions.length > 0;
  const lessonBlocks = effectiveLessons
    .filter((lesson) => lesson.content && lesson.content !== 'undefined')
    .map((lesson) => ({ type: lesson.content_type, lesson }));

  const attempts = resultsQuery.data?.items ?? [];
  const themeAttempts = activeTheme?.id ? attempts.filter((item) => item.theme_id === activeTheme.id) : attempts;
  const bestAttempt = useMemo(() => themeAttempts.length ? Math.max(...themeAttempts.map((item) => item.score)) : 0, [themeAttempts]);
  const lastAttempt = themeAttempts[0];

  const viewedSet = viewedMaterialIds[themeKey] ?? new Set<string>();
  const viewedCount = viewedSet.size;
  const themeAlreadyAttempted = themeAttempts.length > 0;
  const effectiveViewedCount = themeAlreadyAttempted ? lessonBlocks.length : viewedCount;
  const allViewed = lessonBlocks.length === 0 || effectiveViewedCount >= lessonBlocks.length;
  const canAccessQuiz = allViewed || themeAlreadyAttempted;
  const viewedProgress = lessonBlocks.length > 0 ? Math.round((effectiveViewedCount / lessonBlocks.length) * 100) : 100;

  const availableTypes = [...new Set(lessonBlocks.map((b) => b.type))];
  const filteredBlocks = activeTypeFilter === 'all' ? lessonBlocks : lessonBlocks.filter((b) => b.type === activeTypeFilter);

  const answersForTheme = selectedAnswers[themeKey] ?? {};
  const currentIndex = currentQuestionIndex[themeKey] ?? 0;
  const currentQuestionPosition = currentIndex + 1;
  const currentQuestion = quiz?.questions[currentIndex];
  const currentAnswerIds: number[] = currentQuestion?.id ? (answersForTheme[currentQuestion.id] ?? []) : [];
  const answeredCount = Object.values(answersForTheme).filter((ids) => ids.length > 0).length;
  const allQuestionsAnswered = hasQuiz ? answeredCount === quiz!.questions.length : false;
  const quizProgress = hasQuiz ? Math.round((answeredCount / quiz!.questions.length) * 100) : 100;
  const currentSubmission = lastSubmissionResult[themeKey];
  const estimatedMinutes = lessonBlocks.reduce((sum, item) => sum + estimateLessonMinutes(item.type, item.lesson.content), 0);
  const nextThemeIndex = activeThemeIndex + 1 < themes.length ? activeThemeIndex + 1 : null;

  const isThemeUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    for (let i = 0; i < index; i++) {
      const t = themes[i];
      const q = t.quizzes?.[0];
      if (!q || !q.questions.length) continue;
      if (!t.id || !attempts.some((a) => a.theme_id === t.id)) return false;
    }
    return true;
  };

  useEffect(() => {
    if (hasInitializedTheme || !courseQuery.data || !resultsQuery.data) return;
    const allAttempts = resultsQuery.data.items;
    const firstUnfinished = themes.findIndex(
      (t) => t.id && !allAttempts.some((a) => a.theme_id === t.id),
    );
    if (firstUnfinished > 0) setActiveThemeIndex(firstUnfinished);
    setHasInitializedTheme(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseQuery.data, resultsQuery.data]);

  const switchTheme = (index: number) => {
    setActiveThemeIndex(index);
    setPhase('materials');
    setActiveTypeFilter('all');
    setCurrentQuestionIndex((prev) => ({ ...prev, [String(themes[index]?.id ?? index)]: 0 }));
  };

  const markViewed = (lessonId: string | number) => {
    setViewedMaterialIds((prev) => {
      const set = new Set(prev[themeKey] ?? []);
      set.add(String(lessonId));
      return { ...prev, [themeKey]: set };
    });
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (!quiz?.id) throw new Error('Quiz not found');
      return submitQuiz(
        quiz.id,
        Object.entries(answersForTheme).map(([question_id, selected_option_ids]) => ({ question_id: Number(question_id), selected_option_ids })),
      );
    },
    onSuccess: async (result) => {
      setLastSubmissionResult((prev) => ({ ...prev, [themeKey]: result }));
      await queryClient.invalidateQueries({ queryKey: ['course-results', numericCourseId] });
    },
  });

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        {courseQuery.isLoading ? (
          <Card sx={{ borderRadius: 3.5 }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CircularProgress size={22} />
                <Typography color="text.secondary">Загружаем курс и структуру обучения.</Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
        {courseQuery.isError ? <Alert severity="error">Не удалось загрузить курс. Попробуйте обновить страницу чуть позже.</Alert> : null}

        {courseQuery.data ? (
          <>
            {/* Hero */}
            <Card sx={{ borderRadius: 4, overflow: 'hidden', color: '#fff', background: 'linear-gradient(135deg, #0a0d14 0%, var(--app-color-primary-dark) 52%, var(--app-color-primary) 100%)', boxShadow: '0 28px 80px rgba(37,99,235,0.24)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Grid container spacing={3} alignItems="stretch">
                  <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={2.15} sx={{ maxWidth: 760 }}>
                      <Chip label="Учебный маршрут" sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.14)', color: '#fff' }} />
                      <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.02, fontWeight: 800 }}>{courseQuery.data.title}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.72 }}>
                        {courseQuery.data.description || 'Курс построен по простому порядку: материалы темы, затем проверка понимания.'}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ p: 2.3, borderRadius: 2.5, bgcolor: 'rgba(5,10,24,0.22)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.66)', letterSpacing: '0.16em' }}>Сейчас в фокусе</Typography>
                      <Typography variant="h5" sx={{ mt: 1 }}>{activeTheme?.title ?? 'Тема не выбрана'}</Typography>
                      <Stack direction="row" spacing={2.5} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
                        <Box><Typography sx={{ color: 'rgba(255,255,255,0.68)' }}>Материалов</Typography><Typography variant="h6">{lessonBlocks.length}</Typography></Box>
                        <Box><Typography sx={{ color: 'rgba(255,255,255,0.68)' }}>Вопросов</Typography><Typography variant="h6">{quiz?.questions.length ?? 0}</Typography></Box>
                        <Box><Typography sx={{ color: 'rgba(255,255,255,0.68)' }}>Ориентир</Typography><Typography variant="h6">{estimatedMinutes} мин</Typography></Box>
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <LearningMetricCard icon={<TopicRoundedIcon />} label="Темы" value={themes.length} hint="Курс разбит на отдельные шаги." />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <LearningMetricCard icon={<SchoolRoundedIcon />} label="Текущая тема" value={`${activeThemeIndex + 1}/${themes.length}`} hint="Лучше идти по одной теме за раз." />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <LearningMetricCard icon={<AssignmentTurnedInRoundedIcon />} label="Лучший результат" value={hasQuiz ? `${bestAttempt}/${quiz!.questions.length}` : '—'} hint="Появляется после завершённой попытки." accent="#059669" />
              </Grid>
            </Grid>

            {/* Theme selector */}
            <Card sx={{ borderRadius: 3.5 }}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Темы курса</Typography>
                    <Chip size="small" label={`${activeThemeIndex + 1} / ${themes.length}`} color="primary" variant="outlined" />
                  </Stack>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.25,
                      overflowX: 'auto',
                      pb: 0.5,
                      flexWrap: 'nowrap',
                      scrollbarWidth: 'thin',
                      '&::-webkit-scrollbar': { height: 4 },
                      '&::-webkit-scrollbar-thumb': { borderRadius: 999, background: 'rgba(79,142,247,0.28)' },
                    }}
                  >
                    {themes.map((theme, index) => {
                      const isActive = index === activeThemeIndex;
                      const themeAttemptCount = theme.id ? attempts.filter((a) => a.theme_id === theme.id).length : 0;
                      const isCompleted = themeAttemptCount > 0;
                      const locked = !isThemeUnlocked(index);

                      if (locked) return null;

                      return (
                        <Box
                          key={theme.id ?? index}
                          component="button"
                          type="button"
                          onClick={() => switchTheme(index)}
                          sx={{
                            flexShrink: 0,
                            width: 200,
                            p: 1.5,
                            borderRadius: 2.5,
                            border: `1px solid ${isActive ? 'rgba(79,142,247,0.45)' : isCompleted ? 'rgba(5,150,105,0.3)' : 'var(--app-border)'}`,
                            bgcolor: isActive ? 'rgba(79,142,247,0.08)' : isCompleted ? 'rgba(5,150,105,0.05)' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            font: 'inherit',
                            background: 'none',
                            transition: 'border-color 160ms ease, background-color 160ms ease',
                            '&:hover': { borderColor: 'rgba(79,142,247,0.35)', bgcolor: 'var(--app-surface-elevated)' },
                          }}
                        >
                          <Stack spacing={0.75}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-text-muted)' }}>
                                Тема {index + 1}
                              </Typography>
                              {isCompleted
                                ? <CheckCircleRoundedIcon sx={{ fontSize: 13, color: 'success.main' }} />
                                : isActive
                                ? <PlayCircleRoundedIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                                : null}
                            </Stack>
                            <Typography fontWeight={700} sx={{ fontSize: '0.82rem', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {theme.title}
                            </Typography>
                            <Box sx={{ height: 3, borderRadius: 999, bgcolor: isCompleted ? 'success.main' : isActive ? 'primary.main' : 'action.hover', width: isCompleted ? '100%' : isActive ? '50%' : '0%', transition: 'width 400ms ease' }} />
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Phase stepper — sticky */}
            <Card sx={{ borderRadius: 3.5, position: 'sticky', top: 8, zIndex: 4, boxShadow: (t) => t.palette.mode === 'light' ? '0 4px 16px rgba(0,0,0,0.10)' : 'none' }}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack direction="row" spacing={0} alignItems="stretch">
                  {/* Step 1 */}
                  <Box
                    onClick={() => setPhase('materials')}
                    sx={{ flex: 1, px: { xs: 2, md: 3 }, py: 2, cursor: 'pointer', borderRadius: 2, transition: 'background 0.18s', bgcolor: phase === 'materials' ? alpha('#4f8ef7', 0.1) : 'transparent', '&:hover': { bgcolor: phase === 'materials' ? alpha('#4f8ef7', 0.12) : 'action.hover' } }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: phase === 'materials' ? 'primary.main' : canAccessQuiz ? alpha('#059669', 0.14) : alpha('#4f8ef7', 0.14), color: phase === 'materials' ? '#fff' : canAccessQuiz ? '#059669' : 'text.secondary', fontWeight: 700, fontSize: '0.9rem' }}>
                        {canAccessQuiz ? <CheckCircleRoundedIcon sx={{ fontSize: 20 }} /> : '1'}
                      </Box>
                      <Box>
                        <Typography fontWeight={700} color={phase === 'materials' ? 'primary.main' : 'text.primary'}>Материалы</Typography>
                        <Typography variant="body2" color="text.secondary">{effectiveViewedCount}/{lessonBlocks.length} просмотрено</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Step 2 — only when quiz has questions */}
                  {hasQuiz ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                        <NavigateNextRoundedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                      </Box>
                      <Box
                        onClick={() => canAccessQuiz && setPhase('quiz')}
                        sx={{ flex: 1, px: { xs: 2, md: 3 }, py: 2, cursor: canAccessQuiz ? 'pointer' : 'not-allowed', borderRadius: 2, transition: 'background 0.18s', bgcolor: phase === 'quiz' ? alpha('#4f8ef7', 0.1) : 'transparent', opacity: canAccessQuiz ? 1 : 0.45, '&:hover': canAccessQuiz ? { bgcolor: phase === 'quiz' ? alpha('#4f8ef7', 0.12) : 'action.hover' } : {} }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: phase === 'quiz' ? 'primary.main' : canAccessQuiz ? alpha('#4f8ef7', 0.14) : alpha('#94a3b8', 0.12), color: phase === 'quiz' ? '#fff' : canAccessQuiz ? 'primary.main' : 'text.disabled', fontWeight: 700, fontSize: '0.9rem' }}>
                            {canAccessQuiz ? '2' : <LockRoundedIcon sx={{ fontSize: 16 }} />}
                          </Box>
                          <Box>
                            <Typography fontWeight={700} color={phase === 'quiz' ? 'primary.main' : canAccessQuiz ? 'text.primary' : 'text.disabled'}>Тест</Typography>
                            <Typography variant="body2" color="text.secondary">{canAccessQuiz ? `${themeAttempts.length} попыток` : 'Сначала просмотрите материалы'}</Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>

            {/* Phase: Materials */}
            {phase === 'materials' ? (
              <Card id="course-materials" sx={{ borderRadius: 3.5 }}>
                <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
                  <Stack spacing={2.5}>
                    {/* Header */}
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                      <Box>
                        <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-muted)', mb: 0.5 }}>Шаг 1 — Материалы темы</Typography>
                        <Typography variant="h4">{activeTheme?.title}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.7 }}>
                          Изучите каждый материал и отметьте его просмотренным. После всех — откроется тест.
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Progress */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Typography variant="body2" color="text.secondary">Просмотрено материалов</Typography>
                        <Typography variant="body2" fontWeight={700} color={allViewed ? 'success.main' : 'text.secondary'}>{effectiveViewedCount} / {lessonBlocks.length}</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={viewedProgress}
                        color={allViewed ? 'success' : 'primary'}
                        sx={{ height: 8, borderRadius: 999, bgcolor: 'action.hover' }}
                      />
                    </Box>

                    {/* Type filter chips */}
                    {availableTypes.length > 1 ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ overflowX: 'auto', flexWrap: 'nowrap', pb: 0.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
                      >
                        <Chip
                          label={`Все (${lessonBlocks.length})`}
                          onClick={() => setActiveTypeFilter('all')}
                          color={activeTypeFilter === 'all' ? 'primary' : 'default'}
                          variant={activeTypeFilter === 'all' ? 'filled' : 'outlined'}
                          sx={{ flexShrink: 0 }}
                        />
                        {availableTypes.map((type) => {
                          const meta = lessonMeta[type] ?? lessonMeta.document;
                          const count = lessonBlocks.filter((b) => b.type === type).length;
                          return (
                            <Chip
                              key={type}
                              label={`${meta.chipLabel} (${count})`}
                              onClick={() => setActiveTypeFilter(type)}
                              color={activeTypeFilter === type ? 'primary' : 'default'}
                              variant={activeTypeFilter === type ? 'filled' : 'outlined'}
                              sx={{ flexShrink: 0 }}
                            />
                          );
                        })}
                      </Stack>
                    ) : null}

                    {/* Materials list */}
                    {!lessonBlocks.length ? <Alert severity="info">У этой темы пока нет материалов.</Alert> : null}
                    {lessonBlocks.length > 0 && filteredBlocks.length === 0 ? (
                      <Alert severity="info">Материалов этого типа в теме нет.</Alert>
                    ) : null}

                    <Stack spacing={2}>
                      {filteredBlocks.map(({ type, lesson }) => {
                        const meta = lessonMeta[type] ?? lessonMeta.document;
                        const mediaUrl = absolutizeMediaUrl(lesson.content);
                        const lessonId = String(lesson.id ?? lesson.title);
                        const isViewed = themeAlreadyAttempted || viewedSet.has(lessonId);
                        const lessonMinutes = estimateLessonMinutes(type, lesson.content);

                        const isDocxDocument = type === 'document' ? /\.(doc|docx)$/i.test(mediaUrl) : false;
                        const isPdfDocument = type === 'document' ? /\.pdf$/i.test(mediaUrl) : false;
                        const isPptxDocument = type === 'document' ? /\.pptx$/i.test(mediaUrl) : false;
                        const isXlsxDocument = type === 'document' ? /\.(xlsx|xls)$/i.test(mediaUrl) : false;
                        const embeddedVideoUrl = type === 'video' ? extractYoutubeEmbed(lesson.content) : null;
                        const isDirectVideoFile = type === 'video' ? /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl) : false;

                        return (
                          <Card
                            key={lessonId}
                            sx={{
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: isViewed ? alpha('#059669', 0.3) : 'divider',
                              boxShadow: 'none',
                              bgcolor: 'background.paper',
                              transition: 'border-color 0.2s',
                            }}
                          >
                            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                              <Stack spacing={1.8}>
                                {/* Material header */}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                    <Box sx={{ width: 44, height: 44, borderRadius: 2.25, display: 'grid', placeItems: 'center', bgcolor: isViewed ? alpha('#059669', 0.1) : 'rgba(79,142,247,0.1)', flexShrink: 0 }}>
                                      {isViewed ? <CheckCircleRoundedIcon sx={{ color: '#059669' }} /> : meta.icon}
                                    </Box>
                                    <Box>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="overline" color="text.secondary">{meta.title}</Typography>
                                        <Typography variant="overline" color="text.disabled">·</Typography>
                                        <Typography variant="overline" color="text.disabled">~{lessonMinutes} мин</Typography>
                                      </Stack>
                                      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{lesson.title}</Typography>
                                    </Box>
                                  </Stack>
                                  {isViewed ? (
                                    <Chip size="small" icon={<CheckCircleRoundedIcon />} label="Просмотрено" color="success" variant="outlined" />
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<VisibilityRoundedIcon />}
                                      onClick={() => markViewed(lessonId)}
                                      sx={{ alignSelf: 'flex-start', flexShrink: 0 }}
                                    >
                                      Отметить просмотренным
                                    </Button>
                                  )}
                                </Stack>

                                {/* Content */}
                                {type === 'text' ? (
                                  <Stack spacing={1.25}>
                                    <Box sx={{ p: { xs: 1.8, md: 2.1 }, borderRadius: 2.25, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                      <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.86 }}>{lesson.content}</Typography>
                                    </Box>
                                  </Stack>
                                ) : null}

                                {type === 'video' ? (
                                  <Stack spacing={1.1}>
                                    <Box sx={{ overflow: 'hidden', borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                      {isDirectVideoFile ? (
                                        <video controls preload="metadata" style={{ width: '100%', display: 'block' }}>
                                          <source src={mediaUrl} />
                                        </video>
                                      ) : embeddedVideoUrl ? (
                                        <Box sx={{ position: 'relative', width: '100%', pt: { xs: '56%', md: '52%' } }}>
                                          <Box component="iframe" src={embeddedVideoUrl} title="Course video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                                        </Box>
                                      ) : (
                                        <Box sx={{ p: 3 }}>
                                          <Typography variant="h6">Видео недоступно для встроенного просмотра</Typography>
                                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Откройте файл в новой вкладке.</Typography>
                                        </Box>
                                      )}
                                    </Box>
                                    <Button component="a" href={mediaUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<OpenInNewRoundedIcon sx={{ fontSize: '16px !important' }} />} sx={{ alignSelf: 'flex-start' }}>
                                      Открыть видео отдельно
                                    </Button>
                                  </Stack>
                                ) : null}

                                {type === 'audio' ? (
                                  <Box sx={{ borderRadius: 2.25, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ height: 4, bgcolor: 'primary.main', background: 'linear-gradient(90deg, var(--app-color-primary) 0%, var(--app-color-primary-dark) 100%)', opacity: 1 }} />
                                    <Box sx={{ p: 1.6, bgcolor: 'background.default' }}>
                                      <audio controls src={mediaUrl} style={{ width: '100%', display: 'block' }} />
                                    </Box>
                                  </Box>
                                ) : null}

                                {type === 'document' ? (
                                  <Stack spacing={1.25}>
                                    <Box sx={{ overflow: 'hidden', borderRadius: 2.25, border: '1px solid', borderColor: 'divider' }}>
                                      {isDocxDocument ? <DocxViewer fileUrl={mediaUrl} />
                                        : isPdfDocument ? <iframe src={mediaUrl} title="Course document" style={{ width: '100%', height: 620, border: 0 }} />
                                        : isPptxDocument ? <PptxViewer fileUrl={mediaUrl} />
                                        : isXlsxDocument ? <XlsxViewer fileUrl={mediaUrl} />
                                        : <Alert severity="info">Для этого формата доступна прямая ссылка на файл.</Alert>
                                      }
                                    </Box>
                                    <Button component="a" href={mediaUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<OpenInNewRoundedIcon sx={{ fontSize: '16px !important' }} />} sx={{ alignSelf: 'flex-start' }}>Открыть документ отдельно</Button>
                                  </Stack>
                                ) : null}

                                {type === 'scorm' ? (
                                  <Box sx={{ overflow: 'hidden', borderRadius: 2.25, border: '1px solid', borderColor: 'divider' }}>
                                    <ScormViewer entryUrl={mediaUrl} />
                                  </Box>
                                ) : null}
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Stack>

                    {/* CTA to quiz */}
                    <Box sx={{ pt: 1 }}>
                      {allViewed ? (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                          {hasQuiz ? (
                            <Button
                              variant="contained"
                              size="large"
                              endIcon={<NavigateNextRoundedIcon />}
                              onClick={() => setPhase('quiz')}
                            >
                              Перейти к тесту
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Тест для этой темы не добавлен.</Typography>
                          )}
                        </Stack>
                      ) : (
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1.5}
                          alignItems={{ sm: 'center' }}
                          sx={{ p: 2.25, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#f59e0b', 0.35), bgcolor: alpha('#f59e0b', 0.07) }}
                        >
                          <LockRoundedIcon sx={{ color: '#f59e0b', fontSize: 22, flexShrink: 0 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#f59e0b' }}>
                              Тест ещё закрыт
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                              Просмотрите все материалы. Осталось: <strong>{lessonBlocks.length - effectiveViewedCount}</strong>
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={viewedProgress}
                            sx={{ width: { xs: '100%', sm: 120 }, height: 6, borderRadius: 999, bgcolor: alpha('#f59e0b', 0.18), flexShrink: 0, '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' } }}
                          />
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            {/* Phase: Quiz */}
            {phase === 'quiz' && hasQuiz ? (
              <Card id="course-quiz" sx={{ borderRadius: 3.5 }}>
                <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
                  <Stack spacing={2.25}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                      <Box sx={{ maxWidth: 680 }}>
                        <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-muted)', mb: 0.5 }}>Шаг 2 — Проверка понимания</Typography>
                        <Typography variant="h4">{activeTheme?.title}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.7 }}>Отвечайте по одному вопросу. После выбора ответа можно идти дальше или вернуться.</Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ alignSelf: 'flex-start' }}>
                        <Chip label={`Отвечено ${quiz ? `${answeredCount}/${quiz.questions.length}` : '—'}`} color="primary" variant="outlined" />
                        <Chip label={`Попыток ${themeAttempts.length}`} variant="outlined" />
                      </Stack>
                    </Stack>

                    <Box>
                      <LinearProgress variant="determinate" value={quizProgress} sx={{ height: 8, borderRadius: 999, bgcolor: 'action.hover' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>{quiz ? `Готовность к отправке: ${quizProgress}%` : 'Тест пока не добавлен.'}</Typography>
                    </Box>

                    {!quiz ? <Alert severity="info">Для этой темы тест пока не добавлен.</Alert> : null}

                    {quiz ? (
                      <Grid container spacing={2.25} alignItems="stretch">
                        <Grid size={{ xs: 12, xl: 9 }}>
                          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                              <Stack spacing={2}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                                  <Box>
                                    <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-muted)', mb: 0.5 }}>
                                      Вопрос {currentQuestionPosition} из {quiz.questions.length}
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontSize: { xs: '1.1rem', md: '1.4rem' }, lineHeight: 1.25 }}>{currentQuestion?.prompt}</Typography>
                                  </Box>
                                  <Chip icon={<AssignmentTurnedInRoundedIcon />} label={currentAnswerIds.length > 0 ? `${currentAnswerIds.length} выбрано` : 'Выберите ответ'} color={currentAnswerIds.length > 0 ? 'success' : 'default'} variant="outlined" sx={{ alignSelf: 'flex-start' }} />
                                </Stack>

                                <Stack spacing={1}>
                                  {currentQuestion?.options.map((option) => {
                                    const isSelected = currentAnswerIds.includes(option.id ?? -1);
                                    return (
                                      <Button
                                        key={option.id}
                                        fullWidth variant="text"
                                        onClick={() => {
                                          const questionId = currentQuestion.id;
                                          const optionId = option.id;
                                          if (typeof questionId === 'number' && typeof optionId === 'number') {
                                            setSelectedAnswers((prev) => {
                                              const cur = prev[themeKey]?.[questionId] ?? [];
                                              const next = cur.includes(optionId)
                                                ? cur.filter((id) => id !== optionId)
                                                : [...cur, optionId];
                                              return { ...prev, [themeKey]: { ...(prev[themeKey] ?? {}), [questionId]: next } };
                                            });
                                          }
                                        }}
                                        sx={{ justifyContent: 'flex-start', p: 0, borderRadius: 2.25, textTransform: 'none' }}
                                      >
                                        <Box sx={{ width: '100%', p: 1.6, textAlign: 'left', borderRadius: 2.25, border: `1px solid ${isSelected ? alpha('#4f8ef7', 0.4) : 'rgba(148,163,184,0.24)'}`, bgcolor: isSelected ? alpha('#4f8ef7', 0.12) : 'background.paper', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                          <Box sx={{ width: 18, height: 18, borderRadius: 0.75, border: `2px solid ${isSelected ? '#4f8ef7' : 'rgba(148,163,184,0.5)'}`, bgcolor: isSelected ? '#4f8ef7' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isSelected ? <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: '#fff' }} /> : null}
                                          </Box>
                                          <Typography fontWeight={700}>{option.text}</Typography>
                                        </Box>
                                      </Button>
                                    );
                                  })}
                                </Stack>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                                  <Button variant="outlined" disabled={currentIndex === 0} onClick={() => setCurrentQuestionIndex((prev) => ({ ...prev, [themeKey]: Math.max(0, (prev[themeKey] ?? 0) - 1) }))}>
                                    Назад
                                  </Button>
                                  {currentIndex < quiz.questions.length - 1 ? (
                                    <Button variant="contained" disabled={currentAnswerIds.length === 0} endIcon={<NavigateNextRoundedIcon />} onClick={() => setCurrentQuestionIndex((prev) => ({ ...prev, [themeKey]: Math.min(quiz.questions.length - 1, (prev[themeKey] ?? 0) + 1) }))}>
                                      Следующий вопрос
                                    </Button>
                                  ) : (
                                    <Button variant="contained" disabled={!allQuestionsAnswered || mutation.isPending} onClick={() => mutation.mutate()}>
                                      {mutation.isPending ? 'Проверяем...' : 'Завершить тест'}
                                    </Button>
                                  )}
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid size={{ xs: 12, xl: 3 }}>
                          <Stack spacing={1.5}>
                            <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                              <CardContent sx={{ p: 2 }}>
                                <Stack spacing={1.25}>
                                  <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-muted)' }}>Навигация</Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {quiz.questions.map((question, index) => (
                                      <Chip
                                        key={question.id ?? index}
                                        label={`${index + 1}`}
                                        color={index === currentQuestionPosition - 1 ? 'primary' : (answersForTheme[question.id ?? -1]?.length > 0) ? 'success' : 'default'}
                                        variant={index === currentQuestionPosition - 1 ? 'filled' : 'outlined'}
                                        onClick={() => setCurrentQuestionIndex((prev) => ({ ...prev, [themeKey]: index }))}
                                      />
                                    ))}
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary">Лучший результат: {bestAttempt}/{quiz.questions.length}</Typography>
                                  {lastAttempt ? <Typography variant="body2" color="text.secondary">Последняя попытка: {new Date(lastAttempt.created_at).toLocaleString()}</Typography> : null}
                                </Stack>
                              </CardContent>
                            </Card>
                            <Button variant="outlined" startIcon={<ArticleRoundedIcon />} onClick={() => setPhase('materials')}>
                              Вернуться к материалам
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    ) : null}

                    {currentSubmission ? (
                      <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha('#059669', 0.08), border: `1px solid ${alpha('#059669', 0.24)}` }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <CheckCircleRoundedIcon sx={{ color: '#059669' }} />
                          <Box>
                            <Typography fontWeight={700} color="success.main">Тест завершён</Typography>
                            <Typography variant="body2" color="text.secondary">Результат: {currentSubmission.score} из {currentSubmission.total_questions}</Typography>
                          </Box>
                          {nextThemeIndex !== null ? (
                            <Button variant="contained" color="success" sx={{ ml: 'auto' }} endIcon={<NavigateNextRoundedIcon />} onClick={() => switchTheme(nextThemeIndex)}>
                              Следующая тема
                            </Button>
                          ) : null}
                        </Stack>
                      </Box>
                    ) : null}

                    {mutation.isError ? <Alert severity="error">Не удалось отправить тест.</Alert> : null}
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </Stack>
    </Container>
  );
}
