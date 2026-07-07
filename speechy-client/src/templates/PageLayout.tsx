import { Box } from '@mui/material';
import Navbar from '../organisms/Navbar';

interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function PageLayout({ children, maxWidth = 1260 }: PageLayoutProps): JSX.Element {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box sx={{ maxWidth, mx: 'auto', px: { xs: 2, md: 5 }, py: 4.5, pb: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
