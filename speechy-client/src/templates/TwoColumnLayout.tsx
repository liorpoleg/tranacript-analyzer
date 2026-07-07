import { Box } from '@mui/material';

interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
}

export default function TwoColumnLayout({ left, right, leftWidth = '45%' }: TwoColumnLayoutProps): JSX.Element {
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
