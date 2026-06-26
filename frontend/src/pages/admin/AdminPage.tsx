import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import AudiotrackRoundedIcon from '@mui/icons-material/AudiotrackRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import LibraryAddCheckRoundedIcon from '@mui/icons-material/LibraryAddCheckRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import PlayLessonRoundedIcon from '@mui/icons-material/PlayLessonRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import SmartDisplayRoundedIcon from '@mui/icons-material/SmartDisplayRounded';
import TopicRoundedIcon from '@mui/icons-material/TopicRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, FormEvent, useId, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { adminLoginAs, changePassword, createUser, getStudents, linkBitrix, switchActive, switchSuperuser } from '../../api/auth';
import { useAuth } from '../../app/AuthContext';
import {
  assignCourse,
  createCourse,
  deleteCourse,
  getCourse,
  getCourses,
  updateCourse,
  uploadDocument,
  uploadMedia,
  uploadScorm,
} from '../../api/courses';

type Question = {
  prompt: string;
  position: number;
  options: string[];
  correct_option_indices: number[];
};

type ThemeLesson = { title: string; content_type: string; content: string; position: number };

type ThemeQuiz = { title: string; description: string; questions: Question[] };

type Theme = {
  title: string;
  description: string;
  position: number;
  lessons: ThemeLesson[];
  quiz: ThemeQuiz;
};

type Payload = { title: string; description: string; themes: Theme[] };

const createDefaultQuestion = (position: number): Question => ({
  prompt: '',
  position,
  options: ['', '', ''],
  correct_option_indices: [],
});

const createDefaultTheme = (position: number): Theme => ({
  title: `Тема ${position}`,
  description: 'Краткое описание темы.',
  position,
  lessons: [
    { title: 'Текстовый урок', content_type: 'text', content: '', position: 1 },
    { title: 'Видео-урок', content_type: 'video', content: '', position: 2 },
    { title: 'Аудио-урок', content_type: 'audio', content: '', position: 3 },
    { title: 'Документ', content_type: 'document', content: '', position: 4 },
    { title: 'SCORM пакет', content_type: 'scorm', content: '', position: 5 },
  ],
  quiz: {
    title: `Тест по теме ${position}`,
    description: 'Проверьте понимание ключевых идей темы.',
    questions: [createDefaultQuestion(1)],
  },
});

const defaultPayload: Payload = {
  title: 'Новый курс',
  description: 'Описание нового курса.',
  themes: [createDefaultTheme(1)],
};

const materialMeta = [
  { key: 'text', title: 'Текстовый урок', icon: <ArticleRoundedIcon color="primary" />, hint: 'Краткая теория, пояснение и конспект темы.', accept: undefined, uploadLabel: undefined },
  { key: 'video', title: 'Видео', icon: <SmartDisplayRoundedIcon color="primary" />, hint: 'Ссылка на YouTube, или загрузите видеофайл.', accept: 'video/*', uploadLabel: 'Загрузить видео' },
  { key: 'audio', title: 'Аудио', icon: <AudiotrackRoundedIcon color="primary" />, hint: 'Аудиоверсия лекции — или загрузите файл.', accept: 'audio/*', uploadLabel: 'Загрузить аудио' },
  { key: 'document', title: 'Документ', icon: <DescriptionRoundedIcon color="primary" />, hint: 'PDF или DOCX для встроенного просмотра.', accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx', uploadLabel: 'Загрузить документ' },
  { key: 'scorm', title: 'SCORM пакет', icon: <SchoolRoundedIcon color="primary" />, hint: 'ZIP-пакет в формате SCORM 1.2/2004.', accept: '.zip', uploadLabel: 'Загрузить SCORM (.zip)' },
] as const;

function getThemeCompletion(theme: Theme): number {
  const lessonFields = theme.lessons.filter((l) => l.content?.trim()).length;
  const questionFields = theme.quiz.questions.filter(
    (q) => q.prompt.trim() && q.options.some((o) => o.trim()) && q.correct_option_indices.length > 0,
  ).length;
  const completed = lessonFields + questionFields + (theme.title.trim() ? 1 : 0) + (theme.description.trim() ? 1 : 0);
  const total = theme.lessons.length + theme.quiz.questions.length + 2;
  return total === 0 ? 100 : Math.round((completed / total) * 100);
}

function getQuestionCompletion(question: Question): number {
  const filledOptions = question.options.filter((o) => o.trim()).length;
  const hasCorrect = question.correct_option_indices.length > 0;
  const completed = (question.prompt.trim() ? 1 : 0) + filledOptions + (hasCorrect ? 1 : 0);
  const total = 1 + question.options.length + 1;
  return Math.min(100, Math.round((completed / total) * 100));
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const { token, user, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const statusRegionId = useId();
  const [activeTab, setActiveTab] = useState(0);
  const [payload, setPayload] = useState<Payload>(defaultPayload);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [editingCourseId, setEditingCourseId] = useState<number | ''>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, string>>({});
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [newUser, setNewUser] = useState({ email: '', password: '', first_name: '', second_name: '', is_admin: false, bitrix_user_id: '' });
  const [bitrixInputs, setBitrixInputs] = useState<Record<number, string>>({});
  const [passwordInputs, setPasswordInputs] = useState<Record<number, string>>({});
  const [expandedPasswordIds, setExpandedPasswordIds] = useState<Set<number>>(new Set());

  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: getCourses });
  const studentsQuery = useQuery({ queryKey: ['students'], queryFn: getStudents });
  const editCourseQuery = useQuery({
    queryKey: ['edit-course', editingCourseId],
    queryFn: () => getCourse(Number(editingCourseId)),
    enabled: Boolean(editingCourseId),
  });

  const createMutation = useMutation({
    mutationFn: () => createCourse(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['courses'] }); },
  });
  const assignMutation = useMutation({ mutationFn: () => assignCourse(Number(selectedCourseId), Number(selectedStudentId)) });
  const updateMutation = useMutation({
    mutationFn: () => updateCourse(Number(editingCourseId), payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['courses'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCourse(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      setConfirmDeleteId(null);
      if (editingCourseId === deleteMutation.variables) {
        setEditingCourseId('');
        setPayload(defaultPayload);
        setActiveThemeIndex(0);
        setActiveQuestionIndex(0);
      }
    },
  });
  const createUserMutation = useMutation({
    mutationFn: () => createUser({ ...newUser, bitrix_user_id: newUser.bitrix_user_id.trim() || null }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['students'] }); },
  });

  const linkBitrixMutation = useMutation({
    mutationFn: ({ userId, bitrixId }: { userId: number; bitrixId: string | null }) =>
      linkBitrix(userId, bitrixId),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['students'] }); },
  });

  const switchActiveMutation = useMutation({
    mutationFn: (id: number) => switchActive(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['students'] }); },
  });

  const switchSuperuserMutation = useMutation({
    mutationFn: (id: number) => switchSuperuser(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['students'] }); },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => changePassword(id, password),
    onSuccess: (_, { id }) => {
      setPasswordInputs((prev) => ({ ...prev, [id]: '' }));
      setExpandedPasswordIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: (id: number) => adminLoginAs(id),
    onSuccess: async (data) => { await loginWithToken(data.access_token); navigate('/'); },
  });

  if (user && !user.is_admin) {
    return (
      <Stack spacing={3}>
        <Alert severity="warning">
          <Typography fontWeight={700}>Нет доступа к разделу администрирования</Typography>
          <Typography variant="body2">У вас нет прав для просмотра этого раздела.</Typography>
        </Alert>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap>
          <Button component={RouterLink} to="/" variant="contained">На главную</Button>
          <Button component={RouterLink} to="/courses" variant="outlined">Открыть курсы</Button>
        </Stack>
      </Stack>
    );
  }

  const courseOptions = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const studentOptions = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const currentTheme = payload.themes[activeThemeIndex] ?? payload.themes[0];
  const themeLessons = currentTheme.lessons;
  const themeQuiz = currentTheme.quiz;
  const currentQuestion = themeQuiz.questions.length > 0
    ? themeQuiz.questions[activeQuestionIndex] ?? themeQuiz.questions[0]
    : undefined;
  const themeCompletion = getThemeCompletion(currentTheme);
  const questionCompletion = currentQuestion ? getQuestionCompletion(currentQuestion) : 100;
  const readyThemesCount = payload.themes.filter((t) => getThemeCompletion(t) >= 80).length;
  const totalQuestions = payload.themes.reduce((sum, t) => sum + t.quiz.questions.length, 0);
  const filledMaterials = payload.themes.reduce((sum, t) => sum + t.lessons.filter((l) => l.content?.trim()).length, 0);
  const editorBusy = createMutation.isPending || updateMutation.isPending || editCourseQuery.isLoading;

  const courseEditorStatusSeverity = createMutation.isError || updateMutation.isError
    ? 'error' : createMutation.isSuccess || updateMutation.isSuccess ? 'success' : editCourseQuery.isLoading ? 'info' : null;
  const courseEditorStatusMessage = createMutation.isError
    ? 'Не удалось сохранить курс.'
    : updateMutation.isError ? 'Не удалось обновить курс.'
    : createMutation.isSuccess ? 'Курс создан успешно.'
    : updateMutation.isSuccess ? 'Изменения сохранены.'
    : editCourseQuery.isLoading ? 'Загружаем данные курса...'
    : null;

  const updateCurrentTheme = (updater: (t: Theme) => Theme) => {
    setPayload((prev) => ({
      ...prev,
      themes: prev.themes.map((t, idx) => (idx === activeThemeIndex ? updater(t) : t)),
    }));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (editingCourseId) { updateMutation.mutate(); return; }
    createMutation.mutate();
  };

  const loadCourseForEdit = () => {
    if (!editCourseQuery.data) return;
    const course = editCourseQuery.data;
    const incomingThemes: Theme[] = course.themes?.length
      ? course.themes.map((theme, idx) => {
          const themeQuizData = theme.quizzes[0];
          const normalizedLessons: ThemeLesson[] = [
            theme.lessons.find((l) => l.content_type === 'text') || { title: 'Текстовый урок', content_type: 'text', content: '', position: 1 },
            theme.lessons.find((l) => l.content_type === 'video') || { title: 'Видео-урок', content_type: 'video', content: '', position: 2 },
            theme.lessons.find((l) => l.content_type === 'audio') || { title: 'Аудио-урок', content_type: 'audio', content: '', position: 3 },
            theme.lessons.find((l) => l.content_type === 'document') || { title: 'Документ', content_type: 'document', content: '', position: 4 },
            theme.lessons.find((l) => l.content_type === 'scorm') || { title: 'SCORM пакет', content_type: 'scorm', content: '', position: 5 },
          ];
          const normalizedQuestions: Question[] = themeQuizData?.questions?.length
            ? themeQuizData.questions.map((q) => ({
                prompt: q.prompt,
                position: q.position,
                options: q.options.map((o: { text: string }) => o.text),
                correct_option_indices: [],
              }))
            : [];
          return {
            title: theme.title || `Тема ${idx + 1}`,
            description: theme.description || '',
            position: theme.position || idx + 1,
            lessons: normalizedLessons,
            quiz: {
              title: themeQuizData?.title || `Тест по теме ${idx + 1}`,
              description: themeQuizData?.description || '',
              questions: normalizedQuestions,
            },
          };
        })
      : [createDefaultTheme(1)];
    setActiveThemeIndex(0);
    setActiveQuestionIndex(0);
    setPayload({ title: course.title, description: course.description, themes: incomingThemes });
  };

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    lessonIndex: number,
    uploadFn: (file: File, token: string) => Promise<{ url: string; filename?: string; package?: string }>,
    stateKey: string,
    loadingMsg: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setUploadStates((prev) => ({ ...prev, [stateKey]: loadingMsg }));
    try {
      const result = await uploadFn(file, token);
      updateCurrentTheme((theme) => ({
        ...theme,
        lessons: theme.lessons.map((item, idx) =>
          idx === lessonIndex ? { ...item, content: result.url, title: (result as { title?: string }).title || item.title } : item,
        ),
      }));
      setUploadStates((prev) => ({ ...prev, [stateKey]: `Загружено: ${result.filename ?? (result as { package?: string }).package ?? file.name}` }));
    } catch {
      setUploadStates((prev) => ({ ...prev, [stateKey]: 'Ошибка загрузки.' }));
    }
    event.target.value = '';
  };

  const handleAddTheme = () => {
    const nextPos = payload.themes.length + 1;
    setPayload((prev) => ({ ...prev, themes: [...prev.themes, createDefaultTheme(nextPos)] }));
    setActiveThemeIndex(payload.themes.length);
    setActiveQuestionIndex(0);
  };

  const handleAddQuestion = () => {
    updateCurrentTheme((theme) => ({
      ...theme,
      quiz: {
        ...theme.quiz,
        questions: [...theme.quiz.questions, createDefaultQuestion(theme.quiz.questions.length + 1)],
      },
    }));
    setActiveQuestionIndex(themeQuiz.questions.length);
  };

  const handleRemoveQuestion = () => {
    if (themeQuiz.questions.length === 0) return;
    updateCurrentTheme((theme) => ({
      ...theme,
      quiz: {
        ...theme.quiz,
        questions: theme.quiz.questions
          .filter((_, idx) => idx !== activeQuestionIndex)
          .map((q, idx) => ({ ...q, position: idx + 1 })),
      },
    }));
    setActiveQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleAddOption = () => {
    updateCurrentTheme((theme) => ({
      ...theme,
      quiz: {
        ...theme.quiz,
        questions: theme.quiz.questions.map((q, idx) =>
          idx === activeQuestionIndex ? { ...q, options: [...q.options, ''] } : q,
        ),
      },
    }));
  };

  const handleRemoveOption = (optionIndex: number) => {
    updateCurrentTheme((theme) => ({
      ...theme,
      quiz: {
        ...theme.quiz,
        questions: theme.quiz.questions.map((q, idx) =>
          idx === activeQuestionIndex
            ? {
                ...q,
                options: q.options.filter((_, i) => i !== optionIndex),
                correct_option_indices: q.correct_option_indices
                  .filter((ci) => ci !== optionIndex)
                  .map((ci) => (ci > optionIndex ? ci - 1 : ci)),
              }
            : q,
        ),
      },
    }));
  };

  const toggleCorrectOption = (optionIndex: number, checked: boolean) => {
    updateCurrentTheme((theme) => ({
      ...theme,
      quiz: {
        ...theme.quiz,
        questions: theme.quiz.questions.map((q, idx) =>
          idx === activeQuestionIndex
            ? {
                ...q,
                correct_option_indices: checked
                  ? [...q.correct_option_indices, optionIndex]
                  : q.correct_option_indices.filter((ci) => ci !== optionIndex),
              }
            : q,
        ),
      },
    }));
  };

  const uploadHandlers = [
    undefined,
    (e: ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 1, uploadMedia, 'video', 'Загружаем видео...'),
    (e: ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 2, uploadMedia, 'audio', 'Загружаем аудио...'),
    (e: ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 3, uploadDocument, 'document', 'Загружаем документ...'),
    (e: ChangeEvent<HTMLInputElement>) => handleFileUpload(e, 4, (f, t) => uploadScorm(f, t).then((r) => ({ url: r.url, filename: r.package })), 'scorm', 'Распаковываем SCORM...'),
  ] as const;

  return (
    <Stack spacing={0}>
      {/* Hero */}
      <Card className="app-page-hero" sx={{ borderRadius: { md: '12px 12px 0 0' } }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
            <Chip icon={<AutoAwesomeRoundedIcon />} label="Панель администратора" sx={{ alignSelf: 'flex-start' }} />
            <Typography variant="h3">Операционный центр</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`${courseOptions.length} курсов`} sx={{ bgcolor: 'rgba(79,142,247,0.12)', color: 'var(--app-color-primary)' }} />
              <Chip label={`${studentOptions.length} учеников`} sx={{ bgcolor: 'rgba(79,142,247,0.12)', color: 'var(--app-color-primary)' }} />
              <Chip label={`${readyThemesCount} готовых тем`} sx={{ bgcolor: 'rgba(79,142,247,0.12)', color: 'var(--app-color-primary)' }} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid var(--app-border)', bgcolor: 'var(--app-surface)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: { xs: 1, md: 2 },
            '& .MuiTab-root': { fontWeight: 600, fontSize: '0.82rem', minHeight: 48, textTransform: 'none', letterSpacing: '-0.01em' },
            '& .MuiTabs-indicator': { height: 2, borderRadius: '2px 2px 0 0' },
          }}
        >
          <Tab icon={<LibraryAddCheckRoundedIcon sx={{ fontSize: 18 }} />} label="Курсы" iconPosition="start" />
          <Tab icon={<SchoolRoundedIcon sx={{ fontSize: 18 }} />} label="Назначения" iconPosition="start" />
          <Tab icon={<Groups2RoundedIcon sx={{ fontSize: 18 }} />} label="Пользователи" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ pt: 3 }}>
        {/* ── TAB 0: КУРСЫ ── */}
        {activeTab === 0 && (
          <Stack spacing={3}>
            {/* Metrics */}
            <Grid container spacing={2}>
              {[
                { label: 'Тема', value: `${activeThemeIndex + 1} / ${payload.themes.length}`, hint: currentTheme.title || 'Без названия' },
                { label: 'Готовность', value: `${themeCompletion}%`, hint: 'Заголовок, описание, материалы и вопросы' },
                { label: 'Вопросов', value: themeQuiz.questions.length > 0 ? `${activeQuestionIndex + 1} / ${themeQuiz.questions.length}` : '—', hint: themeQuiz.questions.length > 0 ? `Готовность вопроса ${questionCompletion}%` : 'Ознакомительная тема' },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 12, md: 4 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-text-muted)', mb: 0.5 }}>{item.label}</Typography>
                      <Typography variant="h4">{item.value}</Typography>
                      <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, lineHeight: 1.5 }}>{item.hint}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Stack spacing={3} component="form" onSubmit={onSubmit} aria-busy={editorBusy}>
              {/* Course scaffold */}
              <Card>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
                      <Stack spacing={0.5}>
                        <Typography variant="h5">Каркас курса</Typography>
                        <Typography color="text.secondary" variant="body2">Выберите режим работы, затем заполните поля.</Typography>
                      </Stack>
                      <Chip label={editingCourseId ? 'Редактирование' : 'Новый курс'} color={editingCourseId ? 'secondary' : 'primary'} variant="outlined" />
                    </Stack>

                    <TextField
                      select label="Редактировать существующий курс"
                      value={editingCourseId}
                      onChange={(e) => setEditingCourseId(e.target.value === '' ? '' : Number(e.target.value))}
                      fullWidth
                    >
                      <MenuItem value="">— Новый курс —</MenuItem>
                      {courseOptions.map((c) => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
                    </TextField>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                      <Button
                        variant="outlined"
                        onClick={loadCourseForEdit}
                        disabled={!editingCourseId || editCourseQuery.isLoading}
                        startIcon={editCourseQuery.isLoading ? <CircularProgress size={18} color="inherit" /> : undefined}
                      >
                        {editCourseQuery.isLoading ? 'Загружаем...' : 'Загрузить в редактор'}
                      </Button>
                      {editingCourseId ? (
                        <>
                          <Button variant="text" onClick={() => { setEditingCourseId(''); setPayload(defaultPayload); setActiveThemeIndex(0); setActiveQuestionIndex(0); }}>
                            Сбросить и создать новый
                          </Button>
                          {confirmDeleteId === editingCourseId ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 0.75, borderRadius: 2, border: '1px solid', borderColor: 'error.main', bgcolor: 'rgba(239,68,68,0.06)' }}>
                              <WarningAmberRoundedIcon sx={{ fontSize: 18, color: 'error.main' }} />
                              <Typography variant="body2" color="error.main" fontWeight={600}>Удалить курс?</Typography>
                              <Button size="small" color="error" variant="contained" onClick={() => deleteMutation.mutate(Number(editingCourseId))} disabled={deleteMutation.isPending} startIcon={deleteMutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}>
                                {deleteMutation.isPending ? '...' : 'Да, удалить'}
                              </Button>
                              <Button size="small" variant="text" onClick={() => setConfirmDeleteId(null)}>Отмена</Button>
                            </Stack>
                          ) : (
                            <Button variant="outlined" color="error" startIcon={<DeleteRoundedIcon />} onClick={() => setConfirmDeleteId(Number(editingCourseId))}>
                              Удалить курс
                            </Button>
                          )}
                        </>
                      ) : null}
                    </Stack>

                    <TextField label="Название курса" value={payload.title} onChange={(e) => setPayload((prev) => ({ ...prev, title: e.target.value }))} fullWidth />
                    <TextField label="Описание курса" value={payload.description} onChange={(e) => setPayload((prev) => ({ ...prev, description: e.target.value }))} fullWidth multiline minRows={2} />
                  </Stack>
                </CardContent>
              </Card>

              {/* Theme editor */}
              <Grid container spacing={3}>
                {/* Left: theme list */}
                <Grid size={{ xs: 12, lg: 3 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TopicRoundedIcon color="primary" sx={{ fontSize: 20 }} />
                          <Typography variant="h6">Темы</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {payload.themes.map((theme, index) => {
                            const completion = getThemeCompletion(theme);
                            const isActive = index === activeThemeIndex;
                            return (
                              <Box
                                key={index}
                                component="button"
                                type="button"
                                onClick={() => { setActiveThemeIndex(index); setActiveQuestionIndex(0); }}
                                sx={{
                                  width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer',
                                  p: 1.5, borderRadius: 2, border: isActive ? '1px solid rgba(79,142,247,0.4)' : '1px solid var(--app-border)',
                                  bgcolor: isActive ? 'rgba(79,142,247,0.08)' : 'transparent',
                                  '&:hover': { borderColor: 'rgba(79,142,247,0.3)', bgcolor: 'rgba(79,142,247,0.05)' },
                                  transition: 'all 140ms ease',
                                }}
                              >
                                <Stack spacing={1}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight={700} sx={{ color: isActive ? 'primary.main' : 'text.primary' }}>
                                      {index + 1}. {theme.title || `Тема ${index + 1}`}
                                    </Typography>
                                    <Chip size="small" label={`${completion}%`} color={completion >= 80 ? 'success' : completion >= 40 ? 'warning' : 'default'} />
                                  </Stack>
                                  <LinearProgress variant="determinate" value={completion} sx={{ height: 3, borderRadius: 999 }} />
                                </Stack>
                              </Box>
                            );
                          })}
                        </Stack>
                        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={handleAddTheme} fullWidth>
                          Добавить тему
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Right: theme content */}
                <Grid size={{ xs: 12, lg: 9 }}>
                  <Stack spacing={3}>
                    {/* Theme meta */}
                    <Card>
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip size="small" label={`Тема ${activeThemeIndex + 1}`} color="secondary" />
                              <Typography variant="h6">{currentTheme.title || `Тема ${activeThemeIndex + 1}`}</Typography>
                            </Stack>
                            <Chip label={`Готовность ${themeCompletion}%`} variant="outlined" color="primary" size="small" />
                          </Stack>
                          <LinearProgress variant="determinate" value={themeCompletion} sx={{ height: 6, borderRadius: 999 }} />
                          <TextField label="Название темы" value={currentTheme.title} onChange={(e) => updateCurrentTheme((t) => ({ ...t, title: e.target.value }))} fullWidth />
                          <TextField label="Описание темы" value={currentTheme.description} onChange={(e) => updateCurrentTheme((t) => ({ ...t, description: e.target.value }))} fullWidth multiline minRows={2} />
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Materials — full-width vertical list */}
                    <Card>
                      <CardContent>
                        <Stack spacing={2.5}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PlayLessonRoundedIcon color="primary" sx={{ fontSize: 20 }} />
                            <Box>
                              <Typography variant="h6">Материалы темы</Typography>
                              <Typography variant="body2" color="text.secondary">Заполните один или несколько типов контента.</Typography>
                            </Box>
                          </Stack>

                          <Stack spacing={2}>
                            {materialMeta.map((meta, index) => {
                              const lesson = themeLessons[index];
                              const hasContent = Boolean(lesson?.content?.trim());
                              const stateKey = meta.key;
                              const uploadState = uploadStates[stateKey];
                              const isUploading = uploadState === 'Загружаем видео...' || uploadState === 'Загружаем аудио...' || uploadState === 'Загружаем документ...' || uploadState === 'Распаковываем SCORM...';

                              return (
                                <Box
                                  key={meta.key}
                                  sx={{
                                    border: `1px solid ${hasContent ? 'rgba(34,197,94,0.3)' : 'var(--app-border)'}`,
                                    borderRadius: 2.5,
                                    p: 2,
                                    transition: 'border-color 160ms ease',
                                  }}
                                >
                                  <Stack spacing={1.5}>
                                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                                      <Stack direction="row" spacing={1.25} alignItems="center">
                                        {meta.icon}
                                        <Box>
                                          <Typography fontWeight={700}>{meta.title}</Typography>
                                          <Typography variant="body2" color="text.secondary">{meta.hint}</Typography>
                                        </Box>
                                      </Stack>
                                      <Chip size="small" color={hasContent ? 'success' : 'default'} label={hasContent ? 'Готово' : 'Пусто'} />
                                    </Stack>

                                    <TextField
                                      label={meta.key === 'text' ? 'Текст материала' : `URL — ${meta.title}`}
                                      placeholder={meta.key === 'text' ? 'Введите текст лекции...' : 'https://...'}
                                      value={lesson?.content || ''}
                                      onChange={(e) => updateCurrentTheme((t) => ({
                                        ...t,
                                        lessons: t.lessons.map((item, idx) => idx === index ? { ...item, content: e.target.value } : item),
                                      }))}
                                      fullWidth
                                      multiline={meta.key === 'text'}
                                      minRows={meta.key === 'text' ? 8 : 1}
                                    />

                                    {meta.uploadLabel ? (
                                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                                        <Button
                                          variant="outlined"
                                          component="label"
                                          disabled={!token || isUploading}
                                          startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileRoundedIcon />}
                                          size="small"
                                        >
                                          {isUploading ? 'Загружаем...' : meta.uploadLabel}
                                          <input hidden type="file" accept={meta.accept} onChange={uploadHandlers[index as 1 | 2 | 3 | 4]} />
                                        </Button>
                                        {uploadState && !isUploading ? (
                                          <Typography variant="body2" color={uploadState.startsWith('Ошибка') ? 'error.main' : 'success.main'}>
                                            {uploadState}
                                          </Typography>
                                        ) : null}
                                      </Stack>
                                    ) : null}
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>

                          {!token ? <Alert severity="warning">Загрузка файлов доступна только в авторизованной сессии.</Alert> : null}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Quiz editor */}
                    <Card>
                      <CardContent>
                        <Stack spacing={2.5}>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <QuizRoundedIcon color="primary" sx={{ fontSize: 20 }} />
                              <Box>
                                <Typography variant="h6">Тест темы</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {themeQuiz.questions.length === 0
                                    ? 'Ознакомительная тема — без теста.'
                                    : `${themeQuiz.questions.length} вопросов · вопрос ${activeQuestionIndex + 1} активен`}
                                </Typography>
                              </Box>
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Button size="small" variant="outlined" onClick={() => setActiveQuestionIndex((p) => Math.max(0, p - 1))} disabled={activeQuestionIndex === 0 || themeQuiz.questions.length === 0}>←</Button>
                              <Button size="small" variant="outlined" onClick={() => setActiveQuestionIndex((p) => Math.min(themeQuiz.questions.length - 1, p + 1))} disabled={activeQuestionIndex >= themeQuiz.questions.length - 1 || themeQuiz.questions.length === 0}>→</Button>
                              <Button size="small" variant="outlined" color="success" onClick={handleAddQuestion}>+ Вопрос</Button>
                              <Button size="small" variant="outlined" color="error" onClick={handleRemoveQuestion} disabled={themeQuiz.questions.length === 0}>Удалить</Button>
                            </Stack>
                          </Stack>

                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 8 }}>
                              <TextField label="Название теста" value={themeQuiz.title} onChange={(e) => updateCurrentTheme((t) => ({ ...t, quiz: { ...t.quiz, title: e.target.value } }))} fullWidth />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <TextField label="Описание теста" value={themeQuiz.description} onChange={(e) => updateCurrentTheme((t) => ({ ...t, quiz: { ...t.quiz, description: e.target.value } }))} fullWidth />
                            </Grid>
                          </Grid>

                          {themeQuiz.questions.length === 0 ? (
                            <Alert severity="info">
                              Тема без вопросов — студент перейдёт к следующей теме после просмотра всех материалов. Нажмите «+ Вопрос» чтобы добавить тест.
                            </Alert>
                          ) : (
                            <>
                              {/* Question navigation chips */}
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {themeQuiz.questions.map((q, i) => {
                                  const comp = getQuestionCompletion(q);
                                  return (
                                    <Chip
                                      key={i}
                                      label={`${i + 1} · ${comp}%`}
                                      color={i === activeQuestionIndex ? 'primary' : comp === 100 ? 'success' : 'default'}
                                      variant={i === activeQuestionIndex ? 'filled' : 'outlined'}
                                      onClick={() => setActiveQuestionIndex(i)}
                                      size="small"
                                    />
                                  );
                                })}
                              </Stack>

                              {currentQuestion ? (
                                <Box sx={{ border: '1px solid rgba(79,142,247,0.2)', borderRadius: 2.5, p: 2, bgcolor: 'rgba(79,142,247,0.03)' }}>
                                  <Stack spacing={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                      <Typography fontWeight={700}>Вопрос {activeQuestionIndex + 1}</Typography>
                                      <Chip size="small" label={`Готовность ${questionCompletion}%`} color="primary" variant="outlined" />
                                    </Stack>

                                    <TextField
                                      label="Формулировка вопроса"
                                      value={currentQuestion.prompt}
                                      onChange={(e) => updateCurrentTheme((t) => ({
                                        ...t,
                                        quiz: { ...t.quiz, questions: t.quiz.questions.map((q, idx) => idx === activeQuestionIndex ? { ...q, prompt: e.target.value } : q) },
                                      }))}
                                      fullWidth multiline minRows={2}
                                    />

                                    <Divider />

                                    <Stack spacing={0.5}>
                                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                                          Варианты ответа
                                          <Tooltip title="Отметьте галочкой все правильные варианты">
                                            <Typography component="span" variant="body2" color="primary.main" sx={{ ml: 1, cursor: 'help' }}>✓ = верный</Typography>
                                          </Tooltip>
                                        </Typography>
                                        <Button size="small" startIcon={<AddRoundedIcon />} onClick={handleAddOption}>
                                          Добавить вариант
                                        </Button>
                                      </Stack>

                                      <Stack spacing={1} sx={{ mt: 1 }}>
                                        {currentQuestion.options.map((option, optionIndex) => {
                                          const isCorrect = currentQuestion.correct_option_indices.includes(optionIndex);
                                          return (
                                            <Stack key={optionIndex} direction="row" spacing={1} alignItems="center">
                                              <Tooltip title="Правильный ответ">
                                                <Checkbox
                                                  size="small"
                                                  checked={isCorrect}
                                                  onChange={(e) => toggleCorrectOption(optionIndex, e.target.checked)}
                                                  sx={{ p: 0.5 }}
                                                />
                                              </Tooltip>
                                              <TextField
                                                label={`Вариант ${optionIndex + 1}`}
                                                value={option}
                                                onChange={(e) => updateCurrentTheme((t) => ({
                                                  ...t,
                                                  quiz: {
                                                    ...t.quiz,
                                                    questions: t.quiz.questions.map((q, idx) =>
                                                      idx === activeQuestionIndex
                                                        ? { ...q, options: q.options.map((o, ci) => ci === optionIndex ? e.target.value : o) }
                                                        : q,
                                                    ),
                                                  },
                                                }))}
                                                fullWidth
                                                size="small"
                                                sx={{ '& .MuiOutlinedInput-root': { borderColor: isCorrect ? 'success.main' : undefined } }}
                                              />
                                              <IconButton
                                                size="small"
                                                onClick={() => handleRemoveOption(optionIndex)}
                                                disabled={currentQuestion.options.length <= 2}
                                                color="error"
                                              >
                                                <CloseRoundedIcon fontSize="small" />
                                              </IconButton>
                                            </Stack>
                                          );
                                        })}
                                      </Stack>
                                    </Stack>
                                  </Stack>
                                </Box>
                              ) : null}
                            </>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>

              <Box id={statusRegionId} aria-live="polite" aria-atomic="true">
                {courseEditorStatusSeverity && courseEditorStatusMessage ? (
                  <Alert severity={courseEditorStatusSeverity}>{courseEditorStatusMessage}</Alert>
                ) : null}
                {!courseEditorStatusSeverity && editorBusy ? (
                  <Alert icon={<CircularProgress size={18} color="inherit" />} severity="info">Сохраняем изменения...</Alert>
                ) : null}
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={createMutation.isPending || updateMutation.isPending}
                startIcon={createMutation.isPending || updateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Сохраняем...' : editingCourseId ? 'Сохранить изменения' : 'Создать курс'}
              </Button>
            </Stack>
          </Stack>
        )}

        {/* ── TAB 1: НАЗНАЧЕНИЯ ── */}
        {activeTab === 1 && (
          <Stack spacing={3} sx={{ maxWidth: 560 }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <SchoolRoundedIcon color="primary" />
                    <Box>
                      <Typography variant="h5">Назначение курса</Typography>
                      <Typography variant="body2" color="text.secondary">Выберите курс и ученика, затем подтвердите.</Typography>
                    </Box>
                  </Stack>

                  <TextField select label="Курс" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value === '' ? '' : Number(e.target.value))} fullWidth>
                    <MenuItem value="">— Выберите курс —</MenuItem>
                    {courseOptions.map((c) => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
                  </TextField>

                  <TextField select label="Ученик" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value === '' ? '' : Number(e.target.value))} fullWidth>
                    <MenuItem value="">— Выберите ученика —</MenuItem>
                    {studentOptions.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{[s.first_name, s.second_name].filter(Boolean).join(' ') || s.email}</MenuItem>
                    ))}
                  </TextField>

                  <Box aria-live="polite" aria-atomic="true">
                    {assignMutation.isPending ? <Alert icon={<CircularProgress size={18} color="inherit" />} severity="info">Назначаем...</Alert> : null}
                    {assignMutation.isSuccess ? <Alert severity="success">Курс назначен ученику.</Alert> : null}
                    {assignMutation.isError ? <Alert severity="error">Не удалось назначить курс.</Alert> : null}
                  </Box>

                  <Button
                    variant="contained"
                    onClick={() => assignMutation.mutate()}
                    disabled={!selectedCourseId || !selectedStudentId || assignMutation.isPending}
                    startIcon={assignMutation.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
                  >
                    {assignMutation.isPending ? 'Назначаем...' : 'Назначить курс'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* ── TAB 2: ПОЛЬЗОВАТЕЛИ ── */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Groups2RoundedIcon color="primary" />
                      <Box>
                        <Typography variant="h5">Создать пользователя</Typography>
                        <Typography variant="body2" color="text.secondary">Добавьте нового ученика или администратора.</Typography>
                      </Box>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Имя" value={newUser.first_name} onChange={(e) => setNewUser((p) => ({ ...p, first_name: e.target.value }))} fullWidth />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Фамилия" value={newUser.second_name} onChange={(e) => setNewUser((p) => ({ ...p, second_name: e.target.value }))} fullWidth />
                      </Grid>
                    </Grid>
                    <TextField label="Email" type="email" autoComplete="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} fullWidth />
                    <TextField label="Пароль" type="password" autoComplete="new-password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} fullWidth />
                    <TextField
                      label="Bitrix ID (опционально)"
                      placeholder="Например: 42"
                      value={newUser.bitrix_user_id}
                      onChange={(e) => setNewUser((p) => ({ ...p, bitrix_user_id: e.target.value }))}
                      fullWidth
                      slotProps={{ input: { startAdornment: <LayersRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} /> } }}
                      helperText="ID пользователя в корпоративном Битрикс24. Позволяет входить через SSO."
                    />
                    <FormControlLabel
                      control={<Switch checked={newUser.is_admin} onChange={(e) => setNewUser((p) => ({ ...p, is_admin: e.target.checked }))} />}
                      label="Создать как администратора"
                    />

                    <Box aria-live="polite" aria-atomic="true">
                      {createUserMutation.isPending ? <Alert icon={<CircularProgress size={18} color="inherit" />} severity="info">Создаём...</Alert> : null}
                      {createUserMutation.isError ? <Alert severity="error">Не удалось создать пользователя. Проверьте email и пароль.</Alert> : null}
                      {createUserMutation.isSuccess ? <Alert severity="success">Пользователь создан.</Alert> : null}
                    </Box>

                    <Button
                      variant="contained"
                      onClick={() => createUserMutation.mutate()}
                      disabled={createUserMutation.isPending}
                      startIcon={createUserMutation.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
                    >
                      {createUserMutation.isPending ? 'Создаём...' : 'Создать пользователя'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">Пользователи</Typography>
                      <Chip size="small" label={studentOptions.length} />
                    </Stack>
                    {studentOptions.length ? (
                      <Stack spacing={1.5}>
                        {studentOptions.map((s) => {
                          const displayName = [s.first_name, s.second_name].filter(Boolean).join(' ') || s.email;
                          const hasBitrix = Boolean(s.bitrix_user_id);
                          const editValue = bitrixInputs[s.id] ?? (s.bitrix_user_id || '');
                          const isDirty = editValue !== (s.bitrix_user_id || '');
                          const isBitrixSaving = linkBitrixMutation.isPending && (linkBitrixMutation.variables as { userId: number } | undefined)?.userId === s.id;
                          const isPasswordExpanded = expandedPasswordIds.has(s.id);
                          const passwordValue = passwordInputs[s.id] ?? '';
                          const isActive = s.is_active !== false;
                          const isActivePending = switchActiveMutation.isPending && switchActiveMutation.variables === s.id;
                          const isSuperuserPending = switchSuperuserMutation.isPending && switchSuperuserMutation.variables === s.id;
                          const isPasswordSaving = changePasswordMutation.isPending && (changePasswordMutation.variables as { id: number } | undefined)?.id === s.id;
                          const isLoginPending = adminLoginMutation.isPending && adminLoginMutation.variables === s.id;

                          return (
                            <Box key={s.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid var(--app-border)', bgcolor: isActive ? 'var(--app-surface-elevated)' : 'rgba(239,68,68,0.04)', opacity: isActive ? 1 : 0.75 }}>
                              <Stack spacing={1.25}>
                                {/* Header */}
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                  <Box>
                                    <Typography fontWeight={700} variant="body2">{displayName}</Typography>
                                    <Typography color="text.secondary" variant="body2">{s.email}</Typography>
                                  </Box>
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                    <Chip size="small" label={s.is_admin ? 'Админ' : 'Ученик'} variant="outlined" color={s.is_admin ? 'secondary' : 'default'} />
                                    {!isActive && <Chip size="small" label="Заблокирован" color="error" variant="outlined" />}
                                  </Stack>
                                </Stack>

                                {/* Action buttons */}
                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                  <Tooltip title={isActive ? 'Заблокировать' : 'Разблокировать'}>
                                    <IconButton
                                      size="small"
                                      color={isActive ? 'error' : 'success'}
                                      onClick={() => switchActiveMutation.mutate(s.id)}
                                      disabled={isActivePending}
                                    >
                                      {isActivePending ? <CircularProgress size={16} color="inherit" /> : isActive ? <BlockRoundedIcon fontSize="small" /> : <CheckCircleOutlineRoundedIcon fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title={s.is_admin ? 'Снять права администратора' : 'Выдать права администратора'}>
                                    <IconButton
                                      size="small"
                                      color={s.is_admin ? 'warning' : 'primary'}
                                      onClick={() => switchSuperuserMutation.mutate(s.id)}
                                      disabled={isSuperuserPending}
                                    >
                                      {isSuperuserPending ? <CircularProgress size={16} color="inherit" /> : <AdminPanelSettingsRoundedIcon fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Сменить пароль">
                                    <IconButton
                                      size="small"
                                      color={isPasswordExpanded ? 'primary' : 'default'}
                                      onClick={() => setExpandedPasswordIds((prev) => {
                                        const s2 = new Set(prev);
                                        if (s2.has(s.id)) s2.delete(s.id); else s2.add(s.id);
                                        return s2;
                                      })}
                                    >
                                      <KeyRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Войти как этот пользователь">
                                    <IconButton
                                      size="small"
                                      color="default"
                                      onClick={() => adminLoginMutation.mutate(s.id)}
                                      disabled={isLoginPending || !isActive}
                                    >
                                      {isLoginPending ? <CircularProgress size={16} color="inherit" /> : <LoginRoundedIcon fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>

                                  {!isActive && (
                                    <Tooltip title="Пользователь заблокирован">
                                      <PersonOffRoundedIcon sx={{ fontSize: 16, color: 'error.main', alignSelf: 'center' }} />
                                    </Tooltip>
                                  )}
                                </Stack>

                                {/* Password change (expandable) */}
                                {isPasswordExpanded ? (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                      size="small"
                                      label="Новый пароль"
                                      type="password"
                                      autoComplete="new-password"
                                      value={passwordValue}
                                      onChange={(e) => setPasswordInputs((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                      sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.82rem' } }}
                                    />
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => changePasswordMutation.mutate({ id: s.id, password: passwordValue })}
                                      disabled={isPasswordSaving || passwordValue.length < 8}
                                      startIcon={isPasswordSaving ? <CircularProgress size={14} color="inherit" /> : undefined}
                                      sx={{ flexShrink: 0 }}
                                    >
                                      {isPasswordSaving ? '...' : 'Сохранить'}
                                    </Button>
                                  </Stack>
                                ) : null}

                                {/* Bitrix ID row */}
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <TextField
                                    size="small"
                                    label="Bitrix ID"
                                    placeholder="не привязан"
                                    value={editValue}
                                    onChange={(e) => setBitrixInputs((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                    sx={{ flex: 1, '& .MuiInputBase-root': { fontSize: '0.82rem' } }}
                                    slotProps={{
                                      input: {
                                        startAdornment: hasBitrix && !isDirty
                                          ? <LinkRoundedIcon sx={{ fontSize: 14, color: 'success.main', mr: 0.5 }} />
                                          : <LayersRoundedIcon sx={{ fontSize: 14, color: 'text.disabled', mr: 0.5 }} />,
                                      },
                                    }}
                                  />
                                  {isDirty ? (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => linkBitrixMutation.mutate({ userId: s.id, bitrixId: editValue.trim() || null })}
                                      disabled={isBitrixSaving}
                                      startIcon={isBitrixSaving ? <CircularProgress size={14} color="inherit" /> : undefined}
                                      sx={{ flexShrink: 0, minHeight: 36 }}
                                    >
                                      {isBitrixSaving ? '...' : 'Сохранить'}
                                    </Button>
                                  ) : hasBitrix ? (
                                    <Tooltip title="Отвязать Bitrix ID">
                                      <IconButton size="small" color="error" onClick={() => { setBitrixInputs((prev) => ({ ...prev, [s.id]: '' })); linkBitrixMutation.mutate({ userId: s.id, bitrixId: null }); }} disabled={isBitrixSaving}>
                                        <LinkOffRoundedIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  ) : null}
                                </Stack>

                                {linkBitrixMutation.isError && (linkBitrixMutation.variables as { userId: number } | undefined)?.userId === s.id ? (
                                  <Typography variant="caption" color="error.main">{(linkBitrixMutation.error as Error)?.message || 'Ошибка при сохранении'}</Typography>
                                ) : null}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Alert severity="info">Список пользователей пока пуст.</Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Stack>
  );
}
