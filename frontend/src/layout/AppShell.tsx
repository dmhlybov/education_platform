import { Box, Drawer } from '@mui/material';
import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { PageTitleProvider, usePageTitle } from '../app/PageTitleContext';
import { userDisplayName } from '../app/userUtils';
import { DesktopShellHeader, MobileShellHeader } from './ShellHeader';
import { createShellNavItems, drawerWidth, ShellSidebar } from './shellNavigation';

function AppShellInner({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { pageTitle } = usePageTitle();

  const items = useMemo(() => createShellNavItems(user?.is_admin), [user?.is_admin]);
  const activeItem = items.find((item) => item.matches(location.pathname));
  const resolvedItem = pageTitle.label
    ? { ...activeItem, label: pageTitle.label, caption: pageTitle.caption ?? activeItem?.caption }
    : activeItem;
  const content = children ?? <Outlet />;

  const sidebar = (
    <ShellSidebar
      items={items}
      pathname={location.pathname}
      onNavigate={() => setMobileOpen(false)}
      userName={userDisplayName(user)}
      email={user?.email}
      isAdmin={user?.is_admin}
      onLogout={logout}
    />
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--app-bg)',
        color: 'var(--app-text-primary)',
      }}
    >
      {/* Skip link */}
      <Box
        component="a"
        href="#app-main-content"
        sx={{
          position: 'absolute',
          left: 16,
          top: -48,
          zIndex: 1600,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          bgcolor: 'var(--app-color-primary)',
          color: '#0a0d14',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '0.85rem',
          '&:focus': { top: 16 },
        }}
      >
        Перейти к основному содержимому
      </Box>

      <MobileShellHeader
        activeItem={resolvedItem as typeof activeItem}
        email={user?.email}
        userName={userDisplayName(user)}
        isAdmin={user?.is_admin}
        onOpenMenu={() => setMobileOpen(true)}
      />

      {/* Sidebar */}
      <Box
        component="nav"
        aria-label="Каркас приложения"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiBackdrop-root': {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0,0,0,0.6)',
            },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              border: 0,
              background: 'transparent',
              boxShadow: 'none',
            },
          }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              border: 0,
              background: 'transparent',
              boxShadow: 'none',
              p: 1,
            },
          }}
        >
          {sidebar}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        id="app-main-content"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 7, md: 0 },
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            m: { xs: 0, md: 1 },
            ml: { md: 0 },
            borderRadius: { md: 2 },
            border: { md: '1px solid var(--app-border)' },
            backgroundColor: { md: 'var(--app-surface)' },
            overflow: 'clip',
            minHeight: { md: 'calc(100vh - 16px)' },
          }}
        >
          <DesktopShellHeader
            activeItem={resolvedItem as typeof activeItem}
            userName={userDisplayName(user)}
            email={user?.email}
            isAdmin={user?.is_admin}
          />
          <Box sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 2.5 } }}>
            {content}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  return (
    <PageTitleProvider>
      <AppShellInner>{children}</AppShellInner>
    </PageTitleProvider>
  );
}
