import { useState } from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell, Chip, CircularProgress,
  Box, Typography, Stack, TextField, MenuItem,
} from '@mui/material';
import { Plus } from '@phosphor-icons/react';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import TableCard from '@/core/components/organisms/TableCard/TableCard';
import { useUsers, useCreateUser } from '@/features/admin/services/users';
import { useToast } from '@/core/contexts/ToastContext';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import { formatDate } from '@/core/utils/formatDate';
import type { User } from '@/core/types';
import styles from './UsersPage.module.css';

type ChipColor = 'error' | 'primary' | 'default';

const ROLE_COLORS: Record<string, ChipColor> = { admin: 'error', manager: 'primary', analyst: 'default' };

interface UserForm {
  username: string;
  email: string;
  password: string;
  role: string;
  [key: string]: string;
}

export default function UsersPage(): JSX.Element {
  usePageTitle('Users');
  const toast = useToast();
  const { data: users = [], isLoading } = useUsers();
  const create = useCreateUser();
  const [modal, setModal] = useState<boolean>(false);
  const [form, setForm] = useState<UserForm>({ username: '', email: '', password: '', role: 'analyst' });

  const handleCreate = async (): Promise<void> => {
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
      <TableCard>
        <Table>
          <TableHead><TableRow><TableCell>Username</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Organization</TableCell><TableCell>Last Login</TableCell></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} className={styles.spinner} /></TableCell></TableRow>
              : users.map((u: User) => (
                <TableRow key={u.id} hover>
                  <TableCell className={styles.usernameCell}>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Chip label={u.role} size="small" color={ROLE_COLORS[u.role] ?? 'default'} /></TableCell>
                  <TableCell>{u.organization_name}</TableCell>
                  <TableCell>{formatDate(u.last_login)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableCard>

      <AppModal open={modal} onClose={() => setModal(false)} title="Add User" onConfirm={handleCreate} confirmLabel="Create" loading={create.isLoading}>
        <Stack spacing={2}>
          {([['username', 'Username'], ['email', 'Email'], ['password', 'Password']] as [string, string][]).map(([f, l]) => (
            <Box key={f}>
              <Typography variant="body2" fontWeight={700} mb={0.75}>{l}</Typography>
              <TextField
                fullWidth
                size="small"
                type={f === 'password' ? 'password' : 'text'}
                value={(form as Record<string, string>)[f]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [f]: e.target.value }))}
              />
            </Box>
          ))}
          <Box>
            <Typography variant="body2" fontWeight={700} mb={0.75}>Role</Typography>
            <TextField
              fullWidth
              select
              size="small"
              value={form.role}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              {['admin', 'manager', 'analyst'].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Box>
        </Stack>
      </AppModal>
    </PageLayout>
  );
}
