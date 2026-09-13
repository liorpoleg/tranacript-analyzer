import { Box, Typography, IconButton } from '@mui/material';
import { FileText, Trash } from '@phosphor-icons/react';
import { formatDate } from '@/core/utils/formatDate';
import type { KnowledgeFile } from '@/core/types';
import styles from './KnowledgeFileItem.module.css';

interface KnowledgeFileItemProps {
  file: KnowledgeFile;
  onDelete?: (id: string) => void;
}

export default function KnowledgeFileItem({ file, onDelete }: KnowledgeFileItemProps): JSX.Element {
  return (
    <Box className={styles.row}>
      <FileText size={18} color="#2196f3" />
      <Box className={styles.info}>
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
