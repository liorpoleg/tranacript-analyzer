import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography } from '@mui/material';
import ChatPanel from '../../organisms/ChatPanel';
import EpisodeSelector from '../../molecules/EpisodeSelector';
import TwoColumnLayout from '../../templates/TwoColumnLayout';
import { useSeasonEpisodes } from '../../api/episodes';

export default function ChatTab(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: episodes = [], isLoading } = useSeasonEpisodes(id);
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
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" fontWeight={700} mb={1.5}>
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
          <CardContent sx={{ p: 3, height: { xs: 420, md: 560 }, display: 'flex', flexDirection: 'column' }}>
            <ChatPanel episodeIds={selectedEpisodeIds} contextLabel={contextLabel} />
          </CardContent>
        </Card>
      }
    />
  );
}
