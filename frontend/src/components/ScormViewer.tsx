import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';

function installScormApi() {
  if ((window as any).__scormApiInstalled) return;
  (window as any).__scormApiInstalled = true;

  const data: Record<string, string> = {
    'cmi.core.lesson_status': 'incomplete',
    'cmi.core.score.raw': '',
    'cmi.core.session_time': '00:00:00',
  };

  // SCORM 1.2
  (window as any).API = {
    LMSInitialize: () => 'true',
    LMSGetValue: (key: string) => data[key] ?? '',
    LMSSetValue: (key: string, val: string) => { data[key] = val; return 'true'; },
    LMSCommit: () => 'true',
    LMSFinish: () => 'true',
    LMSGetLastError: () => '0',
    LMSGetErrorString: () => '',
    LMSGetDiagnostic: () => '',
  };

  // SCORM 2004
  (window as any).API_1484_11 = {
    Initialize: () => 'true',
    GetValue: (key: string) => data[key] ?? '',
    SetValue: (key: string, val: string) => { data[key] = val; return 'true'; },
    Commit: () => 'true',
    Terminate: () => 'true',
    GetLastError: () => '0',
    GetErrorString: () => '',
    GetDiagnostic: () => '',
  };
}

type Props = {
  entryUrl: string;
  height?: number;
};

export function ScormViewer({ entryUrl, height = 600 }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    installScormApi();
  }, []);

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen?.();
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <SchoolRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Интерактивный модуль
        </Typography>
        <Tooltip title="Открыть на весь экран">
          <IconButton size="small" onClick={handleFullscreen}>
            <FullscreenRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* iframe */}
      <Box
        ref={iframeRef}
        component="iframe"
        src={entryUrl}
        title="SCORM content"
        allow="fullscreen"
        sx={{ width: '100%', height, border: 0, display: 'block' }}
      />
    </Box>
  );
}
