// frontend/src/layout/ShellHeader.tsx
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { AppBar, Avatar, Box, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { useThemeMode } from '../app/ThemeContext';
import { initialsFromName, type ShellNavItem } from './shellNavigation';

type ShellHeaderProps = {
  activeItem?: ShellNavItem;
  email?: string;
  userName?: string;
  isAdmin?: boolean;
  onOpenMenu?: () => void;
};

function ThemeToggleButton() {
  const { mode, toggleMode } = useThemeMode();
  return (
    <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
      <IconButton
        onClick={toggleMode}
        size="small"
        aria-label={mode === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
        sx={{
          color: 'var(--app-text-secondary)',
          border: '1px solid var(--app-border)',
          borderRadius: 1.5,
          p: 0.75,
          '&:hover': { backgroundColor: 'rgba(79,142,247,0.08)', color: 'var(--app-color-primary)' },
        }}
      >
        {mode === 'dark' ? (
          <LightModeRoundedIcon sx={{ fontSize: 18 }} />
        ) : (
          <DarkModeRoundedIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

export function MobileShellHeader({ activeItem, email, userName, isAdmin, onOpenMenu }: ShellHeaderProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        display: { md: 'none' },
        backgroundColor: 'var(--app-surface)',
        borderBottom: '1px solid var(--app-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: 56, px: 1.5 }}>
        <IconButton
          edge="start"
          onClick={onOpenMenu}
          aria-label="Открыть навигацию"
          size="small"
          sx={{
            color: 'var(--app-text-secondary)',
            border: '1px solid var(--app-border)',
            borderRadius: 1.5,
            p: 0.75,
            '&:hover': { backgroundColor: 'rgba(79,142,247,0.08)', color: 'var(--app-text-primary)' },
          }}
        >
          <MenuRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--app-text-primary)',
              lineHeight: 1.2,
            }}
            noWrap
          >
            {activeItem?.label || 'Учебный портал'}
          </Typography>
        </Box>

        <ThemeToggleButton />
        <Avatar sx={{ width: 30, height: 30, fontSize: '0.65rem' }}>
          {initialsFromName(userName, email)}
        </Avatar>
      </Toolbar>
    </AppBar>
  );
}

export function DesktopShellHeader({ activeItem, userName, email, isAdmin }: Omit<ShellHeaderProps, 'onOpenMenu'>) {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2.5,
        py: 1.5,
        borderBottom: '1px solid var(--app-border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'var(--app-surface)',
        backdropFilter: 'blur(12px)',
      }}
      component="header"
    >
      <Box>
        <Typography
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
            color: 'var(--app-text-muted)',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {activeItem?.caption || 'Рабочее пространство'}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: 'var(--app-text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            mt: 0.3,
          }}
        >
          {activeItem?.label || 'Учебный портал'}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} alignItems="center">
        <ThemeToggleButton />
        <Tooltip title={`${userName || email || 'Пользователь'} · ${isAdmin ? 'admin' : 'student'}`}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.68rem', cursor: 'default' }}>
            {initialsFromName(userName, email)}
          </Avatar>
        </Tooltip>
      </Stack>
    </Box>
  );
}
