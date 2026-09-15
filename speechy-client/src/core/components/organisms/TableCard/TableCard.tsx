import { Card, TableContainer } from '@mui/material';
import styles from './TableCard.module.css';

interface TableCardProps {
  children: React.ReactNode;
}

export default function TableCard({ children }: TableCardProps): JSX.Element {
  return (
    <Card className={styles.card}>
      <TableContainer className={styles.container}>
        {children}
      </TableContainer>
    </Card>
  );
}
