import { alpha, createTheme } from '@mui/material/styles';

const shared = {
  radius: { xs: 4, sm: 8, md: 12, lg: 16, pill: 999 },
};

const darkTokens = {
  bg: '#0a0d14',
  surface: '#111520',
  surfaceElevated: '#161c2e',
  surfaceHover: '#1c2340',
  border: 'rgba(255,255,255,0.07)',
  borderActive: 'rgba(79,142,247,0.35)',
  primary: '#4f8ef7',
  primaryDark: '#2b6fe0',
  primaryGlow: 'rgba(79,142,247,0.15)',
  accent: '#e4f060',
  accentDim: 'rgba(228,240,96,0.12)',
  textPrimary: '#f0f4ff',
  textSecondary: '#7a8aaa',
  textMuted: '#6b7a99',
  success: '#34d399',
  successDim: 'rgba(52,211,153,0.12)',
  danger: '#f87171',
  dangerDim: 'rgba(248,113,113,0.12)',
  warning: '#fbbf24',
};

const lightTokens = {
  bg: '#f8f9fc',
  surface: '#ffffff',
  surfaceElevated: '#f1f4f9',
  surfaceHover: '#e8edf5',
  border: 'rgba(0,0,0,0.13)',
  borderActive: 'rgba(79,142,247,0.45)',
  primary: '#4f8ef7',
  primaryDark: '#2b6fe0',
  primaryGlow: 'rgba(79,142,247,0.12)',
  accent: '#c9b800',
  accentDim: 'rgba(201,184,0,0.12)',
  textPrimary: '#0f1623',
  textSecondary: '#3d4d6a',
  textMuted: '#6b7590',
  success: '#059669',
  successDim: 'rgba(5,150,105,0.1)',
  danger: '#dc2626',
  dangerDim: 'rgba(220,38,38,0.1)',
  warning: '#d97706',
};

export function createAppTheme(mode: 'light' | 'dark') {
  const f = mode === 'dark' ? darkTokens : lightTokens;
  const r = shared.radius;

  return createTheme({
    palette: {
      mode,
      primary: { main: f.primary, dark: f.primaryDark, contrastText: mode === 'dark' ? '#0a0d14' : '#ffffff' },
      secondary: { main: f.accent, contrastText: '#0a0d14' },
      background: { default: f.bg, paper: f.surface },
      text: { primary: f.textPrimary, secondary: f.textSecondary },
      divider: f.border,
      success: { main: f.success },
      error: { main: f.danger },
      warning: { main: f.warning },
    },
    shape: { borderRadius: r.sm },
    typography: {
      fontFamily: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
      h1: { fontFamily: '"Syne", sans-serif', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0 },
      h2: { fontFamily: '"Syne", sans-serif', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05 },
      h3: { fontFamily: '"Syne", sans-serif', fontWeight: 700, letterSpacing: '-0.028em', lineHeight: 1.1 },
      h4: { fontFamily: '"Syne", sans-serif', fontWeight: 700, letterSpacing: '-0.022em', lineHeight: 1.15 },
      h5: { fontFamily: '"Syne", sans-serif', fontWeight: 700, letterSpacing: '-0.018em', lineHeight: 1.2 },
      h6: { fontFamily: '"Syne", sans-serif', fontWeight: 600, letterSpacing: '-0.012em', lineHeight: 1.25 },
      subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600, letterSpacing: '-0.008em' },
      body1: { fontWeight: 400, lineHeight: 1.65 },
      body2: { fontWeight: 400, lineHeight: 1.6 },
      caption: { fontWeight: 400, letterSpacing: '0.01em' },
      overline: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500, letterSpacing: '0.14em', fontSize: '0.7rem' },
      button: { fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 600, textTransform: 'none', letterSpacing: '-0.005em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { minHeight: '100%', scrollBehavior: 'smooth', colorScheme: mode },
          'html, body, #root': { minHeight: '100%' },
          ':root': {
            '--app-bg': f.bg,
            '--app-surface': f.surface,
            '--app-surface-elevated': f.surfaceElevated,
            '--app-surface-hover': f.surfaceHover,
            '--app-border': f.border,
            '--app-border-active': f.borderActive,
            '--app-color-primary': f.primary,
            '--app-color-primary-dark': f.primaryDark,
            '--app-color-primary-glow': f.primaryGlow,
            '--app-color-accent': f.accent,
            '--app-color-accent-dim': f.accentDim,
            '--app-text-primary': f.textPrimary,
            '--app-text-secondary': f.textSecondary,
            '--app-text-muted': f.textMuted,
            '--app-color-success': f.success,
            '--app-color-success-dim': f.successDim,
            '--app-color-danger': f.danger,
            '--app-color-danger-dim': f.dangerDim,
            '--app-radius-xs': `${r.xs}px`,
            '--app-radius-sm': `${r.sm}px`,
            '--app-radius-md': `${r.md}px`,
            '--app-radius-lg': `${r.lg}px`,
          },
          body: {
            margin: 0,
            padding: 0,
            overflowX: 'hidden',
            backgroundColor: f.bg,
            color: f.textPrimary,
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            backgroundImage:
              mode === 'dark'
                ? `radial-gradient(ellipse 80% 50% at 10% -10%, rgba(79,142,247,0.08) 0%, transparent 60%),
                   radial-gradient(ellipse 60% 40% at 90% 100%, rgba(79,142,247,0.05) 0%, transparent 50%)`
                : `radial-gradient(ellipse 80% 50% at 10% -10%, rgba(79,142,247,0.05) 0%, transparent 60%)`,
            backgroundAttachment: 'fixed',
          },
          a: { color: f.primary, textDecoration: 'none' },
          'a:hover': { textDecoration: 'underline' },
          'img, iframe, video, audio': { maxWidth: '100%' },
          '::selection': { background: alpha(f.primary, 0.25), color: f.textPrimary },
          '*': { boxSizing: 'border-box', scrollbarWidth: 'thin', scrollbarColor: `rgba(79,142,247,0.3) transparent` },
          '*::-webkit-scrollbar': { width: '6px', height: '6px' },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': { borderRadius: '999px', background: 'rgba(79,142,247,0.28)' },
          ':where(a,button,[role="button"],input,textarea,select,.MuiButtonBase-root):focus-visible': {
            outline: `2px solid ${f.primary}`,
            outlineOffset: '3px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', backgroundColor: f.surface, border: `1px solid ${f.border}` },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: r.md,
            border: `1px solid ${f.border}`,
            backgroundColor: f.surface,
            backgroundImage: 'none',
            boxShadow: 'none',
            transition: 'border-color 160ms ease, background-color 160ms ease',
            '&:hover': { borderColor: f.borderActive, backgroundColor: f.surfaceElevated },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: r.sm, paddingInline: 20, minHeight: 42 },
          containedPrimary: {
            background: f.primary,
            color: mode === 'dark' ? '#0a0d14' : '#ffffff',
            fontWeight: 700,
            '&:hover': { background: mode === 'dark' ? '#6fa3f9' : '#3a7ef5', boxShadow: `0 0 24px ${f.primaryGlow}` },
          },
          containedSecondary: {
            background: f.accent,
            color: '#0a0d14',
            fontWeight: 700,
            '&:hover': { background: mode === 'dark' ? '#ecf47a' : '#d4c400' },
          },
          outlined: {
            borderColor: f.border,
            color: f.textSecondary,
            '&:hover': { borderColor: f.borderActive, color: f.textPrimary, backgroundColor: f.primaryGlow },
          },
          text: {
            color: f.textSecondary,
            '&:hover': { color: f.textPrimary, backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: r.xs, fontWeight: 500, fontSize: '0.75rem' },
          filled: { backgroundColor: f.surfaceElevated, color: f.textSecondary },
          outlined: { borderColor: f.border, color: f.textSecondary, backgroundColor: 'transparent' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: r.sm,
            backgroundColor: f.surfaceElevated,
            transition: 'border-color 160ms ease, box-shadow 160ms ease',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: f.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.18)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: f.primary, borderWidth: 1 },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${f.primaryGlow}` },
          },
          input: { paddingTop: 14, paddingBottom: 14 },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { fontWeight: 500, color: f.textSecondary } },
      },
      MuiFormHelperText: {
        styleOverrides: { root: { marginLeft: 2, color: f.textMuted } },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: r.xs,
            marginBottom: 2,
            marginInline: 4,
            minHeight: 38,
            '&.Mui-selected': { backgroundColor: f.primaryGlow, color: f.primary },
            '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: { root: { transition: 'background-color 140ms ease, border-color 140ms ease' } },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: f.border } },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: alpha(f.surface, 0.9),
            borderBottom: `1px solid ${f.border}`,
            boxShadow: 'none',
          },
          colorTransparent: { backgroundImage: 'none' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: r.lg,
            border: `1px solid ${f.border}`,
            backgroundColor: f.surfaceElevated,
            backgroundImage: 'none',
            boxShadow: mode === 'dark' ? '0 32px 80px rgba(0,0,0,0.6)' : '0 32px 80px rgba(0,0,0,0.15)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: f.border },
          head: {
            fontWeight: 600,
            color: f.textSecondary,
            backgroundColor: f.surfaceElevated,
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: r.sm, border: `1px solid ${f.border}` },
          standardSuccess: { backgroundColor: f.successDim, borderColor: alpha(f.success, 0.2), color: f.success },
          standardError: { backgroundColor: f.dangerDim, borderColor: alpha(f.danger, 0.2), color: f.danger },
          standardWarning: { backgroundColor: alpha(f.warning, 0.1), borderColor: alpha(f.warning, 0.2), color: f.warning },
          standardInfo: { backgroundColor: f.primaryGlow, borderColor: f.borderActive, color: f.primary },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: f.surfaceHover,
            border: `1px solid ${f.border}`,
            borderRadius: r.xs,
            color: f.textPrimary,
            fontSize: '0.78rem',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 999, backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' },
          bar: { borderRadius: 999 },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: f.primaryGlow,
            color: f.primary,
            fontFamily: '"IBM Plex Mono", monospace',
            fontWeight: 500,
            border: `1px solid ${f.borderActive}`,
          },
        },
      },
    },
  });
}

export const theme = createAppTheme('dark');
