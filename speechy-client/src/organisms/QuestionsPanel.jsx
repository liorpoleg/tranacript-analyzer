import { Box, Typography, TextField, Stack, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import QuestionItem from '../molecules/QuestionItem';
import AppButton from '../atoms/AppButton';
import { useCreateQuestion, useDeleteQuestion } from '../api/questions';
import { useToast } from '../contexts/ToastContext';

export default function QuestionsPanel({ questions = [], showId, seasonId, isLoading }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const create = useCreateQuestion({ showId, seasonId });
  const del = useDeleteQuestion();

  const handleAdd = async () => {
    if (!text.trim()) return;
    try {
      await create.mutateAsync({ text: text.trim(), order_index: questions.length });
      setText('');
      toast.show('Question added.', 'success');
    } catch {
      toast.show('Failed to add question.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await del.mutateAsync(id);
      toast.show('Question deleted.', 'success');
    } catch {
      toast.show('Delete failed.', 'error');
    }
  };

  return (
    <Box>
      <Typography fontWeight={700} mb={1.5}>Research Questions</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
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
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No questions yet.</Typography>
        )}
      </Stack>
    </Box>
  );
}
