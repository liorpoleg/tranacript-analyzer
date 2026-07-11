import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Stack, Collapse,
} from '@mui/material';
import { Plus, ArrowLeft, Table as TableIcon, ChatCircleText, Upload, CaretDown, CaretRight } from '@phosphor-icons/react';
import PageLayout from '../../templates/PageLayout';
import AppButton from '../../atoms/AppButton';
import AppModal from '../../atoms/AppModal';
import ExpandableEpisodeRow from '../../organisms/ExpandableEpisodeRow';
import { useShow, useShowSeasons, useCreateSeason } from '../../api/shows';
import { useSeasonEpisodes, useCreateEpisode, useSeasonUpload } from '../../api/episodes';
import { useShowQuestions } from '../../api/questions';
import { useShowKnowledge } from '../../api/knowledge';
import { useToast } from '../../contexts/ToastContext';
import { buildRoute, ROUTES } from '../../constants/routes';
import { usePageTitle } from '../../hooks/usePageTitle';
import QuestionsPanel from '../../organisms/QuestionsPanel';
import KnowledgePanel from '../../organisms/KnowledgePanel';
import TwoColumnLayout from '../../templates/TwoColumnLayout';
import type { Season, Episode } from '../../types';

interface EpisodeFormState {
  episode_number: string;
  title: string;
  air_date: string;
}

interface SeasonSectionProps {
  season: Season;
  showId: string;
}

function SeasonSection({ season, showId }: SeasonSectionProps): JSX.Element {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: episodes = [], isLoading } = useSeasonEpisodes(season.id);
  const createEpisode = useCreateEpisode();
  const seasonUpload = useSeasonUpload(season.id);
  const [open, setOpen] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [form, setForm] = useState<EpisodeFormState>({ episode_number: '', title: '', air_date: '' });

  const handleCreate = async (): Promise<void> => {
    try {
      const ep = await createEpisode.mutateAsync({ ...form, primary_show: showId, season: season.id });
      toast.show('Episode created!', 'success');
      setOpen(false);
      navigate(buildRoute.episode(ep.id));
    } catch {
      toast.show('Failed to create episode.', 'error');
    }
  };

  const handleSeasonUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await seasonUpload.mutateAsync(file);
      toast.show(`Uploaded ${result.episodes_created} episode(s)!`, 'success');
    } catch {
      toast.show('Season upload failed.', 'error');
    }
    e.target.value = '';
  };

  return (
    <>
      <Box
        onClick={() => setCollapsed((c) => !c)}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          mb: collapsed ? 2 : 1, px: 1.5, py: 1.25, borderRadius: 2,
          cursor: 'pointer', userSelect: 'none',
          '&:hover': { bgcolor: 'background.default' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {collapsed ? <CaretRight size={15} weight="bold" /> : <CaretDown size={15} weight="bold" />}
          <Typography fontWeight={700}>
            Season {season.number}{season.title ? ` — ${season.title}` : ''}
          </Typography>
          {collapsed && episodes.length > 0 && (
            <Typography variant="body1" color="text.secondary">
              {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <Button
            size="small"
            startIcon={<ChatCircleText size={14} />}
            onClick={() => navigate(buildRoute.season(season.id))}
            sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
          >
            Chat & Settings
          </Button>
          <Button
            size="small"
            component="label"
            startIcon={<Upload size={14} />}
            disabled={seasonUpload.isLoading}
            sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
          >
            {seasonUpload.isLoading ? 'Uploading…' : 'Upload Season'}
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleSeasonUpload} />
          </Button>
          <AppButton size="small" startIcon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Add Episode
          </AppButton>
        </Box>
      </Box>

      <Collapse in={!collapsed}>
      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 90 }}>Ep #</TableCell>
                <TableCell sx={{ width: 90 }}>Title</TableCell>
                <TableCell sx={{ width: 130 }}>Air Date</TableCell>
                <TableCell sx={{ width: 220 }}>Characters</TableCell>
                <TableCell sx={{ width: 130 }}>Translations</TableCell>
                <TableCell sx={{ width: 110 }}>Summary</TableCell>
                <TableCell sx={{ width: 48 }} />
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={20} /></TableCell></TableRow>
              ) : episodes.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center"><Typography variant="body2" color="text.secondary" py={2}>No episodes yet.</Typography></TableCell></TableRow>
              ) : episodes.map((ep: Episode) => (
                <ExpandableEpisodeRow key={ep.id} episode={ep} onOpen={() => navigate(buildRoute.episode(ep.id))} />
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
      </Collapse>

      <AppModal open={open} onClose={() => setOpen(false)} title="Add Episode" onConfirm={handleCreate} confirmLabel="Create" loading={createEpisode.isLoading}>
        <Stack spacing={2}>
          {(['episode_number', 'title', 'air_date'] as const).map((field) => {
            const labelMap: Record<typeof field, string> = {
              episode_number: 'Episode Number *',
              title: 'Title *',
              air_date: 'Air Date',
            };
            return (
              <Box key={field}>
                <Typography variant="body2" fontWeight={700} mb={0.75}>{labelMap[field]}</Typography>
                <input
                  type={field === 'air_date' ? 'date' : 'text'}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e3e6ec', borderRadius: 10, fontSize: 14 }}
                  value={form[field]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                />
              </Box>
            );
          })}
        </Stack>
      </AppModal>
    </>
  );
}

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

  if (isLoading) return <PageLayout><Box sx={{ pt: 8, textAlign: 'center' }}><CircularProgress /></Box></PageLayout>;

  return (
    <PageLayout>
      <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(ROUTES.SHOWS)} sx={{ mb: 2, color: 'text.secondary' }}>
        All Shows
      </Button>

      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: 80, height: 80, borderRadius: 4, bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, flexShrink: 0, fontFamily: '"Baloo 2"' }}>
          {show!.name.slice(0, 2).toUpperCase()}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2">{show!.name}</Typography>
          <Typography color="text.secondary" mt={0.5}>{show!.description}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1.5, color: 'text.secondary' }}>
            <Typography variant="caption">{show!.season_count} seasons · {show!.episode_count} episodes</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <AppButton variant="outlined" startIcon={<TableIcon size={15} />} onClick={() => navigate(buildRoute.showSummaryTable(id!))}>Summary Table</AppButton>
          <AppButton variant="contained" startIcon={<Plus size={15} />} onClick={() => setSeasonModal(true)}>Add Season</AppButton>
        </Box>
      </Box>

      {seasons.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={6}>No seasons yet. Add a season to get started.</Typography>
      )}

      {seasons.map((season: Season) => (
        <SeasonSection key={season.id} season={season} showId={id!} />
      ))}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h2" fontSize="1.2rem" mb={2.5}>Show-Level Research</Typography>
      <TwoColumnLayout
        left={
          <Card>
            <CardContent sx={{ p: 3 }}>
              <QuestionsPanel questions={questions} showId={id} isLoading={questionsLoading} />
            </CardContent>
          </Card>
        }
        right={
          <Card>
            <CardContent sx={{ p: 3 }}>
              <KnowledgePanel files={knowledge} showId={id} isLoading={knowledgeLoading} />
            </CardContent>
          </Card>
        }
      />

      <AppModal open={seasonModal} onClose={() => setSeasonModal(false)} title="Add Season" onConfirm={handleCreateSeason} confirmLabel="Add" loading={createSeason.isLoading}>
        <Box>
          <Typography variant="body2" fontWeight={700} mb={0.75}>Season Number</Typography>
          <input
            type="number" min="1"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e3e6ec', borderRadius: 10, fontSize: 14 }}
            value={seasonNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeasonNumber(e.target.value)}
          />
        </Box>
      </AppModal>
    </PageLayout>
  );
}
