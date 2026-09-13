import { Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from '@mui/material';
import PageLayout from '@/core/components/templates/PageLayout/PageLayout';
import SectionHeader from '@/core/components/atoms/SectionHeader/SectionHeader';
import TableCard from '@/core/components/organisms/TableCard/TableCard';
import { useOrganizations } from '@/features/admin/services/users';
import { usePageTitle } from '@/core/hooks/usePageTitle';
import type { Organization } from '@/core/types';
import styles from './OrganizationsPage.module.css';

export default function OrganizationsPage(): JSX.Element {
  usePageTitle('Organizations');
  const { data: orgs = [], isLoading } = useOrganizations();

  return (
    <PageLayout>
      <SectionHeader title="Organizations" />
      <TableCard>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Slug</TableCell><TableCell>Max Episodes</TableCell><TableCell>Max Users</TableCell></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} className={styles.spinner} /></TableCell></TableRow>
              : orgs.map((o: Organization) => (
                <TableRow key={o.id} hover>
                  <TableCell className={styles.nameCell}>{o.name}</TableCell>
                  <TableCell className={styles.slugCell}>{o.slug}</TableCell>
                  <TableCell>{o.max_episodes}</TableCell>
                  <TableCell>{o.max_users}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableCard>
    </PageLayout>
  );
}
