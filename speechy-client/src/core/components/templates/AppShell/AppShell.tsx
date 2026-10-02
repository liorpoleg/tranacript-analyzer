import { useEffect, useRef, useState } from 'react';
import { Box, Drawer, IconButton } from '@mui/material';
import { useMatch } from 'react-router-dom';
import { TreeStructure, X, List as ListIcon } from '@phosphor-icons/react';
import Navbar from '@/core/components/organisms/Navbar/Navbar';
import ShowTreeSidebar from '@/features/shows/components/organisms/ShowTreeSidebar/ShowTreeSidebar';
import { ROUTES } from '@/core/constants/routes';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // The tree sidebar is only useful once you're inside a specific show — on
  // Dashboard/Shows (which already list shows themselves) it's redundant, so
  // it defaults collapsed there and expanded on a show/season view. The user
  // can still manually toggle within a section.
  const showDetailMatch = useMatch(ROUTES.SHOW_DETAIL);
  const summaryTableMatch = useMatch(ROUTES.SHOW_SUMMARY_TABLE);
  const seasonMatch = useMatch('/seasons/:id/*');
  const isShowView =
    (Boolean(showDetailMatch) && showDetailMatch?.params.id !== 'new') ||
    Boolean(summaryTableMatch) ||
    Boolean(seasonMatch);

  const [collapsed, setCollapsed] = useState<boolean>(!isShowView);
  const prevIsShowView = useRef<boolean>(isShowView);
  useEffect(() => {
    if (prevIsShowView.current !== isShowView) {
      setCollapsed(!isShowView);
      prevIsShowView.current = isShowView;
    }
  }, [isShowView]);

  return (
    <Box className={styles.root}>
      <Navbar />
      <Box className={styles.body}>
        <Box className={`${styles.sidebarDesktop} ${collapsed ? styles.sidebarDesktopCollapsed : ''}`.trim()}>
          {collapsed ? (
            <IconButton
              className={styles.sidebarRailToggle}
              onClick={() => setCollapsed(false)}
              aria-label="Expand show navigation"
            >
              <ListIcon size={18} />
            </IconButton>
          ) : (
            <ShowTreeSidebar onCollapse={() => setCollapsed(true)} />
          )}
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
