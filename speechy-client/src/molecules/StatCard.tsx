import { Card, CardContent, Box, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
}

export default function StatCard({ label, value, icon, accent = '#6366F1' }: StatCardProps): JSX.Element {
  const bgAlpha = `${accent}18`;

  return (
    <Card>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ lineHeight: 1.3 }}>
            {label}
          </Typography>
          {icon && (
            <Box
              sx={{
                p: 0.875,
                borderRadius: 2.5,
                bgcolor: bgAlpha,
                color: accent,
                display: 'flex',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 800,
            lineHeight: 1,
            color: 'text.primary',
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
