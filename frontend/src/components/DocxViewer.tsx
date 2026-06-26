import { Alert, Box, CircularProgress } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

type Props = {
  fileUrl: string;
};

export function DocxViewer({ fileUrl }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          setError('DOCX рендерится слишком долго или не поддерживается в текущем окружении');
          setLoading(false);
        }
      }, 8000);
      if (!containerRef.current) return;
      setLoading(true);
      setError('');
      containerRef.current.innerHTML = '';

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Не удалось загрузить DOCX');
        const blob = await response.blob();
        if (cancelled || !containerRef.current) return;

        await renderAsync(blob, containerRef.current, undefined, {
          className: 'docx-viewer',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
        });
        window.clearTimeout(timeoutId);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось отобразить DOCX');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ position: 'relative', minHeight: 240 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}
      <Box
        ref={containerRef}
        sx={{
          maxHeight: 520,
          overflowY: 'auto',
          overflowX: 'hidden',
          '& .docx-wrapper': { background: '#eef4ff', padding: 2 },
          '& .docx': { marginInline: 'auto', maxWidth: '100%' },
        }}
      />
    </Box>
  );
}
