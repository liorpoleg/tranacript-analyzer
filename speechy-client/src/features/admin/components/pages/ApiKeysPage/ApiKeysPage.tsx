import { useState } from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Box, Typography, Alert, Stack, TextField } from '@mui/material';
import { Plus, Key } from '@phosphor-icons/react';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import TableCard from '@/core/components/organisms/TableCard/TableCard';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/features/admin/services/users';
import { useToast } from '@/core/contexts/ToastContext';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import { formatDate } from '@/core/utils/formatDate';
import type { APIKey } from '@/core/types';
import styles from './ApiKeysPage.module.css';

export default function ApiKeysPage(): JSX.Element {
  usePageTitle('API Keys');
  const toast = useToast();
  const { data: keys = [], isLoading } = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const [modal, setModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleCreate = async (): Promise<void> => {
    try {
      const key = await create.mutateAsync({ name }) as { key: string };
      setNewKey(key.key);
      setModal(false);
      setName('');
    } catch {
      toast.show('Failed to create key.', 'error');
    }
  };

  const handleRevoke = async (id: string): Promise<void> => {
    try {
      await revoke.mutateAsync(id);
      toast.show('Key revoked.', 'success');
    } catch {
      toast.show('Failed to revoke key.', 'error');
    }
  };

  return (
    <PageLayout>
      <SectionHeader title="API Keys" action={<AppButton variant="contained" startIcon={<Plus size={16} />} onClick={() => setModal(true)}>Create Key</AppButton>} />

      {newKey && (
        <Alert severity="success" className={styles.alert} onClose={() => setNewKey(null)}>
          <Typography fontWeight={700} className={styles.keyTitle}>Key created — copy it now. It won't be shown again.</Typography>
          <Box className={styles.keyBox}>{newKey}</Box>
        </Alert>
      )}

      <TableCard>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Prefix</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} className={styles.spinner} /></TableCell></TableRow>
              : keys.map((k: APIKey) => (
                <TableRow key={k.id} hover>
                  <TableCell className={styles.nameCell}>{k.name}</TableCell>
                  <TableCell className={styles.prefixCell}>{k.key_prefix}…</TableCell>
                  <TableCell>{k.is_active ? <Typography color="success.main" fontWeight={700} variant="body2">Active</Typography> : <Typography color="text.disabled" variant="body2">Revoked</Typography>}</TableCell>
                  <TableCell>{formatDate(k.created_at)}</TableCell>
                  <TableCell>{k.is_active && <AppButton size="small" color="error" variant="outlined" onClick={() => handleRevoke(k.id)}>Revoke</AppButton>}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableCard>

      <AppModal open={modal} onClose={() => setModal(false)} title="Create API Key" onConfirm={handleCreate} confirmLabel="Create" loading={create.isLoading}>
        <Box>
          <Typography variant="body2" fontWeight={700} mb={0.75}>Key Name</Typography>
          <TextField fullWidth size="small" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="e.g. CI Integration" />
        </Box>
      </AppModal>
    </PageLayout>
  );
}
