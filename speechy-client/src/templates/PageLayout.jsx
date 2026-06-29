import { Box } from '@mui/material';
import Navbar from '../organisms/Navbar';

export default function PageLayout({ children, maxWidth = 1260 }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box sx={{ maxWidth, mx: 'auto', px: { xs: 2, md: 5 }, py: 4.5, pb: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
