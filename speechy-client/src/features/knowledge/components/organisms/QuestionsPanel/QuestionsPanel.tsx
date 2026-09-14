import { Box, Typography, TextField, Stack, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import QuestionItem from '@/features/knowledge/components/molecules/QuestionItem/QuestionItem';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import { useCreateQuestion, useDeleteQuestion } from '@/features/knowledge/services/questions';
import { useToast } from '@/core/contexts/ToastContext';
import type { Question } from '@/core/types';
import styles from './QuestionsPanel.module.css';

interface QuestionsPanelProps {
  questions?: Question[];
  showId: string | undefined;
  isLoading?: boolean;
}

export default function QuestionsPanel({ questions = [], showId, isLoading }: QuestionsPanelProps): JSX.Element {
  const toast = useToast();
  const [text, setText] = useState<string>('');
  const create = useCreateQuestion(showId);
  const del = useDeleteQuestion();

  const handleAdd = async (): Promise<void> => {
    if (!text.trim()) return;
    try {
      await create.mutateAsync({ text: text.trim(), order_index: questions.length });
      setText('');
      toast.show('Question added.', 'success');
    } catch {
      toast.show('Failed to add question.', 'error');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await del.mutateAsync(id);
      toast.show('Question deleted.', 'success');
    } catch {
      toast.show('Delete failed.', 'error');
    }
  };

  return (
    <Box>
      <Typography fontWeight={700} className={styles.title}>Research Questions</Typography>
      <Box className={styles.addRow}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a question..."
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <AppButton variant="contained" onClick={handleAdd} loading={create.isLoading} startIcon={<Plus size={16} />}>
          Add
        </AppButton>
      </Box>
      <Stack spacing={1}>
        {isLoading ? <CircularProgress size={20} /> : questions.map((q) => (
          <QuestionItem key={q.id} question={q} onDelete={handleDelete} />
        ))}
        {!isLoading && questions.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" className={styles.emptyMessage}>No questions yet.</Typography>
        )}
      </Stack>
    </Box>
  );
}
