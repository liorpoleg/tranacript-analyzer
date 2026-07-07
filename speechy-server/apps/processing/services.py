from pathlib import Path
from django.conf import settings

from apps.episodes.models import Episode
from apps.users.models import User
from .models import ProcessingJob, JobType, JobStatus


def load_prompt(name: str) -> str:
    prompts_dir = Path(settings.PROMPTS_DIR)
    path = prompts_dir / f'{name}.md'
    if not path.exists():
        raise FileNotFoundError(f'Prompt file not found: {path}')
    return path.read_text(encoding='utf-8')


def inject_context(template: str, **kwargs) -> str:
    result = template
    for key, value in kwargs.items():
        result = result.replace(f'{{{key}}}', str(value))
    return result


def enqueue_job(episode: Episode, job_type: str, user: User) -> ProcessingJob:
    from .tasks import translate_task, summarize_task, contextual_summary_task

    job = ProcessingJob.objects.create(
        episode=episode,
        job_type=job_type,
        status=JobStatus.PENDING,
        triggered_by=user,
    )
    task_map = {
        JobType.TRANSLATE: translate_task,
        JobType.SUMMARIZE: summarize_task,
        JobType.CONTEXTUAL_SUMMARY: contextual_summary_task,
    }
    task_fn = task_map.get(job_type)
    if task_fn is None:
        job.status = JobStatus.FAILED
        job.append_log(f'Unknown job type: {job_type}')
        job.save(update_fields=['status'])
        return job

    result = task_fn.delay(str(job.id))
    job.celery_task_id = result.id
    job.save(update_fields=['celery_task_id'])
    return job


def mark_running(job: ProcessingJob):
    from django.utils import timezone
    job.status = JobStatus.RUNNING
    job.started_at = timezone.now()
    job.save(update_fields=['status', 'started_at'])


def mark_completed(job: ProcessingJob):
    from django.utils import timezone
    job.status = JobStatus.COMPLETED
    job.completed_at = timezone.now()
    job.save(update_fields=['status', 'completed_at'])


def mark_failed(job: ProcessingJob, error: str):
    from django.utils import timezone
    job.status = JobStatus.FAILED
    job.completed_at = timezone.now()
    job.append_log(f'ERROR: {error}')
    job.save(update_fields=['status', 'completed_at'])


