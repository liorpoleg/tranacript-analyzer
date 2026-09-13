import { Box, Typography, Card, CardContent } from '@mui/material';
import { FileXls } from '@phosphor-icons/react';
import type { Episode } from '@/core/types';
import styles from './FilesTab.module.css';

interface FilesTabProps {
  episode: Episode;
}

export default function FilesTab({ episode }: FilesTabProps): JSX.Element {
  return (
    <Box>
      <Typography variant="h2" className={styles.title}>Files</Typography>
      <Card>
        <CardContent className={styles.cardContent}>
          <Typography fontWeight={700} className={styles.sectionTitle}>Uploaded Files</Typography>
          {episode.has_origin_transcript ? (
            <Box className={styles.fileRow}>
              <FileXls size={20} color="#2196f3" />
              <Box>
                <Typography fontWeight={600} variant="body2">Origin Transcript</Typography>
                <Typography variant="caption" color="text.secondary">Parsed from uploaded Excel</Typography>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" className={styles.emptyState}>No files uploaded yet.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
