import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import UploadArea from '../atoms/UploadArea';
import KnowledgeFileItem from '../molecules/KnowledgeFileItem';
import { useUploadKnowledge, useDeleteKnowledge } from '../api/knowledge';
import { useToast } from '../contexts/ToastContext';
import type { KnowledgeFile } from '../types';

interface KnowledgePanelProps {
  files?: KnowledgeFile[];
  showId?: string;
  seasonId?: string;
  isLoading?: boolean;
}

export default function KnowledgePanel({ files = [], showId, seasonId, isLoading }: KnowledgePanelProps): JSX.Element {
  const toast = useToast();
  const upload = useUploadKnowledge({ showId, seasonId });
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
      <Typography fontWeight={700} mb={1.5}>Background Knowledge</Typography>
      <UploadArea
        onDrop={handleDrop}
        accept={{ 'text/plain': ['.txt'], 'text/markdown': ['.md'], 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
        label="Drop knowledge file here"
        hint=".txt, .md, .csv, .docx"
      />
      <Stack mt={2} spacing={1}>
        {isLoading ? <CircularProgress size={20} /> : files.map((f) => (
          <KnowledgeFileItem key={f.id} file={f} onDelete={handleDelete} />
        ))}
        {!isLoading && files.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No knowledge files yet.</Typography>
        )}
      </Stack>
    </Box>
  );
}
