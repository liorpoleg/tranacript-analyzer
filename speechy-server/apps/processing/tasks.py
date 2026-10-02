import logging
from celery import shared_task
from django.db import transaction

from .models import ProcessingJob, JobStatus
from .services import load_prompt, inject_context, mark_running, mark_completed, mark_failed
from .llm_client import LLMClient, LLMError

logger = logging.getLogger(__name__)


def _get_job(job_id: str) -> ProcessingJob | None:
    try:
        return ProcessingJob.objects.select_related('episode__primary_show').get(id=job_id)
    except ProcessingJob.DoesNotExist:
        logger.error('Job %s not found', job_id)
        return None


def _is_stopped(job: ProcessingJob) -> bool:
    job.refresh_from_db(fields=['status'])
    return job.status == JobStatus.STOPPED


@shared_task(bind=True, max_retries=0)
def translate_task(self, job_id: str):
    job = _get_job(job_id)
    if not job:
        return

    mark_running(job)
    job.append_log('Starting translation...')

    try:
        from apps.episodes.models import Transcript, TranscriptLanguage

        episode = job.episode
        origin = Transcript.objects.filter(
            episode=episode, language=TranscriptLanguage.ORIGIN
        ).first()
        if not origin:
            raise ValueError('No origin transcript found. Upload a transcript first.')

        origin_rows = origin.rows
        job.append_log(f'Loaded {len(origin_rows)} rows from origin transcript.')

        if _is_stopped(job):
            return

        prompt_template = load_prompt('translate')
        client = LLMClient()

        for lang_code, lang_label in [
            (TranscriptLanguage.HEBREW, 'Hebrew'),
            (TranscriptLanguage.ENGLISH, 'English'),
        ]:
            if _is_stopped(job):
                return

            job.append_log(f'Translating to {lang_label}...')

            existing = Transcript.objects.filter(episode=episode, language=lang_code).first()
            existing_count = len(existing.rows) if existing else 0
            new_rows = origin_rows[existing_count:]

            if not new_rows:
                job.append_log(f'All rows already translated to {lang_label}, skipping.')
                continue

            job.append_log(f'{len(new_rows)} new rows to translate to {lang_label}.')

            transcript_text = '\n'.join(
                f'[{i}] {r["character_name"]}: {r["text"]}' for i, r in enumerate(new_rows)
            )
            prompt = inject_context(
                prompt_template,
                TARGET_LANGUAGE=lang_label,
                TRANSCRIPT=transcript_text,
            )
            response = client.complete(prompt)
            translated_rows = _parse_translated_response(response, new_rows)

            with transaction.atomic():
                obj, created = Transcript.objects.get_or_create(
                    episode=episode, language=lang_code,
                    defaults={'rows': translated_rows},
                )
                if not created:
                    obj.rows = list(obj.rows) + translated_rows
                    obj.save(update_fields=['rows', 'updated_at'])

            job.append_log(f'Saved {len(translated_rows)} translated rows in {lang_label}.')

        mark_completed(job)
        job.append_log('Translation completed successfully.')

    except (LLMError, ValueError, Exception) as exc:
        logger.exception('translate_task failed for job %s', job_id)
        mark_failed(job, str(exc))


def _parse_translated_response(response: str, original_rows: list) -> list:
    lines = [line.strip() for line in response.strip().split('\n') if line.strip()]
    translated = []
    for i, original in enumerate(original_rows):
        text = lines[i] if i < len(lines) else original['text']
        if text.startswith(f'[{i}]'):
            text = text[len(f'[{i}]'):].strip()
        translated.append({
            'character_ref': original['character_ref'],
            'character_name': original['character_name'],
            'text': text,
        })
    return translated


@shared_task(bind=True, max_retries=0)
def summarize_task(self, job_id: str):
    job = _get_job(job_id)
    if not job:
        return

    mark_running(job)
    job.append_log('Starting episode summary...')

    try:
        from apps.episodes.models import Transcript, TranscriptLanguage

        episode = job.episode
        transcript = (
            Transcript.objects.filter(episode=episode, language=TranscriptLanguage.ENGLISH).first()
            or Transcript.objects.filter(episode=episode, language=TranscriptLanguage.HEBREW).first()
            or Transcript.objects.filter(episode=episode, language=TranscriptLanguage.ORIGIN).first()
        )
        if not transcript:
            raise ValueError('No transcript found. Upload or translate the episode first.')

        transcript_text = '\n'.join(
            f'{r["character_name"]}: {r["text"]}' for r in transcript.rows
        )
        if _is_stopped(job):
            return

        prompt_template = load_prompt('episode_summary')
        prompt = inject_context(prompt_template, TRANSCRIPT=transcript_text)
        client = LLMClient()
        response = client.complete(prompt)
        summary_text, brief_summary, key_topics = _parse_summary_response(response)

        from apps.episodes.models import EpisodeSummary
        EpisodeSummary.objects.update_or_create(
            episode=episode,
            defaults={
                'summary_text': summary_text,
                'brief_summary': brief_summary,
                'key_topics': key_topics,
            },
        )

        mark_completed(job)
        job.append_log('Summary saved.')

    except (LLMError, ValueError, Exception) as exc:
        logger.exception('summarize_task failed for job %s', job_id)
        mark_failed(job, str(exc))


def _parse_summary_response(response: str) -> tuple[str, str, list[str]]:
    lines = response.strip().split('\n')
    key_topics: list[str] = []
    brief_lines: list[str] = []
    summary_lines: list[str] = []
    in_topics = False
    in_brief = False
    for line in lines:
        stripped = line.strip()
        if stripped.lower().startswith('key topics:') or stripped.lower().startswith('topics:'):
            in_topics, in_brief = True, False
            continue
        if stripped.lower().startswith('brief summary:'):
            in_topics, in_brief = False, True
            continue
        if in_topics and stripped.startswith('-'):
            key_topics.append(stripped.lstrip('- ').strip())
        elif in_topics and stripped == '':
            in_topics = False
        elif in_brief and stripped:
            brief_lines.append(stripped)
        elif in_brief and stripped == '':
            in_brief = False
        else:
            summary_lines.append(line)
    summary_text = '\n'.join(summary_lines).strip()
    brief_summary = ' '.join(brief_lines).strip()
    return summary_text or response.strip(), brief_summary, key_topics


@shared_task(bind=True, max_retries=0)
def contextual_summary_task(self, job_id: str):
    job = _get_job(job_id)
    if not job:
        return

    mark_running(job)
    job.append_log('Starting contextual summary...')

    try:
        from apps.episodes.models import Transcript, TranscriptLanguage

        episode = job.episode
        transcript = (
            Transcript.objects.filter(episode=episode, language=TranscriptLanguage.ENGLISH).first()
            or Transcript.objects.filter(episode=episode, language=TranscriptLanguage.HEBREW).first()
            or Transcript.objects.filter(episode=episode, language=TranscriptLanguage.ORIGIN).first()
        )
        if not transcript:
            raise ValueError('No transcript found. Upload or translate the episode first.')

        transcript_text = '\n'.join(
            f'{r["character_name"]}: {r["text"]}' for r in transcript.rows
        )

        from apps.knowledge.services import get_knowledge_for_episode, get_questions_for_episode
        knowledge_texts = get_knowledge_for_episode(episode)
        questions = get_questions_for_episode(episode)

        if not questions:
            raise ValueError("No active questions found for this episode's show/season.")

        if _is_stopped(job):
            return

        knowledge_block = '\n\n---\n\n'.join(knowledge_texts) if knowledge_texts else '(none)'
        questions_block = '\n'.join(f'{i+1}. {q}' for i, q in enumerate(questions))

        prompt_template = load_prompt('contextual_summary')
        prompt = inject_context(
            prompt_template,
            TRANSCRIPT=transcript_text,
            KNOWLEDGE=knowledge_block,
            QUESTIONS=questions_block,
        )
        client = LLMClient()
        response = client.complete(prompt)

        from apps.episodes.models import ContextualSummary
        ContextualSummary.objects.create(
            episode=episode,
            user=job.triggered_by,
            # Stored as {text: ...} objects, not bare strings — the client's
            # ContextualTab renders each snapshot entry's `.text`.
            questions_snapshot=[{'text': q} for q in questions],
            summary_text=response.strip(),
        )

        mark_completed(job)
        job.append_log('Contextual summary saved.')

    except (LLMError, ValueError, Exception) as exc:
        logger.exception('contextual_summary_task failed for job %s', job_id)
        mark_failed(job, str(exc))
