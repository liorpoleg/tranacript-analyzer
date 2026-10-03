import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Collapse, TextField } from '@mui/material';
import { Plus, ChatCircleText, Upload, CaretDown, CaretRight } from '@phosphor-icons/react';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import EpisodeTable from '@/features/shows/components/organisms/EpisodeTable/EpisodeTable';
import { useShowEpisodesInfinite, useShowUpload } from '@/features/episodes/services/episodes';
import { useShowChildren, useCreateChildShow } from '@/features/shows/services/shows';
import { useToast } from '@/core/contexts/ToastContext';
import { buildRoute } from '@/core/constants/routes';
import type { Show } from '@/core/types';
import styles from './SeasonAccordion.module.css';

interface SeasonAccordionProps {
  season: Show;
  depth?: number;
}

export default function SeasonAccordion({ season, depth = 0 }: SeasonAccordionProps): JSX.Element {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    data: episodePages, isLoading,
    hasNextPage, isFetchingNextPage, fetchNextPage,
  } = useShowEpisodesInfinite(season.id);
  const episodes = episodePages?.pages.flatMap((p) => p.episodes) ?? [];
  const episodesTotalCount = episodePages?.pages[0]?.count;
  const { data: subSeasons = [] } = useShowChildren(season.id);
  const createSubSeason = useCreateChildShow(season.id);
  const showUpload = useShowUpload(season.id);
  const [subSeasonModal, setSubSeasonModal] = useState<boolean>(false);
  const [subSeasonName, setSubSeasonName] = useState<string>('');
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const handleCreateSubSeason = async (): Promise<void> => {
    try {
      await createSubSeason.mutateAsync({ name: subSeasonName.trim() });
      toast.show('Sub-season added!', 'success');
      setSubSeasonModal(false);
      setSubSeasonName('');
    } catch {
      toast.show('Failed to add sub-season.', 'error');
    }
  };

  const handleShowUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await showUpload.mutateAsync(file);
      toast.show(`Uploaded ${result.episodes_created} episode(s)!`, 'success');
    } catch {
      toast.show('Upload failed.', 'error');
    }
    e.target.value = '';
  };

  return (
    <Box style={{ '--depth': depth } as React.CSSProperties} className={styles.wrap}>
      <Box
        onClick={() => setCollapsed((c) => !c)}
        className={`${styles.header} ${collapsed ? styles.headerCollapsed : styles.headerExpanded}`}
      >
        <Box className={styles.headerLeft}>
          {collapsed ? <CaretRight size={15} weight="bold" /> : <CaretDown size={15} weight="bold" />}
          <Typography fontWeight={700}>{season.name}</Typography>
          {collapsed && episodes.length > 0 && (
            <Typography variant="body1" color="text.secondary">
              {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Box className={styles.headerActions} onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            startIcon={<ChatCircleText size={14} />}
            onClick={() => navigate(buildRoute.season(season.id))}
            className={styles.actionButton}
          >
            Chat & Settings
          </Button>
          {(season.my_role === 'owner' || season.my_role === 'editor') && (
            <Button
              size="small"
              component="label"
              startIcon={<Upload size={14} />}
              disabled={showUpload.isLoading}
              className={styles.actionButton}
            >
              {showUpload.isLoading ? 'Uploading…' : 'Upload Multiple Episodes'}
              <input type="file" hidden accept=".xlsx,.xls" onChange={handleShowUpload} />
            </Button>
          )}
          {season.my_role === 'owner' && (
            <Button
              size="small"
              startIcon={<Plus size={14} />}
              onClick={() => setSubSeasonModal(true)}
              className={styles.actionButton}
            >
              Add Sub-season
            </Button>
          )}
        </Box>
      </Box>

      <Collapse in={!collapsed}>
        <Box className={styles.body}>
          {subSeasons.map((sub) => (
            <SeasonAccordion key={sub.id} season={sub} depth={depth + 1} />
          ))}
          <Box className={styles.tableWrap}>
            <EpisodeTable
              episodes={episodes}
              isLoading={isLoading}
              onOpen={(ep) => navigate(buildRoute.episode(ep.id))}
              totalCount={episodesTotalCount}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onEndReached={() => fetchNextPage()}
              onExpand={() => navigate(buildRoute.showSummaryTable(season.id))}
            />
          </Box>
        </Box>
      </Collapse>

      <AppModal open={subSeasonModal} onClose={() => setSubSeasonModal(false)} title="Add Sub-season" onConfirm={handleCreateSubSeason} confirmLabel="Add" loading={createSubSeason.isLoading}>
        <Box>
          <Typography variant="body2" fontWeight={700} mb={0.75}>Sub-season Name</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Season 1A"
            value={subSeasonName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubSeasonName(e.target.value)}
          />
        </Box>
      </AppModal>
    </Box>
  );
}
