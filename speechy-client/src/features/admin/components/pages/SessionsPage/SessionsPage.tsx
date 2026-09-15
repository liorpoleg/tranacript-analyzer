import { Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from '@mui/material';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import TableCard from '@/core/components/organisms/TableCard/TableCard';
import { useSessions, useRevokeSession } from '@/features/admin/services/users';
import { useToast } from '@/core/contexts/ToastContext';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import { formatDate } from '@/core/utils/formatDate';
import type { UserSession } from '@/core/types';
import styles from './SessionsPage.module.css';

export default function SessionsPage(): JSX.Element {
  usePageTitle('Sessions');
  const toast = useToast();
  const { data: sessions = [], isLoading } = useSessions();
  const revoke = useRevokeSession();

  const handleRevoke = async (id: string): Promise<void> => {
    try {
      await revoke.mutateAsync(id);
      toast.show('Session revoked.', 'success');
    } catch {
      toast.show('Failed to revoke.', 'error');
    }
  };

  return (
    <PageLayout>
      <SectionHeader title="Active Sessions" />
      <TableCard>
        <Table>
          <TableHead><TableRow><TableCell>User</TableCell><TableCell>IP Address</TableCell><TableCell>Login At</TableCell><TableCell>Last Active</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} className={styles.spinner} /></TableCell></TableRow>
              : sessions.map((s: UserSession) => (
                <TableRow key={s.id} hover>
                  <TableCell className={styles.usernameCell}>{s.username}</TableCell>
                  <TableCell className={styles.ipCell}>{s.ip_address}</TableCell>
                  <TableCell>{formatDate(s.login_at, 'MMM d HH:mm')}</TableCell>
                  <TableCell>{formatDate(s.last_active_at, 'MMM d HH:mm')}</TableCell>
                  <TableCell><AppButton size="small" color="error" variant="outlined" onClick={() => handleRevoke(s.id)}>Revoke</AppButton></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableCard>
    </PageLayout>
  );
}
