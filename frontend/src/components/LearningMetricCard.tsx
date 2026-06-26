// frontend/src/components/LearningMetricCard.tsx
import { alpha } from '@mui/material/styles';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type LearningMetricCardProps = {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
};

export function LearningMetricCard({ icon, label, value, hint, accent = '#4f8ef7' }: LearningMetricCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 4,
        border: `1px solid ${alpha(accent, 0.18)}`,
        background: `linear-gradient(180deg, ${alpha(accent, 0.1)} 0%, transparent 100%)`,
        boxShadow: 'none',
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.1} alignItems="center">
            {icon ? (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  display: 'grid',
                  placeItems: 'center',
                  color: accent,
                  backgroundColor: alpha(accent, 0.12),
                }}
              >
                {icon}
              </Box>
            ) : null}
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ lineHeight: 1.05 }}>
            {value}
          </Typography>
          {hint ? (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {hint}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
