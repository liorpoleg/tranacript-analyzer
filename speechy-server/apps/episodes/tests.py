from django.db import IntegrityError
from django.test import TestCase

from apps.users.models import Organization, User
from apps.shows.models import Show, Season
from apps.episodes.models import (
    Episode, EpisodeSeason, EpisodeTranslation, EpisodeSummary, ContextualSummary,
)
from apps.episodes.services import add_episode_to_season, remove_episode_from_season


def make_hierarchy():
    org = Organization.objects.create(name='Test Org', slug='test-org')
    user = User.objects.create_user(
        username='testuser', email='test@example.com', password='testpass123', organization=org
    )
    show = Show.objects.create(organization=org, name='Test Show')
    season = Season.objects.create(show=show, number=1)
    episode = Episode.objects.create(
        primary_show=show, episode_number='S01E01', title='Pilot'
    )
    return org, user, show, season, episode


class EpisodeModelTest(TestCase):
    def setUp(self):
        _, _, _, _, self.episode = make_hierarchy()

    def test_str_includes_title_and_number(self):
        s = str(self.episode)
        self.assertIn('Pilot', s)
        self.assertIn('S01E01', s)

    def test_featured_characters_defaults_to_empty_list(self):
        self.assertEqual(self.episode.featured_characters, [])

    def test_uuid_pk(self):
        self.assertEqual(len(str(self.episode.id)), 36)


class EpisodeTranslationModelTest(TestCase):
    def setUp(self):
        _, _, _, _, self.episode = make_hierarchy()

    def test_create_translation(self):
        t = EpisodeTranslation.objects.create(
            episode=self.episode, language='en', translated_rows=[]
        )
        self.assertEqual(t.language, 'en')

    def test_unique_together_episode_language(self):
        EpisodeTranslation.objects.create(episode=self.episode, language='en', translated_rows=[])
        with self.assertRaises(IntegrityError):
            EpisodeTranslation.objects.create(episode=self.episode, language='en', translated_rows=[])

    def test_both_languages_allowed(self):
        EpisodeTranslation.objects.create(episode=self.episode, language='en', translated_rows=[])
        EpisodeTranslation.objects.create(episode=self.episode, language='he', translated_rows=[])
        self.assertEqual(
            EpisodeTranslation.objects.filter(episode=self.episode).count(), 2
        )

    def test_str_includes_language(self):
        t = EpisodeTranslation.objects.create(episode=self.episode, language='he', translated_rows=[])
        self.assertIn('he', str(t))


class EpisodeSummaryModelTest(TestCase):
    def setUp(self):
        _, _, _, _, self.episode = make_hierarchy()

    def test_create_summary(self):
        s = EpisodeSummary.objects.create(
            episode=self.episode,
            summary_text='Great pilot.',
            key_topics=['drama', 'comedy'],
        )
        self.assertEqual(s.summary_text, 'Great pilot.')
        self.assertEqual(s.key_topics, ['drama', 'comedy'])

    def test_str_includes_episode_title(self):
        s = EpisodeSummary.objects.create(
            episode=self.episode, summary_text='x', key_topics=[]
        )
        self.assertIn('Pilot', str(s))


class ContextualSummaryModelTest(TestCase):
    def setUp(self):
        _, self.user, _, _, self.episode = make_hierarchy()

    def test_create_contextual_summary(self):
        cs = ContextualSummary.objects.create(
            episode=self.episode,
            user=self.user,
            questions_snapshot=['What is the theme?'],
            summary_text='A thematic summary.',
        )
        self.assertEqual(cs.questions_snapshot, ['What is the theme?'])
        self.assertEqual(cs.user, self.user)


class AddRemoveEpisodeSeasonTest(TestCase):
    def setUp(self):
        _, _, _, self.season, self.episode = make_hierarchy()

    def test_add_episode_to_season(self):
        add_episode_to_season(self.episode, str(self.season.id), order=1)
        self.assertTrue(
            EpisodeSeason.objects.filter(episode=self.episode, season=self.season).exists()
        )

    def test_add_is_idempotent(self):
        add_episode_to_season(self.episode, str(self.season.id))
        add_episode_to_season(self.episode, str(self.season.id))
        self.assertEqual(
            EpisodeSeason.objects.filter(episode=self.episode, season=self.season).count(), 1
        )

    def test_remove_episode_from_season(self):
        add_episode_to_season(self.episode, str(self.season.id))
        remove_episode_from_season(self.episode, str(self.season.id))
        self.assertFalse(
            EpisodeSeason.objects.filter(episode=self.episode, season=self.season).exists()
        )
