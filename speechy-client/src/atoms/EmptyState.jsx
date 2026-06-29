import { Box, Typography } from '@mui/material';

export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      {icon && <Box sx={{ mb: 2, color: 'text.disabled', display: 'flex', justifyContent: 'center' }}>{icon}</Box>}
      <Typography variant="h6" fontWeight={700} gutterBottom>{title}</Typography>
      {subtitle && <Typography color="text.secondary" mb={3}>{subtitle}</Typography>}
      {action}
    </Box>
  );
}
