import { Box } from '@mui/material';
import styles from './HighlightedText.module.css';

interface HighlightedTextProps {
  text: string;
  term: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function HighlightedText({ text, term }: HighlightedTextProps): JSX.Element {
  if (!term) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <Box key={i} component="span" className={styles.match}>
            {part}
          </Box>
        ) : (
          part
        )
      )}
    </>
  );
}
