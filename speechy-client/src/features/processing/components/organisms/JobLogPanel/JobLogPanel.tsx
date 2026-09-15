import { Box, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import styles from './JobLogPanel.module.css';

interface JobLogPanelProps {
  lines?: string[];
}

export default function JobLogPanel({ lines = [] }: JobLogPanelProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines.length]);

  return (
    <Box ref={ref} className={styles.panel}>
      {lines.length === 0 && (
        <Typography className={styles.waiting}>Waiting for logs…</Typography>
      )}
      {lines.map((line, i) => (
        <Box key={i} component="div" className={line.startsWith('ERROR') ? styles.lineError : styles.line}>
          {line}
        </Box>
      ))}
    </Box>
  );
}
