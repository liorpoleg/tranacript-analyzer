import { useState } from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell, Chip, CircularProgress,
  Box, Typography, TextField, MenuItem, IconButton, Alert,
} from '@mui/material';
import { Trash, LockSimple } from '@phosphor-icons/react';
import AppModal from '@/core/components/atoms/AppModal/AppModal';
import AppButton from '@/core/components/atoms/AppButton/AppButton';
import TableCard from '@/core/components/organisms/TableCard/TableCard';
import {
  useShowMembers, useAddShowMember, useUpdateShowMemberRole, useRemoveShowMember,
} from '@/features/shows/services/shows';
import { useUsers } from '@/features/admin/services/users';
import { useToast } from '@/core/contexts/ToastContext';
import type { ShowRole } from '@/core/types';
import styles from './ShowMembersModal.module.css';

interface ShowMembersModalProps {
  showId: string;
  organizationId: string;
  open: boolean;
  onClose: () => void;
}

type ChipColor = 'error' | 'primary' | 'default';
const ROLE_COLORS: Record<ShowRole, ChipColor> = { owner: 'error', editor: 'primary', viewer: 'default' };
const ROLES: ShowRole[] = ['owner', 'editor', 'viewer'];

export default function ShowMembersModal({ showId, organizationId, open, onClose }: ShowMembersModalProps): JSX.Element {
  const toast = useToast();
  const { data: members = [], isLoading } = useShowMembers(showId);
  const { data: allUsers = [] } = useUsers();
  const addMember = useAddShowMember(showId);
  const updateRole = useUpdateShowMemberRole(showId);
  const removeMember = useRemoveShowMember(showId);

  const [newUserId, setNewUserId] = useState<string>('');
  const [newRole, setNewRole] = useState<ShowRole>('viewer');

  const ownMemberUserIds = new Set(members.filter((m) => !m.inherited).map((m) => m.user));
  const candidates = allUsers.filter(
    (u) => u.organization === organizationId && !ownMemberUserIds.has(u.id),
  );

  const handleAdd = async (): Promise<void> => {
    if (!newUserId) return;
    try {
      await addMember.mutateAsync({ user: newUserId, role: newRole });
      toast.show('Member added!', 'success');
      setNewUserId('');
      setNewRole('viewer');
    } catch {
      toast.show('Failed to add member.', 'error');
    }
  };

  const handleRoleChange = async (memberId: string, role: string): Promise<void> => {
    try {
      await updateRole.mutateAsync({ memberId, role });
      toast.show('Role updated.', 'success');
    } catch {
      toast.show('Failed to update role.', 'error');
    }
  };

  const handleRemove = async (memberId: string): Promise<void> => {
    try {
      await removeMember.mutateAsync(memberId);
      toast.show('Member removed.', 'success');
    } catch {
      toast.show('Failed to remove member.', 'error');
    }
  };

  return (
    <AppModal open={open} onClose={onClose} title="Manage Members">
      <TableCard>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">&nbsp;</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : members.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center">No members have access yet (besides org admins).</TableCell></TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{m.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{m.email}</Typography>
                    {m.inherited && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Inherited from {m.inherited_from_show_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {m.inherited ? (
                      <Chip label={m.role} size="small" color={ROLE_COLORS[m.role]} />
                    ) : (
                      <TextField
                        select
                        size="small"
                        value={m.role}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRoleChange(m.id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <MenuItem key={r} value={r}>
                            <Chip label={r} size="small" color={ROLE_COLORS[r]} className={styles.roleChip} />
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {m.inherited ? (
                      <LockSimple size={16} className={styles.lockIcon} />
                    ) : (
                      <IconButton size="small" onClick={() => handleRemove(m.id)}>
                        <Trash size={16} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

      {members.length > 0 && members.every((m) => m.inherited) && (
        <Alert severity="info" className={styles.inheritedNotice}>
          These members are inherited from {members[0].inherited_from_show_name}. Adding a member here
          gives this show its own member list, which stops inheriting from the parent.
        </Alert>
      )}

      <Box className={styles.addRow}>
        <TextField
          select
          size="small"
          label="Add member"
          value={newUserId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserId(e.target.value)}
          className={styles.userSelect}
        >
          {candidates.map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.username} ({u.email})</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Role"
          value={newRole}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRole(e.target.value as ShowRole)}
          className={styles.roleSelect}
        >
          {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <AppButton variant="contained" onClick={handleAdd} disabled={!newUserId} loading={addMember.isLoading}>
          Add
        </AppButton>
      </Box>
    </AppModal>
  );
}
