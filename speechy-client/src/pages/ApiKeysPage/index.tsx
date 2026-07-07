import { useState } from 'react';
import { Card, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Box, Typography, Alert, Stack, TextField } from '@mui/material';
import { Plus, Key } from '@phosphor-icons/react';
import PageLayout from '../../templates/PageLayout';
import SectionHeader from '../../atoms/SectionHeader';
import AppButton from '../../atoms/AppButton';
import AppModal from '../../atoms/AppModal';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../../api/users';
import { useToast } from '../../contexts/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatDate';
import type { APIKey } from '../../types';

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
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNewKey(null)}>
          <Typography fontWeight={700} mb={0.5}>Key created — copy it now. It won't be shown again.</Typography>
          <Box sx={{ fontFamily: 'monospace', bgcolor: 'background.default', p: 1, borderRadius: 1, wordBreak: 'break-all' }}>{newKey}</Box>
        </Alert>
      )}

      <Card sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Prefix</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
              : keys.map((k: APIKey) => (
                <TableRow key={k.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{k.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{k.key_prefix}…</TableCell>
                  <TableCell>{k.is_active ? <Typography color="success.main" fontWeight={700} variant="body2">Active</Typography> : <Typography color="text.disabled" variant="body2">Revoked</Typography>}</TableCell>
                  <TableCell>{formatDate(k.created_at)}</TableCell>
                  <TableCell>{k.is_active && <AppButton size="small" color="error" variant="outlined" onClick={() => handleRevoke(k.id)}>Revoke</AppButton>}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <AppModal open={modal} onClose={() => setModal(false)} title="Create API Key" onConfirm={handleCreate} confirmLabel="Create" loading={create.isLoading}>
        <Box>
          <Typography variant="body2" fontWeight={700} mb={0.75}>Key Name</Typography>
          <TextField fullWidth size="small" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="e.g. CI Integration" />
        </Box>
      </AppModal>
    </PageLayout>
  );
}
