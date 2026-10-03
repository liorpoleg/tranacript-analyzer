import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, CircularProgress, TextField } from '@mui/material';
import { Plus, ChatCircleText, Upload, UsersThree, Television, BookOpen } from '@phosphor-icons/react';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import SeasonAccordion from '@/features/shows/components/organisms/SeasonAccordion/SeasonAccordion';
import ShowChatWindow from '@/features/shows/components/organisms/ShowChatWindow/ShowChatWindow';
import ShowMembersModal from '@/features/shows/components/organisms/ShowMembersModal/ShowMembersModal';
import EpisodeTable from '@/features/shows/components/organisms/EpisodeTable/EpisodeTable';
import { useShow, useShowChildren, useCreateChildShow } from '@/features/shows/services/shows';
import { useShowEpisodesInfinite, useShowUpload } from '@/features/episodes/services/episodes';
import { useShowQuestions } from '@/features/knowledge/services/questions';
import { useShowKnowledge } from '@/features/knowledge/services/knowledge';
import { useToast } from '@/core/contexts/ToastContext';
import { buildRoute } from '@/core/constants/routes';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import QuestionsPanel from '@/features/knowledge/components/organisms/QuestionsPanel/QuestionsPanel';
import KnowledgePanel from '@/features/knowledge/components/organisms/KnowledgePanel/KnowledgePanel';
import TwoColumnLayout from '@/core/components/templates/TwoColumnLayout/TwoColumnLayout';
import type { Show } from '@/core/types';
import styles from './ShowDetailPage.module.css';

type ShowDetailTab = 'episodes' | 'context';

export default function ShowDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: show, isLoading } = useShow(id);
  const { data: seasons = [], isLoading: seasonsLoading } = useShowChildren(id);
  const {
    data: episodePages, isLoading: episodesLoading,
    hasNextPage, isFetchingNextPage, fetchNextPage,
  } = useShowEpisodesInfinite(id);
  const episodes = episodePages?.pages.flatMap((p) => p.episodes) ?? [];
  const episodesTotalCount = episodePages?.pages[0]?.count;
  const { data: questions = [], isLoading: questionsLoading } = useShowQuestions(id);
  const { data: knowledge = [], isLoading: knowledgeLoading } = useShowKnowledge(id);
  const createSeason = useCreateChildShow(id);
  const showUpload = useShowUpload(id!);
  const [seasonModal, setSeasonModal] = useState<boolean>(false);
  const [seasonName, setSeasonName] = useState<string>('');
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [membersModal, setMembersModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ShowDetailTab>('episodes');
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);

  usePageTitle(show?.name);

  const handleCreateSeason = async (): Promise<void> => {
    try {
      await createSeason.mutateAsync({ name: seasonName.trim() });
      toast.show('Season added!', 'success');
      setSeasonModal(false);
      setSeasonName('');
    } catch {
      toast.show('Failed to add season.', 'error');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
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

  if (isLoading) return <PageLayout><Box className={styles.loading}><CircularProgress /></Box></PageLayout>;

  return (
    <PageLayout>
      <Box className={styles.page}>
        <Box className={styles.header}>
          <Box className={styles.avatar}>
            {show!.name.slice(0, 2).toUpperCase()}
          </Box>
          <Box className={styles.headerInfo}>
            <Typography variant="h2">{show!.name}</Typography>
            <Typography color="text.secondary" mt={0.5}>
              {show!.description && `${show!.description} · `}
              {show!.direct_children_count} seasons · {show!.episode_count} episodes
            </Typography>
          </Box>
          <Box className={styles.headerActions}>
            <AppButton variant="outlined" startIcon={<ChatCircleText size={15} />} onClick={() => setChatOpen(true)}>Chat</AppButton>
            {show!.my_role === 'owner' && (
              <AppButton variant="outlined" startIcon={<UsersThree size={15} />} onClick={() => setMembersModal(true)}>
                 Members
              </AppButton>
            )}
            {show!.my_role === 'owner' && (
              <AppButton variant="contained" startIcon={<Plus size={15} />} onClick={() => setSeasonModal(true)}>Add Season</AppButton>
            )}
          </Box>
        </Box>

        <Box className={styles.tabBar}>
          <Button
            size="small"
            startIcon={<Television size={15} />}
            onClick={() => setActiveTab('episodes')}
            className={`${styles.tab} ${activeTab === 'episodes' ? styles.tabActive : ''}`.trim()}
          >
            Episodes
          </Button>
          <Button
            size="small"
            startIcon={<BookOpen size={15} />}
            onClick={() => setActiveTab('context')}
            className={`${styles.tab} ${activeTab === 'context' ? styles.tabActive : ''}`.trim()}
          >
            Context
          </Button>
        </Box>

        <Box className={styles.content} ref={setScrollParent}>
          {activeTab === 'episodes' && (
            <>
              {!seasonsLoading && !episodesLoading && seasons.length === 0 && episodes.length === 0 && (
                <Typography className={styles.emptySeasons}>
                  Nothing here yet. Add a season or upload episodes to get started.
                </Typography>
              )}

              {seasons.map((season: Show) => (
                <SeasonAccordion key={season.id} season={season} />
              ))}

              <Box className={styles.episodesHeader}>
                <Box className={styles.headerActions}>
                  {(show!.my_role === 'owner' || show!.my_role === 'editor') && (
                    <Button
                      size="small"
                      component="label"
                      startIcon={<Upload size={14} />}
                      disabled={showUpload.isLoading}
                      className={styles.actionButton}
                    >
                      {showUpload.isLoading ? 'Uploading…' : 'Upload Multiple Episodes'}
                      <input type="file" hidden accept=".xlsx,.xls" onChange={handleUpload} />
                    </Button>
                  )}
                </Box>
              </Box>
              {(episodesLoading || episodes.length > 0) && (
                <EpisodeTable
                  episodes={episodes}
                  isLoading={episodesLoading}
                  onOpen={(ep) => navigate(buildRoute.episode(ep.id))}
                  totalCount={episodesTotalCount}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onEndReached={() => fetchNextPage()}
                  scrollParent={scrollParent}
                  onExpand={() => navigate(buildRoute.showSummaryTable(id!))}
                />
              )}
            </>
          )}

          {activeTab === 'context' && (
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
          )}
        </Box>
      </Box>

      <AppModal open={seasonModal} onClose={() => setSeasonModal(false)} title="Add Season" onConfirm={handleCreateSeason} confirmLabel="Add" loading={createSeason.isLoading}>
        <Box>
          <Typography variant="body2" fontWeight={700} mb={0.75}>Season Name</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Season 1"
            value={seasonName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeasonName(e.target.value)}
          />
        </Box>
      </AppModal>

      <ShowChatWindow
        showId={id!}
        showName={show!.name}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <ShowMembersModal
        showId={id!}
        organizationId={show!.organization}
        open={membersModal}
        onClose={() => setMembersModal(false)}
      />
    </PageLayout>
  );
}
