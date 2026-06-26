import { Alert, Box, CircularProgress, Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

type Props = {
  fileUrl: string;
};

export function XlsxViewer({ fileUrl }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Не удалось загрузить файл');
        const data = await response.arrayBuffer();
        if (cancelled) return;

        const workbook = XLSX.read(data, { type: 'array' });
        const parsed = workbook.SheetNames.map((name) => ({
          name,
          html: XLSX.utils.sheet_to_html(workbook.Sheets[name]),
        }));
        setSheets(parsed);
        setActiveSheet(0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка при открытии файла');
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

  return (
    <Box>
      {sheets.length > 1 && (
        <Tabs
          value={activeSheet}
          onChange={(_, v) => setActiveSheet(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
        >
          {sheets.map((s, i) => (
            <Tab key={i} label={s.name} />
          ))}
        </Tabs>
      )}
      <Box
        sx={{
          overflow: 'auto',
          maxHeight: 560,
          p: 1.5,
          '& table': {
            borderCollapse: 'collapse',
            fontSize: '0.82rem',
            minWidth: '100%',
          },
          '& td, & th': {
            border: '1px solid',
            borderColor: 'divider',
            px: 1,
            py: 0.5,
            whiteSpace: 'nowrap',
          },
          '& th': {
            bgcolor: 'action.hover',
            fontWeight: 600,
          },
        }}
        dangerouslySetInnerHTML={{ __html: sheets[activeSheet]?.html ?? '' }}
      />
    </Box>
  );
}
