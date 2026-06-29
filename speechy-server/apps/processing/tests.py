import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings

from apps.users.models import Organization, User
from apps.shows.models import Show, Season
from apps.knowledge.models import Question
from apps.episodes.models import Episode, EpisodeSeason, EpisodeTranslation, EpisodeSummary, ContextualSummary
from apps.processing.models import ProcessingJob, JobType, JobStatus
from apps.processing.services import (
    load_prompt, inject_context, mark_running, mark_completed, mark_failed,
)
from apps.processing.llm_client import LLMClient, LLMError
from apps.processing.tasks import (
    _parse_translated_response,
    _parse_summary_response,
    translate_task,
    summarize_task,
    contextual_summary_task,
)


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
    EpisodeSeason.objects.create(episode=episode, season=season)
    return org, user, show, season, episode


def make_job(episode, user, job_type=JobType.TRANSLATE):
    return ProcessingJob.objects.create(
        episode=episode, job_type=job_type, triggered_by=user
    )


# ---------------------------------------------------------------------------
# LLMClient
# ---------------------------------------------------------------------------

class LLMClientTest(TestCase):
    def test_raises_llm_error_if_endpoint_empty(self):
        with override_settings(LLM_ENDPOINT='', LLM_MODEL='gpt-4', LLM_TIMEOUT=10):
            client = LLMClient()
            with self.assertRaises(LLMError):
                client.complete('hello')

    def test_returns_content_on_success(self):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            'choices': [{'message': {'content': 'translated text'}}]
        }
        mock_resp.raise_for_status = MagicMock()

        with override_settings(LLM_ENDPOINT='http://test/', LLM_MODEL='gpt-4', LLM_TIMEOUT=10):
            client = LLMClient()
            with patch.object(client._session, 'post', return_value=mock_resp):
                result = client.complete('test prompt')

        self.assertEqual(result, 'translated text')

    def test_raises_llm_error_on_bad_response_shape(self):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {'unexpected': 'shape'}
        mock_resp.raise_for_status = MagicMock()

        with override_settings(LLM_ENDPOINT='http://test/', LLM_MODEL='gpt-4', LLM_TIMEOUT=10):
            client = LLMClient()
            with patch.object(client._session, 'post', return_value=mock_resp):
                with self.assertRaises(LLMError):
                    client.complete('test prompt')

    def test_raises_llm_error_on_network_failure(self):
        import requests
        mock_resp = MagicMock()
        mock_resp.raise_for_status.side_effect = requests.RequestException('connection refused')

        with override_settings(LLM_ENDPOINT='http://test/', LLM_MODEL='gpt-4', LLM_TIMEOUT=10):
            client = LLMClient()
            with patch.object(client._session, 'post', side_effect=requests.RequestException('timeout')):
                with self.assertRaises(LLMError):
                    client.complete('test prompt')


# ---------------------------------------------------------------------------
# load_prompt / inject_context
# ---------------------------------------------------------------------------

class LoadPromptTest(TestCase):
    def test_loads_existing_prompt_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (Path(tmpdir) / 'translate.md').write_text('Translate: {TRANSCRIPT}', encoding='utf-8')
            with override_settings(PROMPTS_DIR=tmpdir):
                result = load_prompt('translate')
        self.assertEqual(result, 'Translate: {TRANSCRIPT}')

    def test_raises_file_not_found_for_missing_prompt(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with override_settings(PROMPTS_DIR=tmpdir):
                with self.assertRaises(FileNotFoundError):
                    load_prompt('nonexistent')


class InjectContextTest(TestCase):
    def test_replaces_single_placeholder(self):
        result = inject_context('Hello {NAME}', NAME='World')
        self.assertEqual(result, 'Hello World')

    def test_replaces_multiple_placeholders(self):
        result = inject_context('{A} plus {B}', A='foo', B='bar')
        self.assertEqual(result, 'foo plus bar')

    def test_unreferenced_placeholder_left_intact(self):
        result = inject_context('Hello {WORLD}', NAME='test')
        self.assertEqual(result, 'Hello {WORLD}')

    def test_empty_template_returns_empty(self):
        result = inject_context('', KEY='value')
        self.assertEqual(result, '')


# ---------------------------------------------------------------------------
# mark_running / mark_completed / mark_failed
# ---------------------------------------------------------------------------

class MarkJobStatusTest(TestCase):
    def setUp(self):
        _, self.user, _, _, self.episode = make_hierarchy()
        self.job = make_job(self.episode, self.user)

    def test_mark_running_sets_status_and_started_at(self):
        mark_running(self.job)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.RUNNING)
        self.assertIsNotNone(self.job.started_at)

    def test_mark_completed_sets_status_and_completed_at(self):
        mark_completed(self.job)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.COMPLETED)
        self.assertIsNotNone(self.job.completed_at)

    def test_mark_failed_sets_status_and_appends_error_log(self):
        mark_failed(self.job, 'Something went wrong')
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.FAILED)
        self.assertTrue(any('Something went wrong' in line for line in self.job.log_lines))

    def test_duration_seconds_after_complete(self):
        mark_running(self.job)
        mark_completed(self.job)
        self.job.refresh_from_db()
        self.assertIsNotNone(self.job.duration_seconds)
        self.assertGreaterEqual(self.job.duration_seconds, 0)


# ---------------------------------------------------------------------------
# _parse_translated_response
# ---------------------------------------------------------------------------

class ParseTranslatedResponseTest(TestCase):
    def test_maps_response_lines_to_rows(self):
        rows = [
            {'row_id': 1, 'original_text': 'Hello'},
            {'row_id': 2, 'original_text': 'World'},
        ]
        result = _parse_translated_response('שלום\nעולם', rows, 'he')
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]['translated_text'], 'שלום')
        self.assertEqual(result[1]['translated_text'], 'עולם')

    def test_strips_echoed_row_id_prefix(self):
        rows = [{'row_id': 5, 'original_text': 'Hello'}]
        result = _parse_translated_response('[5] שלום', rows, 'he')
        self.assertEqual(result[0]['translated_text'], 'שלום')

    def test_truncates_extra_llm_lines_to_row_count(self):
        rows = [{'row_id': 1, 'original_text': 'A'}]
        result = _parse_translated_response('line1\nline2\nline3', rows, 'en')
        self.assertEqual(len(result), 1)

    def test_result_includes_language_field(self):
        rows = [{'row_id': 1, 'original_text': 'Hi'}]
        result = _parse_translated_response('Hola', rows, 'es')
        self.assertEqual(result[0]['language'], 'es')

    def test_result_preserves_original_text(self):
        rows = [{'row_id': 1, 'original_text': 'Original'}]
        result = _parse_translated_response('Translated', rows, 'en')
        self.assertEqual(result[0]['original_text'], 'Original')


# ---------------------------------------------------------------------------
# _parse_summary_response
# ---------------------------------------------------------------------------

class ParseSummaryResponseTest(TestCase):
    def test_extracts_key_topics_after_key_topics_header(self):
        response = 'This is the summary.\n\nKey Topics:\n- Drama\n- Romance\n'
        summary, topics = _parse_summary_response(response)
        self.assertIn('Drama', topics)
        self.assertIn('Romance', topics)

    def test_summary_text_excludes_topics_block(self):
        response = 'Great episode.\n\nKey Topics:\n- Action\n'
        summary, topics = _parse_summary_response(response)
        self.assertIn('Great episode', summary)
        self.assertNotIn('Action', summary)

    def test_no_topics_section_returns_empty_list(self):
        response = 'Simple summary with no topics.'
        summary, topics = _parse_summary_response(response)
        self.assertEqual(topics, [])
        self.assertEqual(summary, 'Simple summary with no topics.')

    def test_topics_header_case_insensitive(self):
        response = 'topics:\n- X\n'
        _, topics = _parse_summary_response(response)
        self.assertIn('X', topics)


# ---------------------------------------------------------------------------
# translate_task
# ---------------------------------------------------------------------------

class TranslateTaskTest(TestCase):
    def setUp(self):
        _, self.user, _, _, self.episode = make_hierarchy()
        self.episode.raw_excel_path = 'episodes/test/transcript.xlsx'
        self.episode.save()
        self.job = make_job(self.episode, self.user, JobType.TRANSLATE)

    @patch('apps.processing.tasks.LLMClient')
    @patch('apps.processing.tasks.read_transcript_rows')
    def test_completes_and_creates_both_translations(self, mock_read, MockLLM):
        mock_read.return_value = [
            {'row_id': 1, 'original_text': 'Hello', 'metadata': {}},
            {'row_id': 2, 'original_text': 'World', 'metadata': {}},
        ]
        MockLLM.return_value.complete.return_value = 'שלום\nעולם'

        translate_task.apply(args=(str(self.job.id),))

        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.COMPLETED)
        self.assertEqual(EpisodeTranslation.objects.filter(episode=self.episode).count(), 2)

    @patch('apps.processing.tasks.LLMClient')
    @patch('apps.processing.tasks.read_transcript_rows')
    def test_fails_when_no_excel_path(self, mock_read, MockLLM):
        self.episode.raw_excel_path = ''
        self.episode.save()

        translate_task.apply(args=(str(self.job.id),))

        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.FAILED)

    @patch('apps.processing.tasks.LLMClient')
    @patch('apps.processing.tasks.read_transcript_rows')
    def test_skips_already_translated_rows(self, mock_read, MockLLM):
        mock_read.return_value = [
            {'row_id': 1, 'original_text': 'Hello', 'metadata': {}},
        ]
        EpisodeTranslation.objects.create(
            episode=self.episode, language='en',
            translated_rows=[{'row_id': 1, 'translated_text': 'Hello', 'original_text': 'Hello', 'language': 'en'}]
        )
        MockLLM.return_value.complete.return_value = ''

        translate_task.apply(args=(str(self.job.id),))

        self.job.refresh_from_db()
        # LLM called for Hebrew but not English (row already translated)
        en_trans = EpisodeTranslation.objects.get(episode=self.episode, language='en')
        self.assertEqual(len(en_trans.translated_rows), 1)


# ---------------------------------------------------------------------------
# summarize_task
# ---------------------------------------------------------------------------

class SummarizeTaskTest(TestCase):
    def setUp(self):
        _, self.user, _, _, self.episode = make_hierarchy()
        EpisodeTranslation.objects.create(
            episode=self.episode, language='en',
            translated_rows=[
                {'row_id': 1, 'translated_text': 'It was a dark night.'},
                {'row_id': 2, 'translated_text': 'The hero arrived.'},
            ]
        )
        self.job = make_job(self.episode, self.user, JobType.SUMMARIZE)

    @patch('apps.processing.tasks.LLMClient')
    def test_completes_and_creates_episode_summary(self, MockLLM):
        MockLLM.return_value.complete.return_value = (
            'A thrilling pilot episode.\n\nKey Topics:\n- Action\n- Mystery\n'
        )

        summarize_task.apply(args=(str(self.job.id),))

        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.COMPLETED)
        summary = EpisodeSummary.objects.filter(episode=self.episode).first()
        self.assertIsNotNone(summary)
        self.assertIn('thrilling pilot', summary.summary_text)
        self.assertIn('Action', summary.key_topics)

    def test_fails_without_translation(self):
        EpisodeTranslation.objects.filter(episode=self.episode).delete()

        summarize_task.apply(args=(str(self.job.id),))

        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.FAILED)

    @patch('apps.processing.tasks.LLMClient')
    def test_upserts_summary_on_rerun(self, MockLLM):
        MockLLM.return_value.complete.return_value = 'First run summary.'
        summarize_task.apply(args=(str(self.job.id),))

        job2 = make_job(self.episode, self.user, JobType.SUMMARIZE)
        MockLLM.return_value.complete.return_value = 'Second run summary.'
        summarize_task.apply(args=(str(job2.id),))

        self.assertEqual(EpisodeSummary.objects.filter(episode=self.episode).count(), 1)
        self.assertIn('Second run', EpisodeSummary.objects.get(episode=self.episode).summary_text)


# ---------------------------------------------------------------------------
# contextual_summary_task
# ---------------------------------------------------------------------------

class ContextualSummaryTaskTest(TestCase):
    def setUp(self):
        _, self.user, self.show, self.season, self.episode = make_hierarchy()
        EpisodeTranslation.objects.create(
            episode=self.episode, language='en',
            translated_rows=[{'row_id': 1, 'translated_text': 'Episode content.'}]
        )
        Question.objects.create(show=self.show, text='What is the main theme?', is_active=True)
        self.job = make_job(self.episode, self.user, JobType.CONTEXTUAL_SUMMARY)

    @patch('apps.processing.tasks.LLMClient')
    def test_completes_and_creates_contextual_summary(self, MockLLM):
        MockLLM.return_value.complete.return_value = 'Contextual insight here.'

        contextual_summary_task.apply(args=(str(self.job.id),))

        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.COMPLETED)
        cs = ContextualSummary.objects.filter(episode=self.episode, user=self.user).first()
        self.assertIsNotNone(cs)
        self.assertEqual(cs.summary_text, 'Contextual insight here.')
        self.assertIn('What is the main theme?', cs.questions_snapshot)

    def test_fails_without_translation(self):
        EpisodeTranslation.objects.filter(episode=self.episode).delete()

        contextual_summary_task.apply(args=(str(self.job.id),))

        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.FAILED)

    def test_fails_without_questions(self):
        Question.objects.all().delete()

        contextual_summary_task.apply(args=(str(self.job.id),))

        self.job.refresh_from_db()
        self.assertEqual(self.job.status, JobStatus.FAILED)

    @patch('apps.processing.tasks.LLMClient')
    def test_creates_new_record_each_run(self, MockLLM):
        MockLLM.return_value.complete.return_value = 'Summary 1.'
        contextual_summary_task.apply(args=(str(self.job.id),))

        job2 = make_job(self.episode, self.user, JobType.CONTEXTUAL_SUMMARY)
        MockLLM.return_value.complete.return_value = 'Summary 2.'
        contextual_summary_task.apply(args=(str(job2.id),))

        self.assertEqual(ContextualSummary.objects.filter(episode=self.episode).count(), 2)
