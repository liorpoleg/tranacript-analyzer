import { useState } from 'react';
import { Card, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Box, TextField, InputAdornment, Chip } from '@mui/material';
import { MagnifyingGlass } from '@phosphor-icons/react';
import TablePageLayout from '../../templates/TablePageLayout';
import { useAuditLogs } from '../../api/users';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/formatDate';
import type { AuditLog } from '../../types';

export default function AuditLogsPage(): JSX.Element {
  usePageTitle('Audit Logs');
  const [action, setAction] = useState<string>('');
  const { data: logs = [], isLoading } = useAuditLogs(action ? { action } : {});

  return (
    <TablePageLayout
      title="Audit Logs"
      filterBar={
        <TextField size="small" placeholder="Filter by action..." value={action} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAction(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={16} /></InputAdornment> }} />
      }
    >
      <Card sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead><TableRow><TableCell>Timestamp</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell><TableCell>Resource</TableCell></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
              : (logs as AuditLog[]).map?.((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatDate(log.timestamp, 'MMM d HH:mm:ss')}</TableCell>
                  <TableCell>{log.username ?? '—'}</TableCell>
                  <TableCell><Chip label={log.action} size="small" color="primary" variant="outlined" /></TableCell>
                  <TableCell>{log.resource_type}{log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </TablePageLayout>
  );
}
