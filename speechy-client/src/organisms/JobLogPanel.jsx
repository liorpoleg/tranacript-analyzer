import { Box, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';

export default function JobLogPanel({ lines = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines.length]);

  return (
    <Box
      ref={ref}
      sx={{
        bgcolor: '#0f1117',
        borderRadius: 2,
        p: 2,
        maxHeight: 400,
        overflowY: 'auto',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        fontSize: '0.8rem',
        lineHeight: 1.6,
      }}
    >
      {lines.length === 0 && (
        <Typography sx={{ color: '#6b7280', fontFamily: 'inherit' }}>Waiting for logs…</Typography>
      )}
      {lines.map((line, i) => (
        <Box key={i} component="div" sx={{ color: line.startsWith('ERROR') ? '#ef4444' : '#d1fae5', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {line}
        </Box>
      ))}
    </Box>
  );
}
