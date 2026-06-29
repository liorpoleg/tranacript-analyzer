import json
import logging
from celery import shared_task
from django.db import transaction

from .models import ProcessingJob, JobStatus
from .services import (
    load_prompt, inject_context, mark_running, mark_completed, mark_failed,
    read_transcript_rows,
)
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
        episode = job.episode
        if not episode.raw_excel_path:
            raise ValueError('No transcript uploaded for this episode.')

        rows = read_transcript_rows(episode.raw_excel_path)
        job.append_log(f'Read {len(rows)} rows from transcript.')

        if _is_stopped(job):
            return

        prompt_template = load_prompt('translate')
        client = LLMClient()

        from apps.episodes.models import EpisodeTranslation, Language

        for lang_code, lang_label in [('he', 'Hebrew'), ('en', 'English')]:
            if _is_stopped(job):
                return
            job.append_log(f'Translating to {lang_label}...')

            existing = EpisodeTranslation.objects.filter(
                episode=episode, language=lang_code
            ).first()
            existing_ids = set()
            if existing:
                existing_ids = {r['row_id'] for r in existing.translated_rows}

            new_rows = [r for r in rows if r['row_id'] not in existing_ids]
            job.append_log(f'{len(new_rows)} new rows to translate to {lang_label}.')

            if not new_rows:
                job.append_log(f'All rows already translated to {lang_label}, skipping.')
                continue

            transcript_text = '\n'.join(
                f"[{r['row_id']}] {r['original_text']}" for r in new_rows
            )
            prompt = inject_context(
                prompt_template,
                TARGET_LANGUAGE=lang_label,
                TRANSCRIPT=transcript_text,
            )
            response = client.complete(prompt)
            translated_rows = _parse_translated_response(response, new_rows, lang_code)

            with transaction.atomic():
                obj, created = EpisodeTranslation.objects.get_or_create(
                    episode=episode, language=lang_code,
                    defaults={'translated_rows': translated_rows},
                )
                if not created:
                    all_rows = {r['row_id']: r for r in obj.translated_rows}
                    all_rows.update({r['row_id']: r for r in translated_rows})
                    obj.translated_rows = list(all_rows.values())
                    obj.save(update_fields=['translated_rows'])

            job.append_log(f'Saved {len(translated_rows)} translated rows in {lang_label}.')

        mark_completed(job)
        job.append_log('Translation completed successfully.')

    except (LLMError, ValueError, FileNotFoundError, Exception) as exc:
        logger.exception('translate_task failed for job %s', job_id)
        mark_failed(job, str(exc))


def _parse_translated_response(response: str, original_rows: list[dict], language: str) -> list[dict]:
    lines = response.strip().split('\n')
    translated = []
    row_map = {r['row_id']: r for r in original_rows}
    row_ids = [r['row_id'] for r in original_rows]

    for i, line in enumerate(lines):
        if i >= len(row_ids):
            break
        row_id = row_ids[i]
        original = row_map[row_id]
        # Strip leading [id] if LLM echoed it back
        text = line.strip()
        if text.startswith(f'[{row_id}]'):
            text = text[len(f'[{row_id}]'):].strip()
        translated.append({
            'row_id': row_id,
            'original_text': original['original_text'],
            'translated_text': text,
            'language': language,
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
        episode = job.episode
        translation = (
            episode.translations.filter(language='en').first()
            or episode.translations.filter(language='he').first()
        )
        if not translation:
            raise ValueError('No translation found. Translate the episode first.')

        transcript_text = '\n'.join(
            f"[{r['row_id']}] {r['translated_text']}"
            for r in translation.translated_rows
        )
        if _is_stopped(job):
            return

        prompt_template = load_prompt('episode_summary')
        prompt = inject_context(prompt_template, TRANSCRIPT=transcript_text)
        client = LLMClient()
        response = client.complete(prompt)

        summary_text, key_topics = _parse_summary_response(response)

        from apps.episodes.models import EpisodeSummary
        EpisodeSummary.objects.update_or_create(
            episode=episode,
            defaults={'summary_text': summary_text, 'key_topics': key_topics},
        )

        mark_completed(job)
        job.append_log('Summary saved.')

    except (LLMError, ValueError, Exception) as exc:
        logger.exception('summarize_task failed for job %s', job_id)
        mark_failed(job, str(exc))


def _parse_summary_response(response: str) -> tuple[str, list[str]]:
    lines = response.strip().split('\n')
    key_topics = []
    summary_lines = []
    in_topics = False
    for line in lines:
        stripped = line.strip()
        if stripped.lower().startswith('key topics:') or stripped.lower().startswith('topics:'):
            in_topics = True
            continue
        if in_topics and stripped.startswith('-'):
            key_topics.append(stripped.lstrip('- ').strip())
        elif in_topics and stripped == '':
            in_topics = False
        else:
            summary_lines.append(line)
    summary_text = '\n'.join(summary_lines).strip()
    return summary_text or response.strip(), key_topics


@shared_task(bind=True, max_retries=0)
def contextual_summary_task(self, job_id: str):
    job = _get_job(job_id)
    if not job:
        return

    mark_running(job)
    job.append_log('Starting contextual summary...')

    try:
        episode = job.episode
        translation = (
            episode.translations.filter(language='en').first()
            or episode.translations.filter(language='he').first()
        )
        if not translation:
            raise ValueError('No translation found. Translate the episode first.')

        transcript_text = '\n'.join(
            f"[{r['row_id']}] {r['translated_text']}"
            for r in translation.translated_rows
        )

        from apps.knowledge.services import get_knowledge_for_episode, get_questions_for_episode
        knowledge_texts = get_knowledge_for_episode(episode)
        questions = get_questions_for_episode(episode)

        if not questions:
            raise ValueError('No active questions found for this episode\'s show/season.')

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
            questions_snapshot=questions,
            summary_text=response.strip(),
        )

        mark_completed(job)
        job.append_log('Contextual summary saved.')

    except (LLMError, ValueError, Exception) as exc:
        logger.exception('contextual_summary_task failed for job %s', job_id)
        mark_failed(job, str(exc))
