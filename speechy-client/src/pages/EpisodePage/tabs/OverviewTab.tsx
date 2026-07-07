import { Box, Card, CardContent, Typography, Grid, Stack } from '@mui/material';
import { Translate, TextAlignLeft, Brain } from '@phosphor-icons/react';
import AppButton from '../../../atoms/AppButton';
import JobStatusRow from '../../../molecules/JobStatusRow';
import { useJobs } from '../../../api/jobs';
import { formatDate } from '../../../utils/formatDate';
import type { Episode } from '../../../types';

interface EpisodeWithMeta extends Episode {
  has_summary?: boolean;
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}

function QuickAction({ icon, label, desc, onClick }: QuickActionProps): JSX.Element {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer', p: 2.5,
        transition: 'transform 0.12s, box-shadow 0.12s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 26px rgba(0,0,0,0.09)' },
      }}
    >
      <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: 'primary.50', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
        {icon}
      </Box>
      <Typography fontWeight={700} mb={0.5}>{label}</Typography>
      <Typography variant="body2" color="text.secondary" lineHeight={1.4}>{desc}</Typography>
    </Card>
  );
}

interface OverviewTabProps {
  episode: EpisodeWithMeta;
  onTabChange: (tab: string) => void;
}

export default function OverviewTab({ episode, onTabChange }: OverviewTabProps): JSX.Element {
  const { data: jobs = [] } = useJobs({ episode: episode?.id });
  const recentJobs = jobs.slice(0, 5);

  return (
    <Box>
      <Typography variant="h2" fontSize="1.3rem" mb={2}>Overview</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={3}>
            {([
              ['Air Date', formatDate(episode?.air_date)],
              ['Original Language', episode?.original_language || 'Unknown'],
              ['Featured Characters', episode?.featured_characters?.join(', ') || '—'],
              ['Has English', episode?.has_translation_en ? 'Yes' : 'No'],
              ['Has Hebrew', episode?.has_translation_he ? 'Yes' : 'No'],
              ['Has Summary', episode?.has_summary ? 'Yes' : 'No'],
            ] as [string, string][]).map(([label, value]) => (
              <Grid item xs={6} sm={4} key={label}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.04em" display="block" mb={0.5}>
                  {label}
                </Typography>
                <Typography fontWeight={600}>{value}</Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={1.5} mb={2}>
        <Grid item xs={12} sm={4}><QuickAction icon={<Translate size={21} />} label="Translate" desc="Upload & translate this episode's transcript." onClick={() => onTabChange('translate')} /></Grid>
        <Grid item xs={12} sm={4}><QuickAction icon={<TextAlignLeft size={21} />} label="Summarize" desc="Generate a straightforward episode summary." onClick={() => onTabChange('summary')} /></Grid>
        <Grid item xs={12} sm={4}><QuickAction icon={<Brain size={21} />} label="Contextual" desc="Generate a contextual summary with your questions." onClick={() => onTabChange('contextual')} /></Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 1 }}>
          <Typography fontWeight={700} px={2} pt={1.5} pb={1}>Recent Runs</Typography>
          <Stack>
            {recentJobs.map((job) => <JobStatusRow key={job.id} job={job} />)}
            {recentJobs.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>No jobs yet.</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
