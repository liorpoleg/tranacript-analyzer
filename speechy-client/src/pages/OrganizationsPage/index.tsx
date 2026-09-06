import { Card, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from '@mui/material';
import PageLayout from '../../templates/PageLayout';
import SectionHeader from '../../atoms/SectionHeader';
import { useOrganizations } from '../../api/users';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Organization } from '../../types';

export default function OrganizationsPage(): JSX.Element {
  usePageTitle('Organizations');
  const { data: orgs = [], isLoading } = useOrganizations();

  return (
    <PageLayout>
      <SectionHeader title="Organizations" />
      <Card sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Slug</TableCell><TableCell>Max Episodes</TableCell><TableCell>Max Users</TableCell></TableRow></TableHead>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
                : orgs.map((o: Organization) => (
                  <TableRow key={o.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{o.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{o.slug}</TableCell>
                    <TableCell>{o.max_episodes}</TableCell>
                    <TableCell>{o.max_users}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </PageLayout>
  );
}
