import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Divider } from '@mui/material';
import { ArrowLeft } from '@phosphor-icons/react';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import KnowledgePanel from '@/features/knowledge/components/organisms/KnowledgePanel/KnowledgePanel';
import QuestionsPanel from '@/features/knowledge/components/organisms/QuestionsPanel/QuestionsPanel';
import EpisodeChatWorkspace from '@/features/chat/components/organisms/EpisodeChatWorkspace/EpisodeChatWorkspace';
import TwoColumnLayout from '@/core/components/templates/TwoColumnLayout/TwoColumnLayout';
import SeasonTabBar from '@/features/shows/components/molecules/SeasonTabBar/SeasonTabBar';
import { useSeasonKnowledge } from '@/features/knowledge/services/knowledge';
import { useSeasonQuestions } from '@/features/knowledge/services/questions';
import { useSeasonEpisodes } from '@/features/episodes/services/episodes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import styles from './SeasonDetailPage.module.css';

export default function SeasonDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: knowledge = [], isLoading: kLoading } = useSeasonKnowledge(id);
  const { data: questions = [], isLoading: qLoading } = useSeasonQuestions(id);
  const { data: episodes = [], isLoading: episodesLoading } = useSeasonEpisodes(id);

  usePageTitle('Season Settings');

  return (
    <PageLayout>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} className={styles.backButton}>
        Back
      </Button>

      <Typography variant="h2" mb={2}>Season</Typography>
      <SeasonTabBar seasonId={id!} active="settings" />

      <TwoColumnLayout
        left={<QuestionsPanel questions={questions} seasonId={id} isLoading={qLoading} />}
        right={<KnowledgePanel files={knowledge} seasonId={id} isLoading={kLoading} />}
      />

      <Divider className={styles.divider} />

      <Typography variant="h2" className={styles.chatTitle}>Chat with AI</Typography>

      <EpisodeChatWorkspace episodes={episodes} isLoading={episodesLoading} />
    </PageLayout>
  );
}
