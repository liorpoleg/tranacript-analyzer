import { Box, Typography, Card, CardContent } from '@mui/material';
import { FileXls } from '@phosphor-icons/react';
import type { Episode } from '../../../types';

interface FilesTabProps {
  episode: Episode;
}

export default function FilesTab({ episode }: FilesTabProps): JSX.Element {
  return (
    <Box>
      <Typography variant="h2" fontSize="1.3rem" mb={2}>Files</Typography>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography fontWeight={700} mb={2}>Uploaded Files</Typography>
          {episode.has_origin_transcript ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <FileXls size={20} color="#2196f3" />
              <Box>
                <Typography fontWeight={600} variant="body2">Origin Transcript</Typography>
                <Typography variant="caption" color="text.secondary">Parsed from uploaded Excel</Typography>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={4}>No files uploaded yet.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
