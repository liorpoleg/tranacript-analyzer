import { Box, Typography } from '@mui/material';

export default function SectionHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
      <Box>
        <Typography variant="h2" sx={{ fontSize: '1.7rem' }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" mt={0.5}>{subtitle}</Typography>}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}
