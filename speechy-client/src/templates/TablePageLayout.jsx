import { Box } from '@mui/material';
import Navbar from '../organisms/Navbar';
import SectionHeader from '../atoms/SectionHeader';

export default function TablePageLayout({ title, subtitle, action, filterBar, children }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 5 }, py: 4.5 }}>
        <SectionHeader title={title} subtitle={subtitle} action={action} />
        {filterBar && <Box mb={2}>{filterBar}</Box>}
        {children}
      </Box>
    </Box>
  );
}
