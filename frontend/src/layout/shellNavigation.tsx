import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import { Avatar, Box, Button, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';

export const drawerWidth = 236;

const navItemSx = (active: boolean) => ({
  px: 1.25,
  py: 0.9,
  borderRadius: 1.5,
  minHeight: 46,
  alignItems: 'center',
  borderLeft: `2px solid ${active ? 'var(--app-color-primary)' : 'transparent'}`,
  backgroundColor: active ? 'var(--app-color-primary-glow)' : 'transparent',
  color: active ? 'var(--app-color-primary)' : 'var(--app-text-secondary)',
  transition: 'background-color 130ms ease, border-color 130ms ease, color 130ms ease',
  '&:hover': {
    backgroundColor: active ? 'var(--app-color-primary-glow)' : 'rgba(255,255,255,0.04)',
    color: active ? 'var(--app-color-primary)' : 'var(--app-text-primary)',
  },
  '&:focus-visible': {
    outline: '2px solid var(--app-color-primary)',
    outlineOffset: '-2px',
  },
});

export type ShellNavItem = {
  label: string;
  caption: string;
  to: string;
  icon: React.ReactNode;
  matches: (pathname: string) => boolean;
};

export function createShellNavItems(isAdmin?: boolean): ShellNavItem[] {
  const items: ShellNavItem[] = [
    {
      label: 'Обзор',
      caption: 'Метрики и активность',
      to: '/',
      icon: <DashboardRoundedIcon sx={{ fontSize: 18 }} />,
      matches: (pathname) => pathname === '/',
    },
    {
      label: 'Курсы',
      caption: 'Материалы и каталог',
      to: '/courses',
      icon: <AutoStoriesRoundedIcon sx={{ fontSize: 18 }} />,
      matches: (pathname) => pathname.startsWith('/courses'),
    },
    {
      label: 'Результаты',
      caption: 'Попытки и прогресс',
      to: '/results',
      icon: <QueryStatsRoundedIcon sx={{ fontSize: 18 }} />,
      matches: (pathname) => pathname.startsWith('/results'),
    },
  ];

  if (isAdmin) {
    items.push({
      label: 'Админ',
      caption: 'Пользователи и курсы',
      to: '/admin',
      icon: <ManageAccountsRoundedIcon sx={{ fontSize: 18 }} />,
      matches: (pathname) => pathname.startsWith('/admin'),
    });
  }

  return items;
}

export function initialsFromName(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'LP';
}

export function initialsFromEmail(email?: string) {
  return initialsFromName(undefined, email);
}

type ShellSidebarProps = {
  items: ShellNavItem[];
  pathname: string;
  onNavigate?: () => void;
  userName?: string;
  email?: string;
  isAdmin?: boolean;
  onLogout: () => void;
};

export function ShellSidebar({ items, pathname, onNavigate, userName, email, isAdmin, onLogout }: ShellSidebarProps) {
  return (
    <Box
      component="aside"
      aria-label="Основная навигация"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--app-surface)',
        border: '1px solid var(--app-border)',
        borderRadius: { xs: 0, md: 2 },
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 800,
            fontSize: '1.1rem',
            color: 'var(--app-text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Learning
          <Box component="span" sx={{ color: 'var(--app-color-primary)' }}>.</Box>
        </Typography>
        <Typography
          sx={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            color: 'var(--app-text-muted)',
            mt: 0.4,
          }}
        >
          УЧЕБНЫЙ ПОРТАЛ
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'var(--app-border)' }} />

      {/* Nav */}
      <Box component="nav" aria-label="Разделы портала" sx={{ px: 1, py: 1.25, flexGrow: 1 }}>
        <List sx={{ p: 0, display: 'grid', gap: 0.3 }}>
          {items.map((item) => {
            const active = item.matches(pathname);
            return (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                sx={navItemSx(active)}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.875rem',
                    lineHeight: 1.2,
                    color: 'inherit',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: 'var(--app-border)' }} />

      {/* User */}
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.25 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.7rem', fontWeight: 600 }}>
            {initialsFromName(userName, email)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ color: 'var(--app-text-primary)', fontSize: '0.82rem', lineHeight: 1.2 }}
            >
              {userName || email || 'Пользователь'}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.62rem',
                color: 'var(--app-text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {isAdmin ? 'admin' : 'student'}
            </Typography>
          </Box>
        </Stack>

        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<LogoutRoundedIcon sx={{ fontSize: '16px !important' }} />}
          onClick={onLogout}
          sx={{
            minHeight: 36,
            fontSize: '0.8rem',
            justifyContent: 'flex-start',
            borderColor: 'var(--app-border)',
            color: 'var(--app-text-muted)',
            '&:hover': {
              borderColor: 'rgba(248,113,113,0.3)',
              color: 'var(--app-color-danger)',
              backgroundColor: 'var(--app-color-danger-dim)',
            },
          }}
        >
          Выйти
        </Button>
      </Box>
    </Box>
  );
}
