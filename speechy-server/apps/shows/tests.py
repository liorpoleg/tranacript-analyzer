from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import Organization, User, Role
from apps.shows.models import Show, ShowMembership, ShowRole
from apps.shows.permissions import get_effective_role, get_visible_show_ids_for_user
from apps.shows.services import (
    get_shows_for_user, create_show, get_descendant_ids,
    get_show_tree_with_counts, truncate_tree_depth,
)


def make_org(slug='test-org'):
    return Organization.objects.create(name='Test Org', slug=slug)


def make_user(org, username='testuser', email='test@example.com'):
    return User.objects.create_user(
        username=username, email=email, password='testpass123', organization=org
    )


class ShowModelTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.show = Show.objects.create(organization=self.org, name='Test Show')

    def test_str(self):
        self.assertEqual(str(self.show), 'Test Show')

    def test_direct_episode_count_starts_zero(self):
        self.assertEqual(self.show.direct_episode_count, 0)

    def test_direct_children_count_starts_zero(self):
        self.assertEqual(self.show.direct_children_count, 0)

    def test_uuid_pk(self):
        self.assertEqual(len(str(self.show.id)), 36)

    def test_is_active_default(self):
        self.assertTrue(self.show.is_active)

    def test_get_root_is_self_for_top_level(self):
        self.assertEqual(self.show.get_root(), self.show)


class RecursiveShowTest(TestCase):
    """A 'season' is just a Show with parent set — any number of levels deep."""

    def setUp(self):
        self.org = make_org()
        self.show = Show.objects.create(organization=self.org, name='Root Show')
        self.season = Show.objects.create(organization=self.org, parent=self.show, name='Season 1')
        self.subseason = Show.objects.create(organization=self.org, parent=self.season, name='Sub-season 1.1')

    def test_children_relation(self):
        self.assertIn(self.season, self.show.children.all())
        self.assertIn(self.subseason, self.season.children.all())

    def test_get_root_walks_up_to_top(self):
        self.assertEqual(self.subseason.get_root(), self.show)
        self.assertEqual(self.season.get_root(), self.show)

    def test_organization_auto_set_from_parent(self):
        other_org = make_org('other-org')
        child = Show(organization=other_org, parent=self.show, name='Should inherit org')
        child.save()
        self.assertEqual(child.organization_id, self.org.id)

    def test_cannot_be_own_parent(self):
        with self.assertRaises(ValidationError):
            self.show.parent = self.show
            self.show.save()

    def test_cannot_create_cycle(self):
        with self.assertRaises(ValidationError):
            self.show.parent = self.subseason
            self.show.save()

    def test_max_depth_enforced(self):
        node = self.subseason
        with self.assertRaises(ValidationError):
            for i in range(Show.MAX_DEPTH + 2):
                node = Show.objects.create(organization=self.org, parent=node, name=f'Level {i}')

    def test_get_descendant_ids_returns_all_levels(self):
        ids = get_descendant_ids(self.show.id)
        self.assertIn(self.season.id, ids)
        self.assertIn(self.subseason.id, ids)

    def test_get_descendant_ids_excludes_self_and_unrelated(self):
        other = Show.objects.create(organization=self.org, name='Unrelated Show')
        ids = get_descendant_ids(self.show.id)
        self.assertNotIn(self.show.id, ids)
        self.assertNotIn(other.id, ids)


class ShowTreeWithCountsTest(TestCase):
    def setUp(self):
        from apps.episodes.models import Episode

        self.org = make_org()
        self.show = Show.objects.create(organization=self.org, name='Root Show')
        self.season = Show.objects.create(organization=self.org, parent=self.show, name='Season 1')
        self.subseason = Show.objects.create(organization=self.org, parent=self.season, name='Sub-season 1.1')

        Episode.objects.create(primary_show=self.show, episode_number='1', title='Direct on root')
        Episode.objects.create(primary_show=self.season, episode_number='2', title='Direct on season')
        Episode.objects.create(primary_show=self.subseason, episode_number='3', title='Direct on subseason')

    def test_direct_counts_per_node(self):
        tree, _nodes = get_show_tree_with_counts(self.show.id)
        self.assertEqual(tree['direct_episode_count'], 1)
        season_node = tree['children'][0]
        self.assertEqual(season_node['direct_episode_count'], 1)
        subseason_node = season_node['children'][0]
        self.assertEqual(subseason_node['direct_episode_count'], 1)

    def test_episode_count_rolls_up_recursively(self):
        tree, _nodes = get_show_tree_with_counts(self.show.id)
        # root's recursive total = its own + season's + subseason's = 1 + 1 + 1
        self.assertEqual(tree['episode_count'], 3)
        season_node = tree['children'][0]
        self.assertEqual(season_node['episode_count'], 2)

    def test_truncate_tree_depth(self):
        tree, _nodes = get_show_tree_with_counts(self.show.id)
        truncated = truncate_tree_depth(tree, max_depth=1)
        self.assertEqual(len(truncated['children']), 1)
        self.assertEqual(truncated['children'][0]['children'], [])


class GetShowsForUserTest(TestCase):
    def setUp(self):
        self.org = make_org('org-a')
        self.other_org = make_org('org-b')
        self.user = make_user(self.org)
        self.show_mine = Show.objects.create(organization=self.org, name='My Show')
        ShowMembership.objects.create(show=self.show_mine, user=self.user, role=ShowRole.OWNER)
        self.show_theirs = Show.objects.create(organization=self.other_org, name='Their Show')

    def test_returns_only_shows_user_is_a_member_of(self):
        shows = list(get_shows_for_user(self.user))
        self.assertIn(self.show_mine, shows)
        self.assertNotIn(self.show_theirs, shows)

    def test_org_mate_without_membership_cannot_see_show(self):
        other_member = make_user(self.org, username='other_member', email='other@example.com')
        shows = list(get_shows_for_user(other_member))
        self.assertNotIn(self.show_mine, shows)

    def test_admin_sees_every_show_in_their_org(self):
        from apps.users.models import Role
        admin = make_user(self.org, username='admin_user', email='admin@example.com')
        admin.role = Role.ADMIN
        admin.save(update_fields=['role'])
        shows = list(get_shows_for_user(admin))
        self.assertIn(self.show_mine, shows)
        self.assertNotIn(self.show_theirs, shows)


class CreateShowServiceTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)

    def test_creates_show_for_org(self):
        show = create_show(self.user, {'name': 'New Show', 'description': 'A test show.'})
        self.assertEqual(show.name, 'New Show')
        self.assertEqual(show.organization, self.org)

    def test_creates_nested_show(self):
        parent = create_show(self.user, {'name': 'Parent'})
        child = create_show(self.user, {'name': 'Child', 'parent': parent})
        self.assertEqual(child.parent, parent)


class EffectiveRoleInheritanceTest(TestCase):
    """Per-node membership with inheritance + override: a node with no rows of its
    own inherits from the nearest ancestor that has any; a node with its own rows
    fully replaces (does not merge with) ancestor rows."""

    def setUp(self):
        self.org = make_org()
        self.owner = make_user(self.org, username='owner', email='owner@example.com')
        self.editor = make_user(self.org, username='editor', email='editor@example.com')
        self.outsider = make_user(self.org, username='outsider', email='outsider@example.com')
        self.root = Show.objects.create(organization=self.org, name='Root')
        self.season = Show.objects.create(organization=self.org, parent=self.root, name='Season 1')
        self.subseason = Show.objects.create(organization=self.org, parent=self.season, name='Sub 1.1')
        ShowMembership.objects.create(show=self.root, user=self.owner, role=ShowRole.OWNER)
        ShowMembership.objects.create(show=self.root, user=self.editor, role=ShowRole.EDITOR)

    def test_child_with_no_rows_inherits_from_ancestor(self):
        self.assertEqual(get_effective_role(self.editor, self.season), ShowRole.EDITOR)
        self.assertEqual(get_effective_role(self.editor, self.subseason), ShowRole.EDITOR)

    def test_outsider_has_no_access_anywhere(self):
        self.assertIsNone(get_effective_role(self.outsider, self.root))
        self.assertIsNone(get_effective_role(self.outsider, self.season))

    def test_explicit_rows_on_child_replace_not_merge(self):
        # Season gets its own membership list that excludes the editor entirely.
        ShowMembership.objects.create(show=self.season, user=self.owner, role=ShowRole.VIEWER)
        self.assertIsNone(get_effective_role(self.editor, self.season))
        self.assertIsNone(get_effective_role(self.editor, self.subseason))
        # The owner's role on the season is whatever the season's own row says (viewer),
        # not whatever they had on the root (owner) — override, not merge.
        self.assertEqual(get_effective_role(self.owner, self.season), ShowRole.VIEWER)

    def test_visible_show_ids_matches_single_object_resolution(self):
        visible = get_visible_show_ids_for_user(self.editor)
        self.assertIn(self.root.id, visible)
        self.assertIn(self.season.id, visible)
        self.assertIn(self.subseason.id, visible)
        ShowMembership.objects.create(show=self.season, user=self.owner, role=ShowRole.VIEWER)
        visible = get_visible_show_ids_for_user(self.editor)
        self.assertIn(self.root.id, visible)
        self.assertNotIn(self.season.id, visible)
        self.assertNotIn(self.subseason.id, visible)


class ShowMembersAPITest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.owner = make_user(self.org, username='owner', email='owner@example.com')
        self.other_org_user = make_user(make_org('other-org'), username='stranger', email='stranger@example.com')
        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

    def test_creator_becomes_owner_automatically(self):
        resp = self.client.post('/api/shows/', {'name': 'New Show'})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['data']['my_role'], 'owner')
        show_id = resp.data['data']['id']
        self.assertTrue(
            ShowMembership.objects.filter(show_id=show_id, user=self.owner, role=ShowRole.OWNER).exists()
        )

    def test_non_member_gets_404_not_403(self):
        show = Show.objects.create(organization=self.org, name='Private Show')
        outsider = make_user(self.org, username='outsider2', email='outsider2@example.com')
        client = APIClient()
        client.force_authenticate(user=outsider)
        resp = client.get(f'/api/shows/{show.id}/')
        self.assertEqual(resp.status_code, 404)

    def test_owner_can_add_member_with_editor_role(self):
        show = Show.objects.create(organization=self.org, name='Show')
        ShowMembership.objects.create(show=show, user=self.owner, role=ShowRole.OWNER)
        new_member = make_user(self.org, username='newmember', email='newmember@example.com')
        resp = self.client.post(
            f'/api/shows/{show.id}/members/', {'user': str(new_member.id), 'role': 'editor'},
        )
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(
            ShowMembership.objects.filter(show=show, user=new_member, role=ShowRole.EDITOR).exists()
        )

    def test_cannot_add_member_from_another_org(self):
        show = Show.objects.create(organization=self.org, name='Show')
        ShowMembership.objects.create(show=show, user=self.owner, role=ShowRole.OWNER)
        resp = self.client.post(
            f'/api/shows/{show.id}/members/',
            {'user': str(self.other_org_user.id), 'role': 'editor'},
        )
        self.assertEqual(resp.status_code, 400)

    def test_editor_cannot_add_members(self):
        show = Show.objects.create(organization=self.org, name='Show')
        ShowMembership.objects.create(show=show, user=self.owner, role=ShowRole.OWNER)
        editor = make_user(self.org, username='editor2', email='editor2@example.com')
        ShowMembership.objects.create(show=show, user=editor, role=ShowRole.EDITOR)
        client = APIClient()
        client.force_authenticate(user=editor)
        new_member = make_user(self.org, username='newmember2', email='newmember2@example.com')
        resp = client.post(
            f'/api/shows/{show.id}/members/', {'user': str(new_member.id), 'role': 'viewer'},
        )
        self.assertEqual(resp.status_code, 403)

    def test_owner_can_remove_member(self):
        show = Show.objects.create(organization=self.org, name='Show')
        ShowMembership.objects.create(show=show, user=self.owner, role=ShowRole.OWNER)
        member = make_user(self.org, username='removable', email='removable@example.com')
        membership = ShowMembership.objects.create(show=show, user=member, role=ShowRole.VIEWER)
        resp = self.client.delete(f'/api/shows/{show.id}/members/{membership.id}/')
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(ShowMembership.objects.filter(pk=membership.id).exists())

    def test_sub_show_with_no_explicit_members_lists_inherited_ones(self):
        root = Show.objects.create(organization=self.org, name='Root')
        ShowMembership.objects.create(show=root, user=self.owner, role=ShowRole.OWNER)
        child = Show.objects.create(organization=self.org, parent=root, name='Child')
        resp = self.client.get(f'/api/shows/{child.id}/members/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['data']), 1)
        row = resp.data['data'][0]
        self.assertTrue(row['inherited'])
        self.assertEqual(row['inherited_from_show_name'], 'Root')

    def test_sub_show_with_own_members_reports_not_inherited(self):
        root = Show.objects.create(organization=self.org, name='Root2')
        ShowMembership.objects.create(show=root, user=self.owner, role=ShowRole.OWNER)
        child = Show.objects.create(organization=self.org, parent=root, name='Child2')
        ShowMembership.objects.create(show=child, user=self.owner, role=ShowRole.VIEWER)
        resp = self.client.get(f'/api/shows/{child.id}/members/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['data']), 1)
        self.assertFalse(resp.data['data'][0]['inherited'])

    def test_admin_lists_show_with_no_explicit_membership(self):
        admin = make_user(self.org, username='admin3', email='admin3@example.com')
        admin.role = Role.ADMIN
        admin.save(update_fields=['role'])
        show = Show.objects.create(organization=self.org, name='No Members Yet')
        client = APIClient()
        client.force_authenticate(user=admin)
        resp = client.get(f'/api/shows/{show.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['data']['my_role'], 'owner')


class ShowEpisodesPaginationAPITest(TestCase):
    """GET /api/shows/{id}/episodes/ — pagination is opt-in (page/page_size
    present) so existing full-list callers (chat episode selectors) are
    unaffected by default."""

    def setUp(self):
        from apps.episodes.models import Episode, EpisodeShow

        self.org = make_org()
        self.user = make_user(self.org)
        self.show = Show.objects.create(organization=self.org, name='Big Show')
        ShowMembership.objects.create(show=self.show, user=self.user, role=ShowRole.OWNER)
        for i in range(5):
            ep = Episode.objects.create(primary_show=self.show, episode_number=str(i + 1), title=f'Ep {i + 1}')
            EpisodeShow.objects.create(episode=ep, show=self.show)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_no_page_param_returns_full_unpaginated_list(self):
        resp = self.client.get(f'/api/shows/{self.show.id}/episodes/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['data']), 5)
        self.assertNotIn('pagination', resp.data)

    def test_page_param_returns_paginated_response(self):
        resp = self.client.get(f'/api/shows/{self.show.id}/episodes/', {'page': 1, 'page_size': 2})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['data']), 2)
        self.assertEqual(resp.data['pagination']['count'], 5)
        self.assertIsNotNone(resp.data['pagination']['next'])

    def test_page_size_param_alone_also_triggers_pagination(self):
        resp = self.client.get(f'/api/shows/{self.show.id}/episodes/', {'page_size': 3})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['data']), 3)
        self.assertIn('pagination', resp.data)

    def test_include_descendants_full_list_unaffected_by_default(self):
        resp = self.client.get(
            f'/api/shows/{self.show.id}/episodes/', {'include_descendants': 'true'},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['data']), 5)
        self.assertNotIn('pagination', resp.data)
