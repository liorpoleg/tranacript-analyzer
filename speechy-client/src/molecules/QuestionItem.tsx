import { Box, Typography, IconButton } from '@mui/material';
import { Trash } from '@phosphor-icons/react';
import type { Question } from '../types';

interface QuestionItemProps {
  question: Question;
  onDelete?: (id: string) => void;
}

export default function QuestionItem({ question, onDelete }: QuestionItemProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5,
        borderRadius: 2, border: '1px solid', borderColor: 'divider',
        '&:hover': { bgcolor: 'background.default' },
      }}
    >
      <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.5 }}>
        {question.order_index + 1}. {question.text}
      </Typography>
      {onDelete && (
        <IconButton size="small" color="error" onClick={() => onDelete(question.id)}>
          <Trash size={14} />
        </IconButton>
      )}
    </Box>
  );
}
