import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import UploadArea from '@/core/components/atoms/UploadArea/UploadArea';
import KnowledgeFileItem from '@/features/knowledge/components/molecules/KnowledgeFileItem/KnowledgeFileItem';
import { useUploadKnowledge, useDeleteKnowledge } from '@/features/knowledge/services/knowledge';
import { useToast } from '@/core/contexts/ToastContext';
import type { KnowledgeFile } from '@/core/types';
import styles from './KnowledgePanel.module.css';

interface KnowledgePanelProps {
  files?: KnowledgeFile[];
  showId: string | undefined;
  isLoading?: boolean;
}

export default function KnowledgePanel({ files = [], showId, isLoading }: KnowledgePanelProps): JSX.Element {
  const toast = useToast();
  const upload = useUploadKnowledge(showId);
  const deleteFile = useDeleteKnowledge();

  const handleDrop = async ([file]: File[]): Promise<void> => {
    if (!file) return;
    try {
      await upload.mutateAsync(file);
      toast.show('Knowledge file uploaded.', 'success');
    } catch {
      toast.show('Upload failed.', 'error');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteFile.mutateAsync(id);
      toast.show('File deleted.', 'success');
    } catch {
      toast.show('Delete failed.', 'error');
    }
  };

  return (
    <Box>
      <Typography fontWeight={700} className={styles.title}>Background Knowledge</Typography>
      <UploadArea
        onDrop={handleDrop}
        accept={{ 'text/plain': ['.txt'], 'text/markdown': ['.md'], 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
        label="Drop knowledge file here"
        hint=".txt, .md, .csv, .docx"
      />
      <Stack className={styles.list} spacing={1}>
        {isLoading ? <CircularProgress size={20} /> : files.map((f) => (
          <KnowledgeFileItem key={f.id} file={f} onDelete={handleDelete} />
        ))}
        {!isLoading && files.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" className={styles.emptyMessage}>No knowledge files yet.</Typography>
        )}
      </Stack>
    </Box>
  );
}
