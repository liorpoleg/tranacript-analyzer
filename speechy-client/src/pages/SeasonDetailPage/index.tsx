import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress,
  Card, CardContent, Divider,
} from '@mui/material';
import { ArrowLeft } from '@phosphor-icons/react';
import PageLayout from '../../templates/PageLayout';
import KnowledgePanel from '../../organisms/KnowledgePanel';
import QuestionsPanel from '../../organisms/QuestionsPanel';
import ChatPanel from '../../organisms/ChatPanel';
import TwoColumnLayout from '../../templates/TwoColumnLayout';
import EpisodeSelector from '../../molecules/EpisodeSelector';
import SeasonTabBar from '../../molecules/SeasonTabBar';
import { useSeasonKnowledge } from '../../api/knowledge';
import { useSeasonQuestions } from '../../api/questions';
import { useSeasonEpisodes } from '../../api/episodes';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function SeasonDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: knowledge = [], isLoading: kLoading } = useSeasonKnowledge(id);
  const { data: questions = [], isLoading: qLoading } = useSeasonQuestions(id);
  const { data: episodes = [], isLoading: episodesLoading } = useSeasonEpisodes(id);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([]);

  usePageTitle('Season Settings');

  return (
    <PageLayout>
      <Button
        startIcon={<ArrowLeft size={16} />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Back
      </Button>

      <Typography variant="h2" mb={2}>Season</Typography>
      <SeasonTabBar seasonId={id!} active="settings" />

      <TwoColumnLayout
        left={<QuestionsPanel questions={questions} seasonId={id} isLoading={qLoading} />}
        right={<KnowledgePanel files={knowledge} seasonId={id} isLoading={kLoading} />}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h2" fontSize="1.2rem" mb={2}>Chat with AI</Typography>

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
                isLoading={episodesLoading}
              />
            </CardContent>
          </Card>
        }
        right={
          <Card>
            <CardContent sx={{ p: 3, height: { xs: 420, md: 560 }, display: 'flex', flexDirection: 'column' }}>
              <ChatPanel
                episodeIds={selectedEpisodeIds}
                contextLabel={
                  selectedEpisodeIds.length === 0
                    ? undefined
                    : selectedEpisodeIds.length === episodes.length
                    ? 'All episodes'
                    : `${selectedEpisodeIds.length} episode${selectedEpisodeIds.length > 1 ? 's' : ''} selected`
                }
              />
            </CardContent>
          </Card>
        }
      />
    </PageLayout>
  );
}
