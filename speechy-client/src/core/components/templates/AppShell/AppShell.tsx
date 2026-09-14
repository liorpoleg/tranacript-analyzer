import { useState } from 'react';
import { Box, Drawer, IconButton } from '@mui/material';
import { TreeStructure, X } from '@phosphor-icons/react';
import Navbar from '@/core/components/organisms/Navbar/Navbar';
import ShowTreeSidebar from '@/features/shows/components/organisms/ShowTreeSidebar/ShowTreeSidebar';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <Box className={styles.root}>
      <Navbar />
      <Box className={styles.body}>
        <Box className={styles.sidebarDesktop}>
          <ShowTreeSidebar />
        </Box>

        <IconButton
          className={styles.sidebarToggle}
          onClick={() => setMobileOpen(true)}
          aria-label="Open show navigation"
        >
          <TreeStructure size={20} weight="bold" />
        </IconButton>

        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ className: styles.drawerPaper }}
        >
          <Box className={styles.drawerHeader}>
            <IconButton onClick={() => setMobileOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </IconButton>
          </Box>
          <ShowTreeSidebar onNavigate={() => setMobileOpen(false)} />
        </Drawer>

        <Box className={styles.main}>{children}</Box>
      </Box>
    </Box>
  );
}
