import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Collapse } from '@mui/material';
import { CaretRight } from '@phosphor-icons/react';
import { useShowChildren } from '@/features/shows/services/shows';
import { buildRoute } from '@/core/constants/routes';
import type { Show } from '@/core/types';
import styles from './SeasonTreeNode.module.css';

interface SeasonTreeNodeProps {
  show: Show;
  depth?: number;
  onNavigate?: () => void;
}

export default function SeasonTreeNode({ show, depth = 0, onNavigate }: SeasonTreeNodeProps): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState<boolean>(false);
  const hasChildren = show.direct_children_count > 0;
  const { data: children = [] } = useShowChildren(expanded ? show.id : undefined);

  // Every node — root or nested — opens in the same show view (sub-shows +
  // episodes table), not the separate Settings/Jobs/Chat tab page.
  const target = buildRoute.show(show.id);
  const active = location.pathname === target || location.pathname.startsWith(`${target}/`);

  const handleSelect = (): void => {
    navigate(target);
    onNavigate?.();
  };

  return (
    <Box className={styles.wrap}>
      <Box
        className={`${styles.node} ${active ? styles.nodeActive : ''}`.trim()}
        style={{ '--depth': depth } as React.CSSProperties}
      >
        <Box
          className={`${styles.chevron} ${!hasChildren ? styles.chevronHidden : ''} ${expanded ? styles.chevronOpen : ''}`.trim()}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((v) => !v);
          }}
        >
          {hasChildren && <CaretRight size={11} weight="bold" />}
        </Box>
        <Typography noWrap variant="body2" fontWeight={active ? 700 : 600} onClick={handleSelect} className={styles.label}>
          {show.name}
        </Typography>
        {show.episode_count > 0 && <Box className={styles.countPill}>{show.episode_count}</Box>}
      </Box>

      {hasChildren && (
        <Collapse in={expanded}>
          <Box>
            {children.map((child) => (
              <SeasonTreeNode key={child.id} show={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
