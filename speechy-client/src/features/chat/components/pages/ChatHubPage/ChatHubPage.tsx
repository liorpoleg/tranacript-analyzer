import { useState } from 'react';
import { Card, CardContent, Typography, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import TwoColumnLayout from '@/core/components/templates/TwoColumnLayout/TwoColumnLayout';
import EpisodeSelector from '@/features/chat/components/molecules/EpisodeSelector/EpisodeSelector';
import ChatPanel from '@/features/chat/components/organisms/ChatPanel/ChatPanel';
import { useShows } from '@/features/shows/services/shows';
import { useShowEpisodes } from '@/features/episodes/services/episodes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import styles from './ChatHubPage.module.css';

export default function ChatHubPage(): JSX.Element {
  usePageTitle('Chat');
  const { data: shows = [] } = useShows();
  const [showId, setShowId] = useState('');
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([]);
  // Recursive: every episode under the chosen show and all of its sub-shows.
  const { data: episodes = [], isLoading: episodesLoading } = useShowEpisodes(showId || undefined, true);

  const handleShowChange = (e: SelectChangeEvent): void => {
    setShowId(e.target.value);
    setSelectedEpisodeIds([]);
  };

  const contextLabel =
    !showId || selectedEpisodeIds.length === 0
      ? undefined
      : selectedEpisodeIds.length === episodes.length
      ? 'All episodes'
      : `${selectedEpisodeIds.length} episode${selectedEpisodeIds.length > 1 ? 's' : ''} selected`;

  return (
    <PageLayout>
      <SectionHeader title="Chat" subtitle="Ask questions about any show's episodes." />

      <Card className={styles.showPickerCard}>
        <CardContent className={styles.showPickerContent}>
          <Typography variant="body2" fontWeight={700} className={styles.showPickerLabel}>Show</Typography>
          <Select
            size="small"
            displayEmpty
            value={showId}
            onChange={handleShowChange}
            className={styles.showSelect}
          >
            <MenuItem value="">
              <Typography color="text.secondary">Select a show…</Typography>
            </MenuItem>
            {shows.map((show) => (
              <MenuItem key={show.id} value={show.id}>{show.name}</MenuItem>
            ))}
          </Select>
        </CardContent>
      </Card>

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
                isLoading={showId ? episodesLoading : false}
                emptyMessage={showId ? 'No episodes in this show yet.' : 'Select a show to see its episodes.'}
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
    </PageLayout>
  );
}
