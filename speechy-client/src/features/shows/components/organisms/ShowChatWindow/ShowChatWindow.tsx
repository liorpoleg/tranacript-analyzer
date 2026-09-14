import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import FloatingWindow from '@/core/components/organisms/FloatingWindow/FloatingWindow';
import ChatPanel from '@/features/chat/components/organisms/ChatPanel/ChatPanel';
import EpisodeSelector from '@/features/chat/components/molecules/EpisodeSelector/EpisodeSelector';
import { useShowEpisodes } from '@/features/episodes/services/episodes';
import styles from './ShowChatWindow.module.css';

interface ShowChatWindowProps {
  showId: string;
  showName: string;
  open: boolean;
  onClose: () => void;
}

export default function ShowChatWindow({ showId, showName, open, onClose }: ShowChatWindowProps): JSX.Element {
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([]);
  // Recursive: every episode under this node and all its sub-shows, not just direct ones.
  const { data: episodes = [], isLoading } = useShowEpisodes(open ? showId : undefined, true);

  const contextLabel =
    selectedEpisodeIds.length === 0
      ? undefined
      : selectedEpisodeIds.length === episodes.length
      ? 'All episodes'
      : `${selectedEpisodeIds.length} episode${selectedEpisodeIds.length > 1 ? 's' : ''} selected`;

  return (
    <FloatingWindow open={open} onClose={onClose} title={`Chat — ${showName}`} minHeight={560}>
      <Box className={styles.layout}>
        <Box className={styles.selector}>
          <Typography variant="body2" fontWeight={700} className={styles.selectorTitle}>
            Episodes in context
          </Typography>
          <Box className={styles.selectorList}>
            <EpisodeSelector
              episodes={episodes}
              selected={selectedEpisodeIds}
              onChange={setSelectedEpisodeIds}
              isLoading={isLoading}
              emptyMessage="No episodes in this show yet."
            />
          </Box>
        </Box>
        <Box className={styles.chat}>
          <ChatPanel episodeIds={selectedEpisodeIds} contextLabel={contextLabel} />
        </Box>
      </Box>
    </FloatingWindow>
  );
}
