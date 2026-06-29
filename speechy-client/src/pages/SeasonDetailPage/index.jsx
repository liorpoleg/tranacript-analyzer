import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { ArrowLeft } from '@phosphor-icons/react';
import PageLayout from '../../templates/PageLayout';
import KnowledgePanel from '../../organisms/KnowledgePanel';
import QuestionsPanel from '../../organisms/QuestionsPanel';
import TwoColumnLayout from '../../templates/TwoColumnLayout';
import { useSeasonKnowledge } from '../../api/knowledge';
import { useSeasonQuestions } from '../../api/questions';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function SeasonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: knowledge = [], isLoading: kLoading } = useSeasonKnowledge(id);
  const { data: questions = [], isLoading: qLoading } = useSeasonQuestions(id);

  usePageTitle('Season');

  return (
    <PageLayout>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mb: 2, color: 'text.secondary' }}>Back</Button>
      <Typography variant="h2" mb={3}>Season Settings</Typography>
      <TwoColumnLayout
        left={<QuestionsPanel questions={questions} seasonId={id} isLoading={qLoading} />}
        right={<KnowledgePanel files={knowledge} seasonId={id} isLoading={kLoading} />}
      />
    </PageLayout>
  );
}
