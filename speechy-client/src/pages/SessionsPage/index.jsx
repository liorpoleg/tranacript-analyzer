import { Card, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Chip } from '@mui/material';
import PageLayout from '../../templates/PageLayout';
import SectionHeader from '../../atoms/SectionHeader';
import AppButton from '../../atoms/AppButton';
import { useSessions, useRevokeSession } from '../../api/users';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatDate';

export default function SessionsPage() {
  usePageTitle('Sessions');
  const toast = useToast();
  const { data: sessions = [], isLoading } = useSessions();
  const revoke = useRevokeSession();

  const handleRevoke = async (id) => {
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
      <Card sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead><TableRow><TableCell>User</TableCell><TableCell>IP Address</TableCell><TableCell>Login At</TableCell><TableCell>Last Active</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
              : sessions.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell fontWeight={600}>{s.username}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{s.ip_address}</TableCell>
                  <TableCell>{formatDate(s.login_at, 'MMM d HH:mm')}</TableCell>
                  <TableCell>{formatDate(s.last_active_at, 'MMM d HH:mm')}</TableCell>
                  <TableCell><AppButton size="small" color="error" variant="outlined" onClick={() => handleRevoke(s.id)}>Revoke</AppButton></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </PageLayout>
  );
}
