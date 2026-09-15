import tempfile
from django.test import TestCase

from apps.users.models import Organization, User
from apps.shows.models import Show
from apps.episodes.models import Episode, EpisodeShow
from apps.knowledge.models import KnowledgeFile, Question
from apps.knowledge.services import (
    extract_text_from_file,
    get_knowledge_for_episode,
    get_questions_for_episode,
)


def make_hierarchy():
    org = Organization.objects.create(name='Test Org', slug='test-org')
    show = Show.objects.create(organization=org, name='My Show')
    season = Show.objects.create(organization=org, parent=show, name='Season 1')
    episode = Episode.objects.create(primary_show=show, episode_number='S01E01', title='Pilot')
    EpisodeShow.objects.create(episode=episode, show=season)
    return org, show, season, episode


class KnowledgeFileModelTest(TestCase):
    def setUp(self):
        org = Organization.objects.create(name='Test Org', slug='test-org')
        self.show = Show.objects.create(organization=org, name='Test Show')

    def test_show_required(self):
        with self.assertRaises(Exception):
            KnowledgeFile.objects.create(
                original_filename='a.txt', file_path='a.txt', content_text='',
            )

    def test_valid_with_show(self):
        kf = KnowledgeFile.objects.create(
            show=self.show, original_filename='a.txt', file_path='a.txt', content_text=''
        )
        self.assertEqual(kf.show, self.show)

    def test_str_returns_filename(self):
        kf = KnowledgeFile.objects.create(
            show=self.show, original_filename='notes.txt', file_path='x', content_text=''
        )
        self.assertEqual(str(kf), 'notes.txt')

    def test_valid_with_nested_show_as_season(self):
        season = Show.objects.create(organization=self.show.organization, parent=self.show, name='Season 1')
        kf = KnowledgeFile.objects.create(
            show=season, original_filename='a.txt', file_path='a.txt', content_text=''
        )
        self.assertEqual(kf.show, season)


class QuestionModelTest(TestCase):
    def setUp(self):
        org = Organization.objects.create(name='Test Org', slug='test-org')
        self.show = Show.objects.create(organization=org, name='Test Show')

    def test_show_required(self):
        with self.assertRaises(Exception):
            Question.objects.create(text='Why?')

    def test_is_active_default(self):
        q = Question.objects.create(show=self.show, text='Who is the main character?')
        self.assertTrue(q.is_active)

    def test_str_returns_text_truncated(self):
        q = Question.objects.create(show=self.show, text='What is the central theme of this episode?')
        self.assertIn('What is', str(q))


class ExtractTextFromFileTest(TestCase):
    def test_extracts_text_from_txt_file(self):
        with tempfile.NamedTemporaryFile(suffix='.txt', mode='w', delete=False, encoding='utf-8') as f:
            f.write('Hello, world!')
            path = f.name
        result = extract_text_from_file(path)
        self.assertEqual(result, 'Hello, world!')

    def test_extracts_text_from_md_file(self):
        with tempfile.NamedTemporaryFile(suffix='.md', mode='w', delete=False, encoding='utf-8') as f:
            f.write('# Title\nContent here.')
            path = f.name
        result = extract_text_from_file(path)
        self.assertIn('Title', result)

    def test_returns_empty_for_unknown_extension(self):
        with tempfile.NamedTemporaryFile(suffix='.xyz', mode='w', delete=False, encoding='utf-8') as f:
            f.write('data')
            path = f.name
        result = extract_text_from_file(path)
        self.assertEqual(result, '')


class GetKnowledgeForEpisodeTest(TestCase):
    def setUp(self):
        _, self.show, self.season, self.episode = make_hierarchy()
        KnowledgeFile.objects.create(
            show=self.show, original_filename='show.txt', file_path='show.txt',
            content_text='show-level background'
        )
        KnowledgeFile.objects.create(
            show=self.season, original_filename='season.txt', file_path='season.txt',
            content_text='season-level background'
        )

    def test_returns_both_show_and_season_knowledge(self):
        texts = get_knowledge_for_episode(self.episode)
        combined = ' '.join(texts)
        self.assertIn('show-level background', combined)
        self.assertIn('season-level background', combined)

    def test_show_knowledge_prefixed_with_show_name(self):
        texts = get_knowledge_for_episode(self.episode)
        self.assertTrue(any('My Show' in t for t in texts))

    def test_episode_without_cross_listing_returns_only_primary_show_knowledge(self):
        org = Organization.objects.create(name='Org2', slug='org2')
        show2 = Show.objects.create(organization=org, name='Show2')
        ep2 = Episode.objects.create(primary_show=show2, episode_number='1', title='Ep')
        KnowledgeFile.objects.create(
            show=show2, original_filename='s.txt', file_path='s.txt',
            content_text='only show knowledge'
        )
        texts = get_knowledge_for_episode(ep2)
        self.assertEqual(len(texts), 1)
        self.assertIn('only show knowledge', texts[0])


class GetQuestionsForEpisodeTest(TestCase):
    def setUp(self):
        _, self.show, self.season, self.episode = make_hierarchy()
        Question.objects.create(show=self.show, text='What is the theme?', is_active=True)
        Question.objects.create(show=self.season, text='Who appears in this season?', is_active=True)
        Question.objects.create(show=self.show, text='Inactive question', is_active=False)

    def test_returns_active_questions(self):
        questions = get_questions_for_episode(self.episode)
        self.assertIn('What is the theme?', questions)
        self.assertIn('Who appears in this season?', questions)

    def test_excludes_inactive_questions(self):
        questions = get_questions_for_episode(self.episode)
        self.assertNotIn('Inactive question', questions)

    def test_returns_empty_when_no_questions(self):
        Question.objects.all().delete()
        questions = get_questions_for_episode(self.episode)
        self.assertEqual(questions, [])
