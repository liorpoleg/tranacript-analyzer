import { Box, Card, CardContent, Typography, Grid, Stack } from '@mui/material';
import { Translate, TextAlignLeft, Brain } from '@phosphor-icons/react';
import JobStatusRow from '@/features/processing/components/molecules/JobStatusRow/JobStatusRow';
import { useJobs } from '@/features/processing/services/jobs';
import { formatDate } from '@/core/utils/formatDate';
import type { Episode } from '@/core/types';
import styles from './OverviewTab.module.css';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
}

function QuickAction({ icon, label, desc, onClick }: QuickActionProps): JSX.Element {
  return (
    <Card onClick={onClick} className={styles.quickAction}>
      <Box className={styles.quickActionIcon}>
        {icon}
      </Box>
      <Typography fontWeight={700} className={styles.quickActionLabel}>{label}</Typography>
      <Typography variant="body2" color="text.secondary" className={styles.quickActionDesc}>{desc}</Typography>
    </Card>
  );
}

interface OverviewTabProps {
  episode: Episode;
  onTabChange: (tab: string) => void;
}

export default function OverviewTab({ episode, onTabChange }: OverviewTabProps): JSX.Element {
  const { data: jobs = [] } = useJobs({ episode: episode?.id });
  const recentJobs = jobs.slice(0, 5);

  return (
    <Box>
      <Typography variant="h2" className={styles.title}>Overview</Typography>

      <Card className={styles.metaCard}>
        <CardContent>
          <Grid container spacing={3}>
            {([
              ['Air Date', formatDate(episode?.air_date)],
              ['Original Language', episode?.original_language || 'Unknown'],
              ['Characters', episode?.characters?.map((c) => c.name).join(', ') || '—'],
              ['Has English', episode?.has_translation_en ? 'Yes' : 'No'],
              ['Has Hebrew', episode?.has_translation_he ? 'Yes' : 'No'],
              ['Has Summary', episode?.has_summary ? 'Yes' : 'No'],
            ] as [string, string][]).map(([label, value]) => (
              <Grid item xs={6} sm={4} key={label}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" className={styles.metaLabel}>
                  {label}
                </Typography>
                <Typography fontWeight={600}>{value}</Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={1.5} className={styles.quickActionsGrid}>
        <Grid item xs={12} sm={4}><QuickAction icon={<Translate size={21} />} label="Transcript" desc="Upload transcript — translation and summary start automatically." onClick={() => onTabChange('transcript')} /></Grid>
        <Grid item xs={12} sm={4}><QuickAction icon={<TextAlignLeft size={21} />} label="Translations" desc="View Hebrew and English translations." onClick={() => onTabChange('translate')} /></Grid>
        <Grid item xs={12} sm={4}><QuickAction icon={<Brain size={21} />} label="Contextual" desc="Generate a contextual summary with your questions." onClick={() => onTabChange('contextual')} /></Grid>
      </Grid>

      <Card>
        <CardContent className={styles.recentRunsCardContent}>
          <Typography fontWeight={700} className={styles.recentRunsTitle}>Recent Runs</Typography>
          <Stack>
            {recentJobs.map((job) => <JobStatusRow key={job.id} job={job} />)}
            {recentJobs.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" className={styles.noJobs}>No jobs yet.</Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
