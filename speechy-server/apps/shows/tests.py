from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.users.models import Organization, User
from apps.shows.models import Show
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
        self.show_theirs = Show.objects.create(organization=self.other_org, name='Their Show')

    def test_returns_only_own_org_shows(self):
        shows = list(get_shows_for_user(self.user))
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
