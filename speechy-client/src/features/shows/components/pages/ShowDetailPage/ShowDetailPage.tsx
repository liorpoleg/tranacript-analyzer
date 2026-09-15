import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Divider, CircularProgress, TextField } from '@mui/material';
import { Plus, ArrowLeft, Table as TableIcon } from '@phosphor-icons/react';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import SeasonAccordion from '@/features/shows/components/organisms/SeasonAccordion/SeasonAccordion';
import { useShow, useShowSeasons, useCreateSeason } from '@/features/shows/services/shows';
import { useShowQuestions } from '@/features/knowledge/services/questions';
import { useShowKnowledge } from '@/features/knowledge/services/knowledge';
import { useToast } from '@/core/contexts/ToastContext';
import { buildRoute, ROUTES } from '@/core/constants/routes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import QuestionsPanel from '@/features/knowledge/components/organisms/QuestionsPanel/QuestionsPanel';
import KnowledgePanel from '@/features/knowledge/components/organisms/KnowledgePanel/KnowledgePanel';
import TwoColumnLayout from '@/core/components/templates/TwoColumnLayout/TwoColumnLayout';
import type { Season } from '@/core/types';
import styles from './ShowDetailPage.module.css';

export default function ShowDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: show, isLoading } = useShow(id);
  const { data: seasons = [] } = useShowSeasons(id);
  const { data: questions = [], isLoading: questionsLoading } = useShowQuestions(id);
  const { data: knowledge = [], isLoading: knowledgeLoading } = useShowKnowledge(id);
  const createSeason = useCreateSeason(id);
  const [seasonModal, setSeasonModal] = useState<boolean>(false);
  const [seasonNumber, setSeasonNumber] = useState<string>('');

  usePageTitle(show?.name);

  const handleCreateSeason = async (): Promise<void> => {
    try {
      await createSeason.mutateAsync({ number: parseInt(seasonNumber), show: id });
      toast.show('Season added!', 'success');
      setSeasonModal(false);
      setSeasonNumber('');
    } catch {
      toast.show('Failed to add season.', 'error');
    }
  };

  if (isLoading) return <PageLayout><Box className={styles.loading}><CircularProgress /></Box></PageLayout>;

  return (
    <PageLayout>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(ROUTES.SHOWS)} className={styles.backButton}>
        All Shows
      </Button>

      <Box className={styles.header}>
        <Box className={styles.avatar}>
          {show!.name.slice(0, 2).toUpperCase()}
        </Box>
        <Box className={styles.headerInfo}>
          <Typography variant="h2">{show!.name}</Typography>
          <Typography color="text.secondary" mt={0.5}>{show!.description}</Typography>
          <Box className={styles.headerStats}>
            <Typography variant="caption">{show!.season_count} seasons · {show!.episode_count} episodes</Typography>
          </Box>
        </Box>
        <Box className={styles.headerActions}>
          <AppButton variant="outlined" startIcon={<TableIcon size={15} />} onClick={() => navigate(buildRoute.showSummaryTable(id!))}>Summary Table</AppButton>
          <AppButton variant="contained" startIcon={<Plus size={15} />} onClick={() => setSeasonModal(true)}>Add Season</AppButton>
        </Box>
      </Box>

      {seasons.length === 0 && (
        <Typography className={styles.emptySeasons}>No seasons yet. Add a season to get started.</Typography>
      )}

      {seasons.map((season: Season) => (
        <SeasonAccordion key={season.id} season={season} showId={id!} />
      ))}

      <Divider className={styles.divider} />

      <Typography variant="h2" className={styles.researchTitle}>Show-Level Research</Typography>
      <TwoColumnLayout
        left={
          <Card>
            <CardContent className={styles.researchCardContent}>
              <QuestionsPanel questions={questions} showId={id} isLoading={questionsLoading} />
            </CardContent>
          </Card>
        }
        right={
          <Card>
            <CardContent className={styles.researchCardContent}>
              <KnowledgePanel files={knowledge} showId={id} isLoading={knowledgeLoading} />
            </CardContent>
          </Card>
        }
      />

      <AppModal open={seasonModal} onClose={() => setSeasonModal(false)} title="Add Season" onConfirm={handleCreateSeason} confirmLabel="Add" loading={createSeason.isLoading}>
        <Box>
          <Typography variant="body2" fontWeight={700} mb={0.75}>Season Number</Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            inputProps={{ min: 1 }}
            value={seasonNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeasonNumber(e.target.value)}
          />
        </Box>
      </AppModal>
    </PageLayout>
  );
}
