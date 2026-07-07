import { Box, Typography, IconButton } from '@mui/material';
import { FileText, Trash } from '@phosphor-icons/react';
import { formatDate } from '../utils/formatDate';
import type { KnowledgeFile } from '../types';

interface KnowledgeFileItemProps {
  file: KnowledgeFile;
  onDelete?: (id: string) => void;
}

export default function KnowledgeFileItem({ file, onDelete }: KnowledgeFileItemProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
        borderRadius: 2, border: '1px solid', borderColor: 'divider',
        '&:hover': { bgcolor: 'background.default' },
      }}
    >
      <FileText size={18} color="#2196f3" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={600} noWrap variant="body2">{file.original_filename}</Typography>
        <Typography variant="caption" color="text.secondary">{formatDate(file.created_at)}</Typography>
      </Box>
      {onDelete && (
        <IconButton size="small" color="error" onClick={() => onDelete(file.id)}>
          <Trash size={14} />
        </IconButton>
      )}
    </Box>
  );
}
