import io
import openpyxl
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import Organization, User
from apps.shows.models import Show, ShowMembership, ShowRole
from apps.episodes.models import Character, Episode, EpisodeShow, Transcript, TranscriptLanguage
from apps.episodes.services import parse_episode_excel, parse_show_excel


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_org(slug='org1'):
    return Organization.objects.create(name='Test Org', slug=slug)


def make_user(org, username='tester'):
    return User.objects.create_user(
        username=username, email=f'{username}@test.com',
        password='pass123', organization=org,
    )


def make_show(org, name='Test Show'):
    return Show.objects.create(name=name, organization=org)


def make_membership(show, user, role=ShowRole.OWNER):
    return ShowMembership.objects.create(show=show, user=user, role=role)


def make_season(show, name='Season 1'):
    return Show.objects.create(organization=show.organization, parent=show, name=name)


def make_episode(show, number='1'):
    return Episode.objects.create(
        primary_show=show, episode_number=number, title=f'Episode {number}',
    )


def _excel_bytes(headers, rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


# ── Model tests ───────────────────────────────────────────────────────────────

class CharacterModelTest(TestCase):
    def test_str_with_actor(self):
        char = Character.objects.create(character_ref='c1', name='Cohen', actor='Lior')
        self.assertEqual(str(char), 'Cohen (Lior)')

    def test_str_no_actor(self):
        char = Character.objects.create(character_ref='c2', name='Haim', actor='')
        self.assertEqual(str(char), 'Haim')

    def test_same_ref_different_actors_allowed(self):
        Character.objects.create(character_ref='c1', name='Cohen', actor='ActorA')
        Character.objects.create(character_ref='c1', name='Cohen', actor='ActorB')
        self.assertEqual(Character.objects.filter(character_ref='c1').count(), 2)

    def test_duplicate_ref_actor_raises(self):
        from django.db import IntegrityError
        Character.objects.create(character_ref='c1', name='Cohen', actor='ActorA')
        with self.assertRaises(IntegrityError):
            Character.objects.create(character_ref='c1', name='Cohen', actor='ActorA')


class TranscriptModelTest(TestCase):
    def setUp(self):
        org = make_org()
        show = make_show(org)
        self.episode = make_episode(show)

    def test_create_and_str(self):
        t = Transcript.objects.create(
            episode=self.episode, language=TranscriptLanguage.ORIGIN,
            rows=[{'character_ref': 'c1', 'character_name': 'Cohen', 'text': 'Hello'}],
        )
        self.assertEqual(t.rows[0]['text'], 'Hello')
        self.assertIn('origin', str(t))

    def test_unique_episode_language(self):
        from django.db import IntegrityError
        Transcript.objects.create(episode=self.episode, language=TranscriptLanguage.HEBREW, rows=[])
        with self.assertRaises(IntegrityError):
            Transcript.objects.create(episode=self.episode, language=TranscriptLanguage.HEBREW, rows=[])

    def test_all_three_languages(self):
        for lang in TranscriptLanguage.values:
            Transcript.objects.create(episode=self.episode, language=lang, rows=[])
        self.assertEqual(self.episode.transcripts.count(), 3)


class EpisodeShowCrossListingTest(TestCase):
    """Crossover episodes: an episode can be cross-listed into more than one node."""

    def setUp(self):
        self.org = make_org()
        self.show = make_show(self.org)
        self.season_a = make_season(self.show, 'Season A')
        self.season_b = make_season(self.show, 'Season B')
        self.episode = make_episode(self.show)

    def test_episode_can_belong_to_multiple_shows(self):
        EpisodeShow.objects.create(episode=self.episode, show=self.season_a)
        EpisodeShow.objects.create(episode=self.episode, show=self.season_b)
        self.assertEqual(self.episode.shows.count(), 2)

    def test_reverse_accessor_cross_listed_episodes(self):
        EpisodeShow.objects.create(episode=self.episode, show=self.season_a)
        self.assertIn(self.episode, self.season_a.cross_listed_episodes.all())


# ── Service tests ─────────────────────────────────────────────────────────────

class ParseEpisodeExcelTest(TestCase):
    def setUp(self):
        org = make_org()
        show = make_show(org)
        self.episode = make_episode(show)

    def _file(self):
        return _excel_bytes(
            ['scene_id', 'timecode', 'character', 'text', 'notes'],
            [
                ('s01', '00:00', 'COHEN', 'Hello there', None),
                ('s02', '00:05', 'AVRAHAM', 'Good morning', None),
            ],
        )

    def test_creates_origin_transcript(self):
        parse_episode_excel(self.episode, self._file())
        t = Transcript.objects.get(episode=self.episode, language=TranscriptLanguage.ORIGIN)
        self.assertEqual(len(t.rows), 2)
        self.assertEqual(t.rows[0]['text'], 'Hello there')

    def test_creates_characters(self):
        parse_episode_excel(self.episode, self._file())
        names = set(self.episode.characters.values_list('name', flat=True))
        self.assertIn('COHEN', names)
        self.assertIn('AVRAHAM', names)

    def test_upsert_on_reupload(self):
        parse_episode_excel(self.episode, self._file())
        parse_episode_excel(self.episode, self._file())
        self.assertEqual(
            Transcript.objects.filter(episode=self.episode, language='origin').count(), 1
        )


class ParseShowExcelTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.show = make_show(self.org)
        self.season = make_season(self.show)

    def _file(self):
        return _excel_bytes(
            ['episode_id', 'character_a_id', 'character_a_name', 'character_a_actor',
             'character_b_id', 'character_b_name', 'character_b_actor',
             'air date', 'length (in minutes)', 'text'],
            [
                ('ep01', 'c1', 'Moshe', 'Actor A', 'c2', 'Haim', 'Actor B',
                 'January 7, 2024', 35, 'Moshe: "Hello"\nHaim: "Hi"'),
                ('ep02', 'c3', 'Hila', 'Actor C', 'c2', 'Haim', 'Actor B',
                 'January 14, 2024', 42, 'Hila: "Birthday"\nHaim: "Thanks"'),
            ],
        )

    def test_creates_episodes(self):
        eps = parse_show_excel(self._file(), self.season, self.show)
        self.assertEqual(len(eps), 2)
        self.assertTrue(Episode.objects.filter(episode_number='ep01').exists())

    def test_primary_show_is_root_not_the_uploaded_node(self):
        eps = parse_show_excel(self._file(), self.season, self.show)
        for ep in eps:
            self.assertEqual(ep.primary_show_id, self.show.id)

    def test_links_to_uploaded_node(self):
        parse_show_excel(self._file(), self.season, self.show)
        self.assertEqual(EpisodeShow.objects.filter(show=self.season).count(), 2)

    def test_creates_origin_transcripts(self):
        eps = parse_show_excel(self._file(), self.season, self.show)
        for ep in eps:
            self.assertTrue(
                Transcript.objects.filter(episode=ep, language='origin').exists()
            )

    def test_dialogue_rows_parsed(self):
        eps = parse_show_excel(self._file(), self.season, self.show)
        t = Transcript.objects.get(episode=eps[0], language='origin')
        texts = [r['text'] for r in t.rows]
        self.assertIn('Hello', texts)
        self.assertIn('Hi', texts)

    def test_idempotent(self):
        parse_show_excel(self._file(), self.season, self.show)
        parse_show_excel(self._file(), self.season, self.show)
        self.assertEqual(Episode.objects.filter(primary_show=self.show).count(), 2)

    def test_upload_to_nested_subseason_still_roots_to_top_level(self):
        subseason = make_season(self.season, 'Sub-season')
        eps = parse_show_excel(self._file(), subseason, self.show)
        for ep in eps:
            self.assertEqual(ep.primary_show_id, self.show.id)
        self.assertEqual(EpisodeShow.objects.filter(show=subseason).count(), 2)


# ── API endpoint tests ────────────────────────────────────────────────────────

class EpisodeUploadAPITest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.show = make_show(self.org)
        make_membership(self.show, self.user, ShowRole.EDITOR)
        self.episode = make_episode(self.show)

    def _file(self):
        buf = _excel_bytes(
            ['scene_id', 'timecode', 'character', 'text', 'notes'],
            [('s1', '00:00', 'COHEN', 'Hello', None)],
        )
        buf.name = 'transcript.xlsx'
        return buf

    def test_upload_creates_transcript(self):
        resp = self.client.post(
            f'/api/episodes/{self.episode.id}/upload/',
            {'file': self._file()},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn('transcript_id', resp.data['data'])
        self.assertTrue(Transcript.objects.filter(episode=self.episode, language='origin').exists())

    def test_upload_no_file_returns_400(self):
        resp = self.client.post(f'/api/episodes/{self.episode.id}/upload/')
        self.assertEqual(resp.status_code, 400)

    def test_episode_has_origin_transcript_flag(self):
        self._file_content = self._file()
        self.client.post(
            f'/api/episodes/{self.episode.id}/upload/',
            {'file': self._file()},
            format='multipart',
        )
        resp = self.client.get(f'/api/episodes/{self.episode.id}/')
        self.assertTrue(resp.data['data']['has_origin_transcript'])


class ShowUploadAPITest(TestCase):
    """Was SeasonUploadAPITest — /api/seasons/{id}/upload/ is now /api/shows/{id}/upload/,
    and it works on any node (root show or nested 'season'), not just seasons."""

    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.show = make_show(self.org)
        make_membership(self.show, self.user, ShowRole.EDITOR)
        self.season = make_season(self.show)

    def _file(self):
        buf = _excel_bytes(
            ['episode_id', 'character_a_id', 'character_a_name', 'character_a_actor',
             'character_b_id', 'character_b_name', 'character_b_actor',
             'air date', 'length (in minutes)', 'text'],
            [('ep01', 'c1', 'Moshe', '', 'c2', 'Haim', '',
              'January 7, 2024', 35, 'Moshe: "Hello"\nHaim: "Hi"')],
        )
        buf.name = 'season.xlsx'
        return buf

    def test_season_upload_creates_episodes(self):
        resp = self.client.post(
            f'/api/shows/{self.season.id}/upload/',
            {'file': self._file()},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['data']['episodes_created'], 1)

    def test_season_upload_no_file_returns_400(self):
        resp = self.client.post(f'/api/shows/{self.season.id}/upload/')
        self.assertEqual(resp.status_code, 400)

    def test_root_show_upload_also_works(self):
        resp = self.client.post(
            f'/api/shows/{self.show.id}/upload/',
            {'file': self._file()},
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201)


# ── Task tests (mocked LLM) ───────────────────────────────────────────────────

class TranslateTaskTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)
        self.show = make_show(self.org)
        self.episode = make_episode(self.show)
        Transcript.objects.create(
            episode=self.episode,
            language=TranscriptLanguage.ORIGIN,
            rows=[
                {'character_ref': 'c1', 'character_name': 'Cohen', 'text': 'Hello'},
                {'character_ref': 'c2', 'character_name': 'Haim', 'text': 'Goodbye'},
            ],
        )

    @patch('apps.processing.tasks.LLMClient')
    @patch('apps.processing.tasks.load_prompt', return_value='Translate {TRANSCRIPT} to {TARGET_LANGUAGE}')
    def test_translate_creates_he_and_en_transcripts(self, _prompt, MockLLM):
        MockLLM.return_value.complete.return_value = '[0] שלום\n[1] להתראות'

        from apps.processing.models import ProcessingJob, JobType, JobStatus
        job = ProcessingJob.objects.create(
            episode=self.episode, job_type=JobType.TRANSLATE,
            status=JobStatus.PENDING, triggered_by=self.user,
        )
        from apps.processing.tasks import translate_task
        translate_task(str(job.id))

        job.refresh_from_db()
        self.assertEqual(job.status, JobStatus.COMPLETED)
        self.assertTrue(Transcript.objects.filter(episode=self.episode, language='hebrew').exists())
        self.assertTrue(Transcript.objects.filter(episode=self.episode, language='english').exists())

    @patch('apps.processing.tasks.LLMClient')
    @patch('apps.processing.tasks.load_prompt', return_value='Translate {TRANSCRIPT} to {TARGET_LANGUAGE}')
    def test_translate_fails_without_origin(self, _prompt, MockLLM):
        Transcript.objects.filter(episode=self.episode).delete()
        from apps.processing.models import ProcessingJob, JobType, JobStatus
        job = ProcessingJob.objects.create(
            episode=self.episode, job_type=JobType.TRANSLATE,
            status=JobStatus.PENDING, triggered_by=self.user,
        )
        from apps.processing.tasks import translate_task
        translate_task(str(job.id))
        job.refresh_from_db()
        self.assertEqual(job.status, JobStatus.FAILED)


class SummarizeTaskTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)
        self.show = make_show(self.org)
        self.episode = make_episode(self.show)
        Transcript.objects.create(
            episode=self.episode,
            language=TranscriptLanguage.ENGLISH,
            rows=[{'character_ref': 'c1', 'character_name': 'Cohen', 'text': 'Hello world'}],
        )

    @patch('apps.processing.tasks.LLMClient')
    @patch('apps.processing.tasks.load_prompt', return_value='Summarize {TRANSCRIPT}')
    def test_creates_episode_summary(self, _prompt, MockLLM):
        MockLLM.return_value.complete.return_value = 'Summary text.\n\nKey Topics:\n- topic1\n- topic2'

        from apps.processing.models import ProcessingJob, JobType, JobStatus
        job = ProcessingJob.objects.create(
            episode=self.episode, job_type=JobType.SUMMARIZE,
            status=JobStatus.PENDING, triggered_by=self.user,
        )
        from apps.processing.tasks import summarize_task
        summarize_task(str(job.id))

        job.refresh_from_db()
        self.assertEqual(job.status, JobStatus.COMPLETED)
        from apps.episodes.models import EpisodeSummary
        summary = EpisodeSummary.objects.get(episode=self.episode)
        self.assertIn('Summary text', summary.summary_text)
        self.assertIn('topic1', summary.key_topics)
