import { Card, CardContent, Box, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, icon }: StatCardProps): JSX.Element {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">{label}</Typography>
          {icon && (
            <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main', display: 'flex' }}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography sx={{ fontFamily: '"Baloo 2"', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
