import { Box } from '@mui/material';
import Navbar from '../organisms/Navbar';
import SectionHeader from '../atoms/SectionHeader';

interface TablePageLayoutProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number | string;
}

export default function TablePageLayout({ title, subtitle, action, filterBar, children, maxWidth = 1280 }: TablePageLayoutProps): JSX.Element {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box sx={{ maxWidth, mx: 'auto', px: { xs: 2, md: 5 }, py: 4.5 }}>
        <SectionHeader title={title} subtitle={subtitle} action={action} />
        {filterBar && <Box mb={2}>{filterBar}</Box>}
        {children}
      </Box>
    </Box>
  );
}
