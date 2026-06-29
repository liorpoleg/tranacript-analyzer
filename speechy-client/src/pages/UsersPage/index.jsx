import { useState } from 'react';
import { Card, Table, TableHead, TableBody, TableRow, TableCell, Chip, CircularProgress, Box, Typography, Stack } from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import PageLayout from '../../templates/PageLayout';
import SectionHeader from '../../atoms/SectionHeader';
import AppButton from '../../atoms/AppButton';
import AppModal from '../../atoms/AppModal';
import { useUsers, useCreateUser } from '../../api/users';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatDate';

const ROLE_COLORS = { admin: 'error', manager: 'primary', analyst: 'default' };

export default function UsersPage() {
  usePageTitle('Users');
  const toast = useToast();
  const { data: users = [], isLoading } = useUsers();
  const create = useCreateUser();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'analyst' });

  const handleCreate = async () => {
    try {
      await create.mutateAsync(form);
      toast.show('User created!', 'success');
      setModal(false);
    } catch {
      toast.show('Failed to create user.', 'error');
    }
  };

  return (
    <PageLayout>
      <SectionHeader title="Users" action={<AppButton variant="contained" startIcon={<Plus size={16} />} onClick={() => setModal(true)}>Add User</AppButton>} />
      <Card sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead><TableRow><TableCell>Username</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Organization</TableCell><TableCell>Last Login</TableCell></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
              : users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell fontWeight={600}>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Chip label={u.role} size="small" color={ROLE_COLORS[u.role] ?? 'default'} /></TableCell>
                  <TableCell>{u.organization_name}</TableCell>
                  <TableCell>{formatDate(u.last_login)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <AppModal open={modal} onClose={() => setModal(false)} title="Add User" onConfirm={handleCreate} confirmLabel="Create" loading={create.isLoading}>
        <Stack spacing={2}>
          {[['username', 'Username'], ['email', 'Email'], ['password', 'Password']].map(([f, l]) => (
            <Box key={f}>
              <Typography variant="body2" fontWeight={700} mb={0.75}>{l}</Typography>
              <input type={f === 'password' ? 'password' : 'text'} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e3e6ec', borderRadius: 10, fontSize: 14 }} value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))} />
            </Box>
          ))}
          <Box>
            <Typography variant="body2" fontWeight={700} mb={0.75}>Role</Typography>
            <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #e3e6ec', borderRadius: 10, fontSize: 14 }} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
              {['admin', 'manager', 'analyst'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Box>
        </Stack>
      </AppModal>
    </PageLayout>
  );
}
