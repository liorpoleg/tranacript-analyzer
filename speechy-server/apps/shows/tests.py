from django.db import IntegrityError
from django.test import TestCase

from apps.users.models import Organization, User
from apps.shows.models import Show, Season
from apps.shows.services import get_shows_for_user, create_show, create_season


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

    def test_episode_count_starts_zero(self):
        self.assertEqual(self.show.episode_count, 0)

    def test_season_count_starts_zero(self):
        self.assertEqual(self.show.season_count, 0)

    def test_uuid_pk(self):
        self.assertEqual(len(str(self.show.id)), 36)

    def test_is_active_default(self):
        self.assertTrue(self.show.is_active)


class SeasonModelTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.show = Show.objects.create(organization=self.org, name='Test Show')
        self.season = Season.objects.create(show=self.show, number=1, title='Season 1')

    def test_str_includes_show_name_and_number(self):
        s = str(self.season)
        self.assertIn('Test Show', s)
        self.assertIn('1', s)

    def test_unique_together_show_number(self):
        with self.assertRaises(IntegrityError):
            Season.objects.create(show=self.show, number=1)

    def test_different_shows_can_share_season_number(self):
        other_show = Show.objects.create(organization=self.org, name='Other Show')
        s2 = Season.objects.create(show=other_show, number=1)
        self.assertIsNotNone(s2.pk)


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


class CreateSeasonServiceTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.show = Show.objects.create(organization=self.org, name='Test Show')

    def test_creates_season(self):
        season = create_season(self.show, number=2, title='Season 2')
        self.assertEqual(season.number, 2)
        self.assertEqual(season.show, self.show)
