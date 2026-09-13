import { Card, CardContent, Box, Typography, Chip, Divider } from '@mui/material';
import type { TranscriptRow } from '@/core/types';
import styles from './TranscriptViewer.module.css';

interface TranscriptViewerProps {
  title: string;
  rows: TranscriptRow[];
  maxHeight?: number;
  direction?: 'ltr' | 'rtl';
}

export default function TranscriptViewer({ title, rows, maxHeight = 500, direction = 'ltr' }: TranscriptViewerProps): JSX.Element {
  return (
    <Card>
      <CardContent className={styles.cardContent}>
        <Box className={styles.header}>
          <Typography fontWeight={700}>{title}</Typography>
          <Chip label={`${rows.length} lines`} size="small" />
        </Box>
        <Divider />
        <Box className={styles.rows} style={{ maxHeight }}>
          {rows.map((row, i) => (
            <Box key={i} className={styles.row} style={{ direction }}>
              <Typography variant="body2" fontWeight={700} className={styles.characterName}>
                {row.character_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" className={styles.text}>
                {row.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
