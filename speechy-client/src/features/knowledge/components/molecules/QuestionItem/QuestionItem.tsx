import { Box, Typography, IconButton } from '@mui/material';
import { Trash } from '@phosphor-icons/react';
import type { Question } from '@/core/types';
import styles from './QuestionItem.module.css';

interface QuestionItemProps {
  question: Question;
  onDelete?: (id: string) => void;
}

export default function QuestionItem({ question, onDelete }: QuestionItemProps): JSX.Element {
  return (
    <Box className={styles.row}>
      <Typography variant="body2" className={styles.text}>
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
