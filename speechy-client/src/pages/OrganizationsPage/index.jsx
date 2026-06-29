import { Card, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from '@mui/material';
import PageLayout from '../../templates/PageLayout';
import SectionHeader from '../../atoms/SectionHeader';
import { useOrganizations } from '../../api/users';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function OrganizationsPage() {
  usePageTitle('Organizations');
  const { data: orgs = [], isLoading } = useOrganizations();

  return (
    <PageLayout>
      <SectionHeader title="Organizations" />
      <Card sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Slug</TableCell><TableCell>Max Episodes</TableCell><TableCell>Max Users</TableCell></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
              : orgs.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell fontWeight={600}>{o.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{o.slug}</TableCell>
                  <TableCell>{o.max_episodes}</TableCell>
                  <TableCell>{o.max_users}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </PageLayout>
  );
}
