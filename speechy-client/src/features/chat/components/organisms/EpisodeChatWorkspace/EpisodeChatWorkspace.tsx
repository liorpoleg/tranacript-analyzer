import { useState } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import TwoColumnLayout from '@/core/components/templates/TwoColumnLayout/TwoColumnLayout';
import ChatPanel from '@/features/chat/components/organisms/ChatPanel/ChatPanel';
import EpisodeSelector from '@/features/chat/components/molecules/EpisodeSelector/EpisodeSelector';
import type { Episode } from '@/core/types';
import styles from './EpisodeChatWorkspace.module.css';

interface EpisodeChatWorkspaceProps {
  episodes: Episode[];
  isLoading?: boolean;
}

export default function EpisodeChatWorkspace({ episodes, isLoading = false }: EpisodeChatWorkspaceProps): JSX.Element {
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([]);

  const contextLabel =
    selectedEpisodeIds.length === 0
      ? undefined
      : selectedEpisodeIds.length === episodes.length
      ? 'All episodes'
      : `${selectedEpisodeIds.length} episode${selectedEpisodeIds.length > 1 ? 's' : ''} selected`;

  return (
    <TwoColumnLayout
      leftWidth="280px"
      left={
        <Card>
          <CardContent className={styles.selectorCardContent}>
            <Typography variant="body2" fontWeight={700} className={styles.selectorTitle}>
              Episodes in context
            </Typography>
            <EpisodeSelector
              episodes={episodes}
              selected={selectedEpisodeIds}
              onChange={setSelectedEpisodeIds}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      }
      right={
        <Card>
          <CardContent className={styles.chatCardContent}>
            <ChatPanel episodeIds={selectedEpisodeIds} contextLabel={contextLabel} />
          </CardContent>
        </Card>
      }
    />
  );
}
