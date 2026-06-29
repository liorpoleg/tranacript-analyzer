import { Box } from '@mui/material';

export default function TwoColumnLayout({ left, right, leftWidth = '45%' }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `${leftWidth} 1fr` },
        gap: 2.5,
        alignItems: 'start',
      }}
    >
      <Box>{left}</Box>
      <Box>{right}</Box>
    </Box>
  );
}
