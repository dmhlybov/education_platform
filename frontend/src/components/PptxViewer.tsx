import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Alert, Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

type Slide = {
  number: number;
  title: string | null;
  texts: string[];
};

type Props = {
  fileUrl: string;
};

export function PptxViewer({ fileUrl }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch<{ slides: Slide[]; total: number }>(
          `/api/uploads/pptx-preview?file=${encodeURIComponent(fileUrl)}`
        );
        if (cancelled) return;
        setSlides(data.slides);
        setCurrent(0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось загрузить презентацию');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [fileUrl]);

  if (error) return <Alert severity="error">{error}</Alert>;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!slides.length) return <Alert severity="info">Презентация не содержит слайдов.</Alert>;

  const slide = slides[current];

  return (
    <Box>
      <Box
        sx={{
          minHeight: 280,
          p: { xs: 2.5, md: 4 },
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'text.disabled',
            mb: 1.5,
          }}
        >
          Слайд {slide.number} из {slides.length}
        </Typography>
        {slide.title && (
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, lineHeight: 1.3 }}>
            {slide.title}
          </Typography>
        )}
        <Stack spacing={0.75}>
          {slide.texts.map((t, i) => (
            <Typography key={i} variant="body1" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
              {t}
            </Typography>
          ))}
          {!slide.title && !slide.texts.length && (
            <Typography color="text.disabled" fontStyle="italic">
              Слайд не содержит текста
            </Typography>
          )}
        </Stack>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}
      >
        <IconButton onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}>
          <NavigateBeforeRoundedIcon />
        </IconButton>
        <Stack direction="row" spacing={0.5}>
          {slides.map((_, i) => (
            <Box
              key={i}
              onClick={() => setCurrent(i)}
              sx={{
                width: i === current ? 20 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === current ? 'primary.main' : 'action.disabled',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </Stack>
        <IconButton
          onClick={() => setCurrent((p) => Math.min(slides.length - 1, p + 1))}
          disabled={current === slides.length - 1}
        >
          <NavigateNextRoundedIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
